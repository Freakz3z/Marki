import type { NavItem, DocContent } from '../types';
import matter from 'gray-matter';
import { loadConfig } from './config';

// --- Local Files (Build-time) ---
const summaryModules = import.meta.glob('/docs/SUMMARY.md', { query: '?raw', import: 'default', eager: true });
const docModules = import.meta.glob('/docs/**/*.md', { query: '?raw', import: 'default' });

// --- Helpers ---

// Normalize path to internal routing format
// For local mode: /docs/...
// For remote mode: /... (no prefix)
const normalizePath = (p: string, localMode: boolean = true): string => {
  let cleanPath = p.trim();
  if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

  // For local mode, add /docs/ prefix if not already present
  if (localMode) {
    if (cleanPath.startsWith('docs/')) {
      return `/${cleanPath}`;
    }
    return `/docs/${cleanPath}`;
  }

  // For remote mode, don't add /docs/ prefix
  return `/${cleanPath}`;
};

// --- Parse Logic (Shared) ---

export const parseSummary = (content: string, localMode: boolean = true): NavItem[] => {
  const lines = content.split('\n');
  const root: NavItem[] = [];
  let currentSection: NavItem | null = null;
  const stack: { level: number; items: NavItem[] }[] = [{ level: -1, items: root }];

  const listRegex = /^(\s*)[-*+]\s+\[(.*?)\]\((.*?)\)/;
  const folderRegex = /^(\s*)[-*+]\s+(.+)$/;
  const headerRegex = /^(#{2,})\s+(.*)$/;

  lines.forEach(line => {
    // Check for Section Header (## ...)
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      const title = headerMatch[2].trim();
      currentSection = {
        title,
        path: '', 
        children: []
      };
      root.push(currentSection);
      stack.length = 0;
      stack.push({ level: -1, items: currentSection.children! }); 
      return;
    }

    // Check for List Item with Link
    const linkMatch = line.match(listRegex);
    if (linkMatch) {
      const indent = linkMatch[1].length;
      const title = linkMatch[2];
      const linkPath = linkMatch[3];

      const isExternal = linkPath.startsWith('http://') || linkPath.startsWith('https://');
      const normalizedPath = normalizePath(linkPath, localMode);

      const item: NavItem = {
        title,
        path: isExternal ? linkPath : normalizedPath,
        children: []
      };
      addToStack(item, indent);
      return;
    }

    // Check for List Item acting as Folder
    const folderMatch = line.match(folderRegex);
    if (folderMatch) {
      const indent = folderMatch[1].length;
      const title = folderMatch[2].trim();
      const item: NavItem = {
        title,
        path: '', 
        children: []
      };
      addToStack(item, indent);
    }
  });

  function addToStack(item: NavItem, indent: number) {
      if (!currentSection && stack.length === 1 && stack[0].items === root) {
         // Keep default behavior
      }
      while (stack.length > 1 && indent <= stack[stack.length - 1].level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      parent.items.push(item);
      stack.push({ level: indent, items: item.children! });
  }

  return root;
};

// --- Navigation ---

export const getNavigation = async (): Promise<NavItem[]> => {
  const config = await loadConfig();

  // Check mode: default to 'local' if not specified, but use 'remote' if githubRepo is set and mode is not explicitly 'local'
  const useRemote = config.mode === 'remote' || (!config.mode && config.githubRepo);

  if (useRemote) {
    // Remote Mode
    try {
      const branch = config.branch || 'main';
      const url = `https://raw.githubusercontent.com/${config.githubRepo}/${branch}/SUMMARY.md`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch SUMMARY.md: ${res.statusText}`);
      const text = await res.text();
      return parseSummary(text, false); // remote mode: don't add /docs/ prefix
    } catch (e) {
      console.error("Remote navigation load failed", e);
      return [];
    }
  } else {
    // Local Mode
    const key = '/docs/SUMMARY.md';
    const raw = (summaryModules[key] as string) || '';
    return parseSummary(raw, true); // local mode: add /docs/ prefix
  }
};

// --- Document Loading ---

// Helper to fetch history
async function fetchHistory(repo: string, branch: string, path: string) {
    try {
        const url = `https://api.github.com/repos/${repo}/commits?path=${path}&sha=${branch}&per_page=100`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const commits = await res.json();
        if (Array.isArray(commits) && commits.length > 0) {
            const lastCommit = commits[0];
            const firstCommit = commits[commits.length - 1];
            return {
                lastModified: lastCommit.commit.author.date,
                lastModifiedBy: lastCommit.author?.login || lastCommit.commit.author.name,
                createdBy: firstCommit.author?.login || firstCommit.commit.author.name,
                created: firstCommit.commit.author.date // or committer.date
            };
        }
    } catch { return null; }
    return null;
}

export const loadDocument = async (path: string): Promise<DocContent | null> => {
  const config = await loadConfig(); // Ensure config is loaded

  // Check mode: default to 'local' if not specified, but use 'remote' if githubRepo is set and mode is not explicitly 'local'
  const useRemote = config.mode === 'remote' || (!config.mode && config.githubRepo);

  if (useRemote) {
    // Remote Mode
    try {
      const branch = config.branch || 'main';
      // In remote mode, path doesn't have /docs/ prefix, just remove leading /
      const relPath = path.startsWith('/') ? path.slice(1) : path;
      const url = `https://raw.githubusercontent.com/${config.githubRepo}/${branch}/${relPath}`;

      let res = await fetch(url);
      if (!res.ok) {
          if (!url.endsWith('.md')) {
             const urlMd = url + '.md';
             res = await fetch(urlMd);
             if (!res.ok) {
                 return null;
             }
          } else {
              return null;
          }
      }
      const text = await res.text();
      // Base URL for assets
      const currentDir = relPath.substring(0, relPath.lastIndexOf('/'));
      const baseUrl = `https://raw.githubusercontent.com/${config.githubRepo}/${branch}/${currentDir ? currentDir + '/' : ''}`;

      const doc = parseRemoteContent(text, path, baseUrl);

      // Attempt to fetch metadata (non-blocking if possible, but we need it for render)
      // Usually we await, or we could load it later. For now, await basic info.
      if (!config.githubRepo) {
        return doc;
      }
      const history = await fetchHistory(config.githubRepo, branch, relPath);
      if (history) {
          doc.metadata.lastModified = history.lastModified;
          doc.metadata.lastModifiedBy = history.lastModifiedBy;
          doc.metadata.createdBy = history.createdBy;
          doc.metadata.created = history.created;
      }
      
      return doc;
    } catch (e) {
      console.error(`Error loading remote doc ${path}:`, e);
      return null;
    }
  }

  // Local Mode
  let loader = docModules[path];
  
  if (!loader) {
    // Robust lookup
    const matchedKey = Object.keys(docModules).find(key => key.endsWith(path));
    if (matchedKey) loader = docModules[matchedKey];
  }

  if (!loader) {
    if (!path.endsWith('.md')) {
        return loadDocument(path + '.md');
    }
    if (docModules[path + '/README.md']) {
      return loadDocument(path + '/README.md');
    }
    return null;
  }

  try {
    const rawContent = await loader() as string;
    const { data, content } = matter(rawContent);
    // Fallback title
    if (!data.title) {
       data.title = extractTitle(content, path);
    }

    return {
      path,
      content,
      metadata: data
    };
  } catch (e) {
    console.error(`Error loading document ${path}:`, e);
    return null;
  }
};

function parseRemoteContent(rawContent: string, path: string, baseUrl?: string): DocContent {
    const { data, content } = matter(rawContent);
    
    // Rewrite image links
    let processedContent = content;
    if (baseUrl) {
        // Match ![alt](url)
        processedContent = content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
            if (url.startsWith('http') || url.startsWith('//')) {
                return match;
            }
            // Handle root relative /assets/img.png -> maps to repo root?
            // Usually in github wikis / means root of repo.
            let fullUrl = '';
            if (url.startsWith('/')) {
                 // Need repo root
                 // baseUrl is .../foo/ , we need to strip back to .../branch/
                 // Simple hack: baseUrl specific logic in caller might be key, but here let's try relative resolution
                 // If url is /assets/img.png, and baseUrl is .../branch/foo/, we might strictly need .../branch/assets/img.png
                 // But typically markdown in repos uses relative paths mostly.
                 // Let's assume relative for now or just treat / as relative to domain (which breaks).
                 // Actually, raw.githubusercontent handles relative paths well if we just prepend base.
                 
                 // If it starts with /, it's relative to domain root in standard web, but in git it might mean repo root.
                 // Let's assume relative safely:
                 const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
                 fullUrl = new URL(cleanUrl, baseUrl).href;
            } else {
                 fullUrl = new URL(url, baseUrl).href;
            }
            return `![${alt}](${fullUrl})`; 
        });
        
        // Also rewrite <img src="..."> tags
        processedContent = processedContent.replace(/<img\s+[^>]*src=["']([^"']*)["'][^>]*>/g, (match, url) => {
             if (url.startsWith('http') || url.startsWith('//')) return match;
             const fullUrl = new URL(url, baseUrl).href;
             return match.replace(url, fullUrl);
        });
    }

    if (!data.title) {
       data.title = extractTitle(content, path);
    }
    return {
        path,
        content: processedContent,
        metadata: data
    };
}

function extractTitle(content: string, path: string) {
    const h1Match = content.match(/^#\s+(.*)$/m);
    if (h1Match) return h1Match[1].trim();
    const filename = path.split('/').pop();
    return filename?.replace(/^\d+[-_]/, '').replace(/\.md$/, '').replace(/[-_]/g, ' ') || 'Untitled';
}

// --- Search ---

// Helper to flatten the entire nav tree
function flattenNav(items: NavItem[]): NavItem[] {
    let flat: NavItem[] = [];
    for (const item of items) {
        flat.push(item);
        if (item.children) {
            flat = flat.concat(flattenNav(item.children));
        }
    }
    return flat;
}

export const searchDocs = async (query: string): Promise<any[]> => {
  const config = await loadConfig();
  const q = query.toLowerCase();

  // Check mode: default to 'local' if not specified, but use 'remote' if githubRepo is set and mode is not explicitly 'local'
  const useRemote = config.mode === 'remote' || (!config.mode && config.githubRepo);

  if (useRemote) {
      // Remote search: Fetch navigation, then fetch content of pages lazily or simply?
      // Since we can't search server-side, we must fetch pages.
      // Optimization: Fetch only when query > 2 chars.
      // To avoid killing the rate limit, we might only search titles or key pages?
      // Or we accept it's slow.
      // Better strategy: We can't easily grep raw github content without fetching.
      // Let's implement a 'Title only' search for remote to be fast,
      // OR a slow full text search. Let's start with Title Search + Fetching ~5-10 pages matches?
      // Actually, best user experience for client-side remote search:
      // 1. Search Titles first (instant)
      // 2. Return results.

      // Let's robustly get navigation
      let nav: NavItem[] = [];
      try {
        const text = await (await fetch(`https://raw.githubusercontent.com/${config.githubRepo}/${config.branch || 'main'}/SUMMARY.md`)).text();
        nav = parseSummary(text, false); // remote mode: don't add /docs/ prefix
      } catch { return []; }

      const flat = flattenNav(nav);
      // Filter by title
      const titleMatches = flat.filter(item => item.title.toLowerCase().includes(q) && item.path && !item.path.startsWith('http'));

      return titleMatches.map(item => ({
          title: item.title,
          path: item.path,
          snippet: 'Title match'
      }));
  }

  // Local search
  const results: any[] = [];
  for (const [path, loader] of Object.entries(docModules)) {
      if (path === '/docs/SUMMARY.md') continue;
      try {
        const raw = await loader() as string;
        const { content, data } = matter(raw);
        const title = data.title || extractTitle(content, path);
        if (title.toLowerCase().includes(query.toLowerCase()) || content.toLowerCase().includes(query.toLowerCase())) {
             results.push({
                 title,
                 path,
                 snippet: content.slice(0, 100).replace(/[#*`]/g, '')
             });
        }
      } catch {}
  }
  return results;
};

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';
import GithubSlugger from 'github-slugger';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const stripMarkdown = (text: string) => {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`([^`]+)`/g, '$1') // code
    .replace(/~~(.*?)~~/g, '$1'); // strikethrough
};

export const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const slugger = new GithubSlugger();
    // Match all headers # to ###### (but usually we only care about 1-4 for TOC)
    // Also ignore headers inside code blocks (handled simply by checking start of line)
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const rawText = match[2].trim();
      const cleanText = stripMarkdown(rawText);
      const id = slugger.slug(cleanText);

      items.push({
        id,
        text: cleanText,
        level: level
      });
    }
    setHeadings(items);
    
    // Scroll to top on route change (handled by layout usually, but ensures sync)
    // window.scrollTo(0, 0); 
  }, [content, location.pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    // Preserve space even if empty
    return <div className="hidden xl:block w-64 shrink-0 pl-8 order-2"></div>;
  }

  return (
    <div className="hidden xl:block w-64 min-w-[16rem] shrink-0 pl-8 order-2">
       <div className="sticky top-6">
         <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
           On This Page
         </h4>
         <ul className="space-y-1 text-sm">
           {headings.map((heading, idx) => (
             <li key={idx}>
               <a
                 href={`#${heading.id}`}
                 className={clsx(
                   "block py-1.5 px-3 rounded-md transition-all duration-200 truncate",
                   activeId === heading.id
                     ? "bg-primary/10 text-primary font-medium"
                     : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                 )}
                 style={{ marginLeft: `${Math.max(0, heading.level - 2) * 12}px` }}
                 onClick={(e) => {
                   e.preventDefault();
                   document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                   setActiveId(heading.id);
                 }}
               >
                 {heading.text}
               </a>
             </li>
           ))}
         </ul>
       </div>
    </div>
  );
};

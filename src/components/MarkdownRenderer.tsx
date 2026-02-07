import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css'; // Or another style
import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';

interface MarkdownRendererProps {
  content: string;
  filePath: string; // The path of the current markdown file, for relative path resolution
}

// Helper to resolve relative paths
const resolvePath = (base: string, relative: string) => {
  if (relative.startsWith('http') || relative.startsWith('/')) return relative;
  
  // base is like "/docs/folder/file.md"
  // remove filename
  const parts = base.split('/').slice(0, -1);
  const relParts = relative.split('/');

  for (const part of relParts) {
    if (part === '.') continue;
    if (part === '..') {
      if (parts.length > 0) parts.pop();
    } else {
      parts.push(part);
    }
  }
  
  return parts.join('/');
};

const CustomPre = ({ children, ...props }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLPreElement>, HTMLPreElement>) => {
  const [copied, setCopied] = useState(false);
  // Remove unused ref if not needed
  // const codeRef = React.useRef<HTMLElement>(null);

  // Extract text from children (which is usually a <code> element)
  const getCodeText = () => {
    let text = '';
    React.Children.forEach(children, child => {
      if (React.isValidElement(child)) {
         const props = child.props as { children?: React.ReactNode | React.ReactNode[] };
         if (props.children) {
            text += extractTextFromNode(props.children);
         }
      }
    });
    return text;
  };

  // Recursively extract text content from React nodes
  const extractTextFromNode = (node: React.ReactNode | React.ReactNode[]): string => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractTextFromNode).join('');
    }
    if (React.isValidElement(node)) {
      const props = node.props as { children?: React.ReactNode | React.ReactNode[] };
      if (props?.children) {
        return extractTextFromNode(props.children);
      }
    }
    return '';
  };

  const handleCopy = () => {
    const text = getCodeText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={clsx(
          "absolute right-2 top-2 p-1.5 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity",
          copied && "text-green-400"
        )}
        title="Copy code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre className="!mt-0 rounded-lg" {...props}>{children}</pre>
    </div>
  );
};

export const MarkdownRenderer = ({ content, filePath }: MarkdownRendererProps) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
        components={{
          pre: CustomPre,
          img: ({ src, alt, ...props }) => {
            const resolvedSrc = src ? resolvePath(filePath, src) : '';
            // Since images are not imported by JS, we rely on Vite serving public or root files.
            // If images are inside docs folder, and docs is in root, /docs/... should work.
            return <img src={resolvedSrc} alt={alt} {...props} loading="lazy" />;
          },
          a: ({ href, children, ...props }) => {
            // Handle relative links to other MD files
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                const resolved = resolvePath(filePath, href);
                // If it ends with .md, route to /view/...
                if (resolved.endsWith('.md')) {
                    // We need to route internally
                    return <a href={`/view${resolved}`} {...props}>{children}</a>
                }
            }
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel="noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

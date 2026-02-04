import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';
import GithubSlugger from 'github-slugger';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAppStore } from '@/store';

interface TocItem {
  id: string;
  text: string;
  level: number;
  parentId?: string;
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
  const [scrollState, setScrollState] = useState<'top' | 'middle' | 'bottom' | 'none'>('top');
  
  const { isTocCollapsed, toggleToc } = useAppStore();
  
  const tocRef = useRef<HTMLUListElement>(null);
  const location = useLocation();

  // Scroll detection logic for TOC container
  const checkScroll = () => {
    const el = tocRef.current;
    if (!el) return;
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    
    if (scrollHeight <= clientHeight) {
      setScrollState('none');
      return;
    }

    const isTop = scrollTop <= 0;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 2;

    if (isTop) setScrollState('top');
    else if (isBottom) setScrollState('bottom');
    else setScrollState('middle');
  };

  useEffect(() => {
    checkScroll();
    const el = tocRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Resize observer to handle window resize or content changes
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [headings]);

  // Auto-scroll TOC to active item
  useEffect(() => {
    if (activeId && tocRef.current) {
      const activeLink = tocRef.current.querySelector(`a[href="#${activeId}"]`);
      if (activeLink) {
         // Use scrollIntoView with block: 'nearest' to minimize jumping
         activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeId]);

  useEffect(() => {
    const slugger = new GithubSlugger();
    const regex = /^(#{1,6})\s+(.+)$/gm;
    // Remove code blocks before parsing headers to avoid false positives inside code examples
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/~~~[\s\S]*?~~~/g, '');

    const items: TocItem[] = [];
    const parentStack: TocItem[] = [];
    
    let match;
    while ((match = regex.exec(cleanContent)) !== null) {
      const level = match[1].length;
      const rawText = match[2].trim();
      const cleanText = stripMarkdown(rawText);
      const id = slugger.slug(cleanText);

      const item: TocItem = { id, text: cleanText, level };

      // Determine parent
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
         parentStack.pop();
      }
      if (parentStack.length > 0) {
         item.parentId = parentStack[parentStack.length - 1].id;
      }
      
      parentStack.push(item);
      items.push(item);
    }
    setHeadings(items);
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
    return <div className="hidden xl:block w-64 shrink-0 pl-4 order-2"></div>;
  }

  return (
    <div 
      className={clsx(
        "hidden xl:block shrink-0 order-2 transition-all duration-300 ease-in-out h-full pl-4",
        isTocCollapsed ? "w-12" : "w-64 min-w-[16rem]"
      )}
    >
       <div className="sticky top-6 relative flex flex-col h-full">
         <div className="flex items-center justify-between mb-4 w-full">
            {!isTocCollapsed && (
              <h4 className="flex-1 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider whitespace-nowrap overflow-hidden">
                On This Page
              </h4>
            )}
            <button
              onClick={toggleToc}
              className={clsx(
                "p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors",
                isTocCollapsed ? "mx-auto" : ""
              )}
              title={isTocCollapsed ? "Expand TOC" : "Collapse TOC"}
            >
               {isTocCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            </button>
         </div>
         
         <div className={clsx(
            "relative flex-1 overflow-hidden transition-opacity duration-300",
            isTocCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
         )}>
           {/* Scroll Hints - Top */}
           <div 
             className={clsx(
               "absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-[#111] to-transparent z-10 pointer-events-none transition-opacity duration-300",
               (scrollState === 'middle' || scrollState === 'bottom') ? "opacity-100" : "opacity-0"
             )} 
           />

           <ul 
             ref={tocRef}
             className="space-y-1 text-sm max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2 pb-2"
           >
             {headings.map((heading) => (
               <li key={heading.id}>
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
                     setActiveId(heading.id); // Set immediate feedback
                     const el = document.getElementById(heading.id);
                     if (el) {
                        // scrollIntoView with block: 'start' aligns it to top (respecting scroll-margin)
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }
                   }}
                 >
                   {heading.text}
                 </a>
               </li>
             ))}
           </ul>

           {/* Scroll Hints - Bottom */}
           <div 
             className={clsx(
               "absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-[#111] to-transparent z-10 pointer-events-none transition-opacity duration-300",
               (scrollState === 'middle' || scrollState === 'top') ? "opacity-100" : "opacity-0"
             )} 
           />
         </div>
       </div>
    </div>
  );
};

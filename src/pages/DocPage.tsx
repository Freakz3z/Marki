import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadDocument, getNavigation } from '@/services/docs';
import type { DocContent, NavItem } from '@/types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { TableOfContents } from '../components/TableOfContents';
import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { useScrollClass } from '@/hooks/useScrollClass';
import clsx from 'clsx';

// Flatten nav items to find prev/next
const flattenNav = (items: NavItem[]): NavItem[] => {
  let flat: NavItem[] = [];
  items.forEach(item => {
      flat.push(item);
      if (item.children) {
          flat = flat.concat(flattenNav(item.children));
      }
  });
  return flat;
};

export const DocPage = () => {
  const params = useParams(); // returns "*"
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Construct path from params
  // The route will be /view/*
  // so params["*"] is the path
  let path = params["*"] || '';
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.startsWith('/docs/')) path = '/docs' + path;
  
  const [prevDoc, setPrevDoc] = useState<NavItem | null>(null);
  const [nextDoc, setNextDoc] = useState<NavItem | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Apply scroll detection
  useScrollClass(scrollContainerRef);

  useEffect(() => {
    const handleScroll = () => {
       if (scrollContainerRef.current) {
          setShowBackToTop(scrollContainerRef.current.scrollTop > 300);
       }
    };
    
    const el = scrollContainerRef.current;
    if (el) {
       el.addEventListener('scroll', handleScroll);
       return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [loading, doc]);

  const scrollToTop = () => {
     scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      const [data, navigation] = await Promise.all([
         loadDocument(path),
         getNavigation()
      ]);
      setDoc(data);

      const flatNav = flattenNav(navigation).filter(n => !n.children || n.children.length === 0);
      
      // Clean path logic
      // doc path is normalized to /docs/...
      // nav item path is /docs/...
      const currentIndex = flatNav.findIndex(n => n.path === path || n.path === path + '.md');
      const currentItem = flatNav[currentIndex];

      if (currentItem && data) {
         data.metadata.title = currentItem.title;
      }
      
      setPrevDoc(currentIndex > 0 ? flatNav[currentIndex - 1] : null);
      setNextDoc(currentIndex !== -1 && currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null);
      
      setLoading(false);
    };
    fetchDoc();
  }, [path]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>;
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
        <p className="text-gray-500 mb-4">Could not load path: {path}</p>
        <Link to="/" className="text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full relative overflow-hidden">
        {/* Scrollable Content Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto h-full scroll-smooth custom-scrollbar relative px-4 md:px-8 py-6"
        >
          <div className="max-w-4xl mx-auto xl:mx-0 w-full">
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2 font-mono">{doc.path.replace(/^\/docs\//, '')}</div>
              <h1 className="text-4xl font-bold mb-2 break-words">{doc.metadata.title || 'Untitled'}</h1>
              {doc.metadata.lastModified && (
                 <div className="text-sm text-gray-500">
                   最后更新: {new Date(doc.metadata.lastModified).toLocaleString()}
                 </div>
              )}
            </div>
            
            <MarkdownRenderer content={doc.content} filePath={doc.path} />
            
            <div className="mt-12">
                 <div className={ `grid gap-4 ${prevDoc && nextDoc ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}` }>
                  {prevDoc && (
                    <Link 
                      to={`/view${prevDoc.path}`} 
                      className="flex flex-col p-4 rounded-lg border border-border hover:border-primary hover:bg-surface/50 transition-all group text-left"
                    >
                      <div className="flex items-center text-xs text-gray-500 mb-1 group-hover:text-primary">
                        <ChevronLeft className="mr-1 h-3 w-3" />
                        <span>Previous</span>
                      </div>
                      <span className="font-semibold text-base truncate w-full group-hover:text-primary transition-colors">{prevDoc.title}</span>
                    </Link>
                  )}
                  
                  {nextDoc && (
                    <Link 
                      to={`/view${nextDoc.path}`} 
                      className="flex flex-col p-4 rounded-lg border border-border hover:border-primary hover:bg-surface/50 transition-all group text-right items-end"
                    >
                      <div className="flex items-center text-xs text-gray-500 mb-1 group-hover:text-primary">
                        <span>Next</span>
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </div>
                      <span className="font-semibold text-base truncate w-full group-hover:text-primary transition-colors">{nextDoc.title}</span>
                    </Link>
                  )}
                </div>

                 <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-400 gap-2 mt-8 pt-8 border-t border-border border-dashed">
                    <div className="flex flex-col gap-1">
                       {doc.metadata.createdBy && (
                          <span className="flex items-center gap-1">
                             创建者: <span className="font-medium text-text dark:text-gray-200">{doc.metadata.createdBy}</span>
                          </span>
                       )}
                       {doc.metadata.lastModifiedBy && (
                           <span className="flex items-center gap-1">
                              最后更新: <span className="font-medium text-text dark:text-gray-200">{doc.metadata.lastModifiedBy}</span>
                           </span>
                       )}
                    </div>
                    <div className="flex flex-col gap-1 sm:text-right">
                       {doc.metadata.created && (
                          <span>创建于: {new Date(doc.metadata.created).toLocaleDateString()}</span>
                       )}
                       {doc.metadata.lastModified && (
                          <span>更新于: {new Date(doc.metadata.lastModified).toLocaleString()}</span>
                       )}
                    </div>
                 </div>
          </div>
        </div>
      </div>
      
      {/* TOC needs to listen to scroll events from content area, but TOC logic expects window scroll mainly or IntersectionObserver which works with any root. 
          We need to verify if TableOfContents works when headers are in a scrolling div, not document.body.
          (Update: IntersectionObserver works with any ancestor if root is null (viewport) or specified).
        */}
      <div className="h-full pt-6 relative border-l border-border/50">
           <TableOfContents content={doc.content} />
           
           {/* Back To Top Button - positioned at bottom right of scrollbar line */}
           <button
            onClick={scrollToTop}
            className={clsx(
              "absolute bottom-8 -left-4 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg text-gray-500 hover:text-primary hover:border-primary transition-all duration-300 z-50",
              showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
            title="Back to Top"
           >
             <ArrowUp size={16} />
           </button>
      </div>

    </div>
  );
};

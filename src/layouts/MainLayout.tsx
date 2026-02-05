import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { useAppStore } from '@/store';
import { getNavigation } from '@/services/docs';
import { useScrollClass } from '@/hooks/useScrollClass';
import clsx from 'clsx';
import { X } from 'lucide-react';
import type { NavItem } from '@/types';

export const MainLayout = () => {
  const { isSidebarOpen, closeSidebar, theme } = useAppStore();
  const location = useLocation();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Apply scroll detection
  useScrollClass(sidebarRef);
  useScrollClass(mainRef);

  useEffect(() => {
    const init = async () => {
       const items = await getNavigation();
       setNavItems(items);
    };
    init();
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className={clsx("h-screen bg-background text-text flex flex-col overflow-hidden", theme)}>
      <Navbar />
      <div className="flex flex-1 w-full md:px-4 overflow-hidden">
        {/* Sidebar for Desktop */}
         <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-border h-full bg-background z-30">
           <div 
             ref={sidebarRef}
             className="flex-1 overflow-y-auto py-6 pr-4 pl-2 custom-scrollbar"
            >
             <Sidebar items={navItems} />
           </div>
           <div className="p-4 border-t border-border mt-auto">
              <a href="https://limnovwebsite.89b52195.er.aliyun-esa.net/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-border">
                  <span className="whitespace-nowrap">由 Limnov 提供支持</span>
                  <img src="/Limnov.jpg" alt="Limnov" className="h-6 w-6 rounded-full object-cover" />
              </a>
           </div>
         </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={closeSidebar} />
            <div className="relative w-4/5 max-w-sm bg-background h-full shadow-xl flex flex-col animate-in slide-in-from-left">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={closeSidebar}><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <Sidebar items={navItems} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main 
          className="flex-1 min-w-0 overflow-hidden flex flex-col h-full bg-background"
        >
             <Outlet />
        </main>
      </div>
    </div>
  );
};

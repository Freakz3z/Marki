import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { NavItem } from '../types';
import { useAppStore } from '../store';
import clsx from 'clsx';

const SidebarItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
  const [isOpen, setIsOpen] = useState(false); // Default closed
  const location = useLocation();
  const closeSidebar = useAppStore(state => state.closeSidebar);
  
  // Clean path for comparison. 
  const isActive = item.path ? (location.pathname.endsWith(item.path) || location.pathname === item.path.replace(/^\/docs/, '')) : false;
  
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
            level > 0 && "ml-3"
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          <span className="truncate flex-1 text-left">{item.title}</span>
          {isOpen ? <ChevronDown size={16} className="ml-1 text-gray-400" /> : <ChevronRight size={16} className="ml-1 text-gray-400" />}
        </button>
        {isOpen && (
          <div className="mt-1">
            {item.children!.map((child, idx) => (
              <SidebarItem key={idx} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!item.path) return null;

  // Check external
  if (item.path.startsWith('http://') || item.path.startsWith('https://')) {
      return (
        <a 
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md transition-colors mb-1",
            "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 group"
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
             if (window.innerWidth < 768) closeSidebar();
          }}
        >
          <span className="truncate flex-1">{item.title}</span>
          <ExternalLink size={14} className="ml-2 text-gray-400" />
        </a>
      );
  }

  // Leaf node
  // We need to route to a URL that can be captured.
  const targetUrl = `/view${item.path}`;

  return (
    <NavLink
      to={targetUrl}
      className={({ isActive: isLinkActive }) => clsx(
        "flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md transition-colors mb-1",
        (isActive || isLinkActive) 
          ? "text-blue-700 dark:text-blue-300 font-bold" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
      )}
      style={{ paddingLeft: `${level * 12 + 12}px` }}
      onClick={() => {
        if (window.innerWidth < 768) closeSidebar();
      }}
    >
      <span className="truncate">{item.title}</span>
    </NavLink>
  );
};

export const Sidebar = ({ items }: { items: NavItem[] }) => {
  return (
    <nav className="space-y-1">
      {items.map((item, idx) => {
        // Treat top-level items with children and no path as Section Headers (non-collapsible)
        if (item.children && item.children.length > 0 && !item.path) {
          return (
            <div key={idx} className={clsx("mb-2", idx !== 0 && "mt-8")}>
               <h3 className="mx-2 px-3 py-1.5 mb-2 rounded-md text-sm font-bold text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                 {item.title}
               </h3>
               <div className="space-y-0.5">
                 {item.children.map((child, cIdx) => (
                   <SidebarItem key={cIdx} item={child} level={0} />
                 ))}
               </div>
            </div>
          );
        }
        return <SidebarItem key={idx} item={item} />;
      })}
    </nav>
  );
};

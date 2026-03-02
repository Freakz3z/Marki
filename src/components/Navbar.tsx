import { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Search, X, Github } from 'lucide-react';
import { useAppStore } from '@/store';
import { searchDocs } from '@/services/docs';
import { loadConfig } from '@/services/config';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { toggleSidebar, theme, toggleTheme } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [title, setTitle] = useState('Marki');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [repo, setRepo] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    loadConfig().then(config => {
      if (config.navbarTitle) setTitle(config.navbarTitle);
      if (config.logoPath) setLogo(config.logoPath);
      if (config.githubRepo) setRepo(config.githubRepo);
    });
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        const results = await searchDocs(searchTerm);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full h-14 items-center px-4">
        <button
          className="mr-2 md:hidden p-2 rounded-md hover:bg-surface"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2 font-bold text-xl">
            {logo && <img src={logo} alt="Logo" className="h-8 w-8 rounded-md object-cover" />}
            <span className="hidden font-bold sm:inline-block">{title}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索..."
                className="h-9 w-full rounded-md border border-border bg-surface px-8 py-2 text-sm md:w-64 lg:w-80 outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
              />
              {searchTerm && (
                <button 
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchTerm.length > 1 && (
              <div className="absolute top-full text-left mt-2 w-full md:w-96 right-0 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                 {searchResults.length === 0 ? (
                   <div className="p-4 text-sm text-center text-gray-500">No results found</div>
                 ) : (
                   searchResults.map((result, idx) => (
                     <div 
                        key={idx} 
                        className="p-3 hover:bg-surface cursor-pointer border-b border-border last:border-0"
                        onClick={() => {
                          navigate(`/view${result.path}`);
                          setIsSearchOpen(false);
                          setSearchTerm('');
                        }}
                     >
                       <div className="font-medium text-sm text-primary">{result.title}</div>
                       <div className="text-xs text-gray-500 mt-1 line-clamp-2">{result.snippet}...</div>
                     </div>
                   ))
                 )}
              </div>
            )}
            
            {/* Overlay to close search on click outside */}
            {isSearchOpen && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSearchOpen(false)} style={{pointerEvents: 'none'}} /> 
            )} 
            {/* Need proper click-outside logic, keeping simple for now by only closing when picking result. fixed inset-0 blocks input if z is wrong */}
          </div>

          <nav className="flex items-center space-x-2">
            {repo && (
              <a
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md hover:bg-surface"
                title="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-surface"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

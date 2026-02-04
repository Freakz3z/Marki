import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isSidebarOpen: boolean;
  isTocCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  toggleToc: () => void;
  setTocCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSidebarOpen: false, // Mobile default closed, Desktop logic handled in Layout
      isTocCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
      openSidebar: () => set({ isSidebarOpen: true }),
      toggleToc: () => set((state) => ({ isTocCollapsed: !state.isTocCollapsed })),
      setTocCollapsed: (collapsed) => set({ isTocCollapsed: collapsed }),
      theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      })
    }),
    {
      name: 'marki-storage',
      partialize: (state) => ({ theme: state.theme, isTocCollapsed: state.isTocCollapsed }),
      onRehydrateStorage: () => (state) => {
        // Ensure class is applied on load
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);

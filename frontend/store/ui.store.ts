import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // Apply theme immediately
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          // Apply theme immediately
          if (typeof window !== 'undefined') {
            const root = document.documentElement;
            // Force remove dark class first
            root.classList.remove('dark');
            // Then add it if needed
            if (newTheme === 'dark') {
              root.classList.add('dark');
            }
          }
          return { theme: newTheme };
        });
      },
    }),
    {
      name: 'ui-storage',
    }
  )
);


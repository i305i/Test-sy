'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document immediately when it changes
  useEffect(() => {
    if (mounted && theme) {
      const root = document.documentElement;
      // Force remove dark class first
      root.classList.remove('dark');
      // Then add it if needed
      if (theme === 'dark') {
        root.classList.add('dark');
      }
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group"
      title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {theme === 'dark' ? (
        // Sun icon for light mode
        <svg className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 transition-colors group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="w-6 h-6 text-indigo-600 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

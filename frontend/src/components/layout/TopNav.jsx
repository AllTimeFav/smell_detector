import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

export function TopNav() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-end px-6 transition-colors">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}

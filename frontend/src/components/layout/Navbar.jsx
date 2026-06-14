import React from 'react';

export function Navbar({ view, issues, filesAnalyzed, isLight, toggleTheme }) {
  return (
    <nav className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-3 font-medium text-[0.95rem] text-zinc-950 dark:text-zinc-50 transition-colors duration-200">
        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>
        </svg>
        C++ Anti-Pattern Detector
      </div>
      <div className="flex items-center gap-4">
        {view === 'dashboard' && (
          <div className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-200 border ${
            issues.length > 0 
              ? 'bg-orange-50 dark:bg-[#422006] border-orange-200 dark:border-[#7c2d12] text-orange-800 dark:text-orange-300' 
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`} style={{ display: 'block' }}>
            {issues.length === 0 ? `Clean: 0 Issues in ${filesAnalyzed} file${filesAnalyzed !== 1 ? 's' : ''}` : `${issues.length} Issue${issues.length !== 1 ? 's' : ''} across ${filesAnalyzed} file${filesAnalyzed !== 1 ? 's' : ''}`}
          </div>
        )}
        <button 
          className="bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-zinc-100 hover:dark:bg-zinc-800 hover:text-zinc-950 hover:dark:text-zinc-50" 
          onClick={toggleTheme} 
          title="Toggle Theme"
        >
          {isLight ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}

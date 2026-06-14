import React from 'react';

export function MasterPane({ issues, selectedIndex, setSelectedIndex, resetUpload }) {
  const getPillClasses = (severity) => {
    const base = "px-2 py-[0.15rem] rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.5px] border shrink-0";
    switch(severity.toLowerCase()) {
      case 'critical':
        return `${base} bg-red-50 dark:bg-[#450a0a] text-red-800 dark:text-red-300 border-red-200 dark:border-[#7f1d1d]`;
      case 'warning':
        return `${base} bg-orange-50 dark:bg-[#422006] text-orange-800 dark:text-orange-300 border-orange-200 dark:border-[#7c2d12]`;
      case 'info':
        return `${base} bg-blue-50 dark:bg-[#1e1b4b] text-blue-800 dark:text-blue-300 border-blue-200 dark:border-[#1e3a8a]`;
      default:
        return base;
    }
  };

  return (
    <div className="w-[340px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
      <div className="py-4 px-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h3 className="text-[0.85rem] font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.5px]">Detected Issues</h3>
        <button className="bg-transparent border-none text-zinc-600 dark:text-zinc-400 cursor-pointer text-[0.8rem] font-medium hover:text-zinc-950 hover:dark:text-zinc-50 transition-colors" onClick={resetUpload}>+ New Scan</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {issues.length === 0 ? (
          <div className="p-4 text-center text-zinc-600 dark:text-zinc-400 text-[0.85rem]">
            No issues found.
          </div>
        ) : (
          issues.map((iss, index) => (
            <div 
              key={iss.id || index} 
              className={`p-3 px-4 rounded-lg mb-1 cursor-pointer border-l-2 transition-all duration-200 flex flex-col gap-[0.4rem] ${
                index === selectedIndex 
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-950 dark:border-zinc-50' 
                  : 'border-transparent hover:bg-zinc-100 hover:dark:bg-zinc-800'
              }`} 
              onClick={() => setSelectedIndex(index)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <span className={getPillClasses(iss.severity)}>{iss.severity}</span>
                  <span className="text-[0.75rem] text-zinc-500 dark:text-zinc-400 font-medium truncate" title={iss.filename}>{iss.filename.split('/').pop().split('\\').pop()}</span>
                </div>
              </div>
              <div className="text-[0.85rem] font-medium text-zinc-950 dark:text-zinc-50 break-all">{iss.type}: {iss.name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

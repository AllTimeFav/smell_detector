import React from 'react';
import { CodeInspector } from './CodeInspector';

export function DetailPane({ issue, hasIssues }) {
  if (!issue) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-100 dark:bg-[#09090b] p-8">
        <div className="max-w-[900px] mx-auto w-full h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 text-[0.9rem]">
          {!hasIssues ? "No structural anti-patterns were detected." : "Select an issue from the sidebar to view details."}
        </div>
      </div>
    );
  }

  const getPillClasses = (severity) => {
    const base = "px-2 py-[0.15rem] rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.5px] border";
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-100 dark:bg-[#09090b] p-8">
      <div className="max-w-[900px] mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{issue.type}</h2>
            <span className={getPillClasses(issue.severity)}>{issue.severity}</span>
          </div>
          
          <div className="flex flex-wrap gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-1">
              <span className="text-[0.75rem] text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.5px] font-medium">File</span>
              <span className="text-[0.9rem] text-zinc-950 dark:text-zinc-50 font-mono" title={issue.filename}>{issue.filename.split('/').pop().split('\\').pop()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.75rem] text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.5px] font-medium">Target</span>
              <span className="text-[0.9rem] text-zinc-950 dark:text-zinc-50 font-mono">{issue.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.75rem] text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.5px] font-medium">Location</span>
              <span className="text-[0.9rem] text-zinc-950 dark:text-zinc-50 font-mono">L{issue.line_start} - L{issue.line_end}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-8 flex gap-4 items-start">
          <svg className="text-orange-800 dark:text-orange-300 mt-[0.1rem] shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div className="text-[0.95rem] leading-relaxed text-zinc-950 dark:text-zinc-50">{issue.description}</div>
        </div>

        <CodeInspector issue={issue} />
      </div>
    </div>
  );
}

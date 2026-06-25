import React from 'react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { FileCode2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function FileExplorer() {
  const { issues, selectedIssueId, setSelectedIssueId } = useAnalysisStore();

  // Group by filename
  const filesMap = issues.reduce((acc, issue) => {
    const fn = issue.filename || 'Unknown File';
    if (!acc[fn]) acc[fn] = [];
    acc[fn].push(issue);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
          <FileCode2 className="w-4 h-4 mr-2" />
          Explorer
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.entries(filesMap).map(([filename, fileIssues]) => (
          <div key={filename}>
            <div className="px-2 py-1.5 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/50 rounded flex items-center mb-1">
              {filename}
              <span className="ml-auto bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full px-2 py-0.5 text-[10px]">
                {fileIssues.length}
              </span>
            </div>
            <div className="space-y-1">
              {fileIssues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-start group",
                    selectedIssueId === issue.id 
                      ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 shadow-sm hover:shadow"
                  )}
                >
                  <AlertCircle className={cn(
                    "w-4 h-4 mr-2 mt-0.5 flex-shrink-0",
                    issue.severity === 'Critical' ? "text-red-500" :
                    issue.severity === 'High' ? "text-orange-500" :
                    "text-amber-500"
                  )} />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate text-zinc-900 dark:text-zinc-100">{issue.type}</div>
                    <div className="text-xs truncate opacity-70 mt-0.5">{issue.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <div className="text-center p-4 text-sm text-zinc-500">
            No issues found. Please upload a codebase from the Dashboard.
          </div>
        )}
      </div>
    </div>
  );
}

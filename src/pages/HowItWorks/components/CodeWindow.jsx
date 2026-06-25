import React from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '../../../utils/cn';

export function CodeWindow({ code, language, title, className, height = "300px" }) {
  return (
    <div className={cn(
      "rounded-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e1e] flex flex-col",
      className
    )}>
      {/* Mac-like Window Header */}
      <div className="flex items-center px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex-1 text-center pr-12">
          {title || "code snippet"}
        </div>
      </div>
      
      {/* Code Editor Body */}
      <div className="flex-1 p-2">
        <Editor
          height={height}
          defaultLanguage={language}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            folding: false,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
        />
      </div>
    </div>
  );
}

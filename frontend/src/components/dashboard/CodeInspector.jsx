import React, { useEffect, useRef } from 'react';

export function CodeInspector({ issue }) {
  const codeRef = useRef(null);
  
  useEffect(() => {
    if (issue && codeRef.current && window.hljs) {
      delete codeRef.current.dataset.highlighted;
      window.hljs.highlightElement(codeRef.current);
    }
  }, [issue]);

  if (!issue) return null;

  const sevClass = issue.severity.toLowerCase();
  const isBlockIssue = issue.type === 'God Class';
  const highlightLines = [];
  
  if (isBlockIssue) {
    highlightLines.push({ start: issue.line_start, end: issue.line_start, sev: issue.severity });
  } else {
    highlightLines.push({ start: issue.line_start, end: issue.line_end, sev: issue.severity });
  }

  const lineHeight = 24; 
  let gutterElements = [];
  let bgLayersElements = [];

  for (let hl of highlightLines) {
    const top = (hl.start - issue.context_start) * lineHeight;
    const height = (hl.end - hl.start + 1) * lineHeight;
    let bgClasses = "absolute left-0 right-0 border-l-[3px] border-transparent ";
    if (sevClass === 'critical') bgClasses += "bg-red-100/50 dark:bg-red-400/15 border-red-800 dark:border-red-300";
    else if (sevClass === 'warning') bgClasses += "bg-orange-100/50 dark:bg-orange-400/15 border-orange-800 dark:border-orange-300";

    bgLayersElements.push(
      <div key={`bg-${hl.start}`} className={bgClasses} style={{ top: `${top}px`, height: `${height}px` }}></div>
    );
  }

  for (let i = issue.context_start; i <= issue.context_end; i++) {
    let isHighlighted = false;
    for (let hl of highlightLines) {
      if (i >= hl.start && i <= hl.end) isHighlighted = true;
    }
    
    let gutterClass = "pr-4 pl-2 h-[24px] box-border ";
    if (isHighlighted) {
      if (sevClass === 'critical') gutterClass += "text-red-800 dark:text-red-300 border-l-2 border-red-800 dark:border-red-300 bg-red-100/50 dark:bg-red-400/10";
      else if (sevClass === 'warning') gutterClass += "text-orange-800 dark:text-orange-300 border-l-2 border-orange-800 dark:border-orange-300 bg-orange-100/50 dark:bg-orange-400/10";
    }

    gutterElements.push(
      <div key={`gutter-${i}`} className={gutterClass}>{i}</div>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 text-[0.8rem] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        Code Inspector
      </div>
      <div className="flex bg-zinc-50 dark:bg-[#09090b] relative font-mono text-[0.85rem] leading-6 max-h-125">
        <div className="sticky left-0 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 py-4 text-right text-zinc-400 dark:text-zinc-500 z-10 min-w-14 select-none">
          {gutterElements}
        </div>
        <div className="relative flex-1 overflow-auto">
          <div className="absolute top-4 left-0 bottom-4 min-w-full z-1 pointer-events-none">{bgLayersElements}</div>
          <pre className="m-0 p-4 relative z-2 w-max min-w-full code-content">
            <code ref={codeRef} className="language-cpp">{issue.snippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Lightbulb, Info, FileText, Code2, Play } from 'lucide-react';
import { cn } from '../../utils/cn';

export function InsightsPanel() {
  const { issues, selectedIssueId } = useAnalysisStore();

  const issue = issues.find(i => i.id === selectedIssueId);

  if (!issue) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-zinc-500 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xs space-y-4">
          <Info className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <p>Select an issue from the explorer to view detailed insights and refactoring recommendations.</p>
        </div>
      </div>
    );
  }

  const getReasoning = (type) => {
    switch(type) {
      case 'Speculative Generality': return ['Empty methods detected', 'Unused parameters present', 'Unused virtual hooks'];
      case 'Refused Bequest': return ['Actively overrides inherited methods to throw/noop', 'Low ratio of inherited member usage'];
      case 'Blob Class': return ['High Lines of Code (LOC)', 'Excessive methods/attributes', 'Breaks Single Responsibility Principle'];
      case 'Singleton Abuse': return ['Tight coupling', 'Global state access', 'Hidden dependencies'];
      case 'Inappropriate Intimacy': return ['Excessive method calls to another object', 'Feature Envy'];
      case 'Mutable Global State': return ['Non-const global variables', 'Unpredictable state mutation'];
      default: return [];
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center space-x-2 mb-2">
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider",
            issue.severity === 'Critical' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
            issue.severity === 'High' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
            "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
          )}>
            {issue.severity || 'Warning'}
          </span>
          <span className="text-xs font-medium text-zinc-500">Confidence: 95%</span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{issue.type}</h2>
        <p className="font-mono text-sm text-indigo-600 dark:text-indigo-400 mt-1">{issue.name}</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Description */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center mb-3">
            <Info className="w-4 h-4 mr-2 text-zinc-500" />
            Overview
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
            {issue.description}
          </p>
        </section>

        {/* Reasoning */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center mb-3">
            <Code2 className="w-4 h-4 mr-2 text-zinc-500" />
            Detection Reasoning
          </h3>
          <ul className="space-y-2">
            {getReasoning(issue.type).map((reason, idx) => (
              <li key={idx} className="flex items-start text-sm text-zinc-600 dark:text-zinc-300">
                <Play className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-indigo-500" />
                {reason}
              </li>
            ))}
          </ul>
        </section>

        {/* Context */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center mb-3">
            <FileText className="w-4 h-4 mr-2 text-zinc-500" />
            Location
          </h3>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm flex flex-wrap justify-between items-start gap-2 font-mono">
            <span className="text-zinc-600 dark:text-zinc-300 break-all">{issue.filename}</span>
            <span className="text-zinc-400 whitespace-nowrap">L{issue.line_start} - L{issue.line_end}</span>
          </div>
        </section>

        {/* Refactoring */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center mb-3">
            <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
            Refactoring Recommendation
          </h3>
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
              Consider breaking down the responsibilities, applying the Interface Segregation Principle, or using Dependency Injection to resolve this architectural smell.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Layers, ChevronRight, Activity, GitCommit, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

const ALL_PATTERNS = [
  'Singleton Abuse', 'Excessive Public Data Members', 'Refused Bequest', 
  'Speculative Generality', 'Inappropriate Intimacy', 'Mutable Global State'
];

export default function AntiPatterns() {
  const { issues } = useAnalysisStore();
  const [selectedPattern, setSelectedPattern] = useState(null);

  const patternStats = ALL_PATTERNS.map(pattern => {
    const patternIssues = issues.filter(i => i.type === pattern);
    return {
      name: pattern,
      count: patternIssues.length,
      issues: patternIssues,
      severity: patternIssues.some(i => i.severity === 'Critical') ? 'Critical' : 
                patternIssues.some(i => i.severity === 'High') ? 'High' : 
                patternIssues.length > 0 ? 'Warning' : 'None'
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto flex flex-col h-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center">
          <Layers className="w-6 h-6 mr-3 text-indigo-500" />
          Anti-Pattern Catalog
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Explore all detected architectural smells and their visualizations.</p>
      </div>

      {!selectedPattern ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patternStats.map((stat, idx) => (
            <motion.div 
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedPattern(stat)}
              className={cn(
                "bg-white dark:bg-zinc-900 border rounded-xl p-6 cursor-pointer transition-all hover:shadow-md group relative overflow-hidden",
                stat.count > 0 ? "border-zinc-200 dark:border-zinc-800 hover:border-indigo-400" : "border-zinc-100 dark:border-zinc-800/50 opacity-60 grayscale"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stat.name}</h3>
                {stat.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold uppercase",
                    stat.severity === 'Critical' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                    stat.severity === 'High' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  )}>
                    {stat.severity}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Occurrences</div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stat.count}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center bg-zinc-50 dark:bg-zinc-900/50">
            <button 
              onClick={() => setSelectedPattern(null)}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mr-4"
            >
              ← Back to Catalog
            </button>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{selectedPattern.name} Details</h2>
          </div>
          <div className="flex-1 p-8 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {selectedPattern.issues.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">No instances of this anti-pattern detected.</div>
              ) : (
                selectedPattern.issues.map((issue, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{issue.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">{issue.description}</p>
                    <div className="flex items-center text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 rounded">
                      <span className="text-indigo-600 dark:text-indigo-400 mr-2">{issue.filename}</span>
                      <span>L{issue.line_start} - L{issue.line_end}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

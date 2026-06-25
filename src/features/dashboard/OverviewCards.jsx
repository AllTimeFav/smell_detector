import React from 'react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { FileCode, AlertOctagon, TrendingDown, Layers } from 'lucide-react';

export function OverviewCards() {
  const { issues, filesAnalyzed } = useAnalysisStore();

  const criticalIssues = issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  const metrics = [
    { label: 'Files Analyzed', value: filesAnalyzed, icon: FileCode, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Total Anti-Patterns', value: issues.length, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Critical Issues', value: criticalIssues, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Refactoring Needed', value: issues.length + criticalIssues, icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${m.bg}`}>
            <m.icon className={`w-6 h-6 ${m.color}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{m.label}</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{m.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

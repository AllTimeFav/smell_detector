import React from 'react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Activity, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function HealthScore() {
  const { issues, filesAnalyzed } = useAnalysisStore();

  const totalIssues = issues.length;
  const criticalIssues = issues.filter(i => i.severity === 'Critical').length;
  
  // Ratio based calculation:
  const penalty = (totalIssues * 5) + (criticalIssues * 15);
  const penaltyPerFile = filesAnalyzed > 0 ? (penalty / filesAnalyzed) : 0;
  const score = Math.max(0, Math.round(100 - penaltyPerFile));

  let status = 'Excellent';
  let colorClass = 'text-emerald-500';
  let Icon = ShieldCheck;

  if (score < 50) {
    status = 'Critical';
    colorClass = 'text-red-500';
    Icon = XCircle;
  } else if (score < 80) {
    status = 'Warning';
    colorClass = 'text-amber-500';
    Icon = AlertTriangle;
  } else if (score < 95) {
    status = 'Good';
    colorClass = 'text-indigo-500';
    Icon = Activity;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6">Codebase Health</h2>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-2">
            <span className={cn("text-6xl font-black tracking-tighter", colorClass)}>{score}</span>
            <span className="text-2xl text-zinc-400 font-bold">/ 100</span>
          </div>
          <div className="flex items-center mt-2 space-x-2">
            <Icon className={cn("w-5 h-5", colorClass)} />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{status}</span>
          </div>
        </div>

        {/* CSS Circular Gauge */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" className="text-zinc-100 dark:text-zinc-800 stroke-current" strokeWidth="12" fill="none" />
            <circle 
              cx="64" cy="64" r="56" 
              className={cn("stroke-current transition-all duration-1000 ease-out", colorClass)} 
              strokeWidth="12" 
              fill="none" 
              strokeDasharray="351.86" 
              strokeDashoffset={351.86 - (351.86 * score) / 100}
              strokeLinecap="round" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

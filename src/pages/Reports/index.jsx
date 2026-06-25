import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, BarChart2 } from 'lucide-react';
import { useAnalysisStore } from '../../store/useAnalysisStore';

export default function Reports() {
  const { issues, filesAnalyzed } = useAnalysisStore();

  const handleExportJSON = () => {
    if (issues.length === 0) return;
    
    const dataStr = JSON.stringify({ filesAnalyzed, issues }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `smell_analysis_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto flex flex-col h-full"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-indigo-500" />
            Executive Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Generate and export comprehensive analysis summaries.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleExportJSON}
            disabled={issues.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex-1 flex items-center justify-center">
           <div className="text-center max-w-sm">
              <BarChart2 className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No Report Data Available</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                Run an analysis first to generate an executive summary containing health scores, affected files, and refactoring recommendations.
              </p>
            </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Analysis Summary</h2>
              <ul className="space-y-3 text-zinc-600 dark:text-zinc-300">
                <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Files Analyzed:</span> {filesAnalyzed}</li>
                <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Total Anti-Patterns Detected:</span> {issues.length}</li>
                <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Critical Issues:</span> {issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length}</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Affected Files</h2>
              <div className="space-y-4">
                {Array.from(new Set(issues.map(i => i.filename))).map(filename => {
                  const fileIssues = issues.filter(i => i.filename === filename);
                  return (
                    <div key={filename} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-mono text-sm text-indigo-600 dark:text-indigo-400 mb-2">{filename}</h3>
                      <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                        {fileIssues.map((issue, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{issue.type}</span> 
                            {' '}(Lines {issue.line_start}-{issue.line_end})
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OverviewCards } from '../../features/dashboard/OverviewCards';
import { HealthScore } from '../../features/dashboard/HealthScore';
import { AntiPatternCharts } from '../../features/dashboard/AntiPatternCharts';
import { UploadZone } from '../../features/upload/UploadZone';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { filesAnalyzed } = useAnalysisStore();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (filesAnalyzed > 0) {
      setIsUploading(false);
    }
  }, [filesAnalyzed]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Project Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of codebase health and detected architectural smells.</p>
        </div>
        {filesAnalyzed > 0 && !isUploading && (
          <button 
            onClick={() => setIsUploading(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Scan
          </button>
        )}
        {isUploading && filesAnalyzed > 0 && (
          <button 
            onClick={() => setIsUploading(false)}
            className="flex items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-md text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {filesAnalyzed === 0 || isUploading ? (
        <UploadZone />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HealthScore />
            </div>
            <div className="lg:col-span-2">
              <OverviewCards />
            </div>
          </div>

          <AntiPatternCharts />
        </>
      )}
    </motion.div>
  );
}

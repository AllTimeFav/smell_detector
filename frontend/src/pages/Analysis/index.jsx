import React from 'react';
import { motion } from 'framer-motion';
import { FileExplorer } from '../../features/analysis/FileExplorer';
import { CodeEditor } from '../../features/analysis/CodeEditor';
import { InsightsPanel } from '../../features/analysis/InsightsPanel';

export default function Analysis() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col md:flex-row overflow-hidden bg-zinc-100 dark:bg-zinc-950"
    >
      <div className="w-full md:w-80 flex-shrink-0 h-1/3 md:h-full z-10 shadow-sm">
        <FileExplorer />
      </div>
      <div className="flex-1 h-1/3 md:h-full z-0 border-r border-zinc-200 dark:border-zinc-800">
        <CodeEditor />
      </div>
      <div className="w-full md:w-96 flex-shrink-0 h-1/3 md:h-full z-10 shadow-sm">
        <InsightsPanel />
      </div>
    </motion.div>
  );
}

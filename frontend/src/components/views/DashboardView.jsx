import React from 'react';
import { MasterPane } from '../dashboard/MasterPane';
import { DetailPane } from '../dashboard/DetailPane';

export function DashboardView({ issues, selectedIndex, setSelectedIndex, resetUpload }) {
  const issue = issues[selectedIndex];

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-100 dark:bg-[#09090b]">
      <MasterPane 
        issues={issues} 
        selectedIndex={selectedIndex} 
        setSelectedIndex={setSelectedIndex} 
        resetUpload={resetUpload} 
      />
      <DetailPane 
        issue={issue} 
        hasIssues={issues.length > 0} 
      />
    </div>
  );
}

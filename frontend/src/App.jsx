import React, { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAnalyzer } from './hooks/useAnalyzer';
import { Navbar } from './components/layout/Navbar';
import { UploadView } from './components/views/UploadView';
import { DashboardView } from './components/views/DashboardView';

import './index.css';

function App() {
  const { isLight, toggleTheme } = useTheme();
  const { view, issues, filesAnalyzed, loading, errorMsg, resetUpload, analyzeFiles } = useAnalyzer();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Wrap the analyze handler to also reset selection
  const handleAnalyze = async (files) => {
    await analyzeFiles(files);
    setSelectedIndex(0);
  };

  return (
    <>
      <Navbar 
        view={view} 
        issues={issues} 
        filesAnalyzed={filesAnalyzed} 
        isLight={isLight} 
        toggleTheme={toggleTheme} 
      />
      {view === 'upload' ? (
        <UploadView 
          onAnalyze={handleAnalyze} 
          loading={loading} 
          errorMsg={errorMsg} 
        />
      ) : (
        <DashboardView 
          issues={issues} 
          selectedIndex={selectedIndex} 
          setSelectedIndex={setSelectedIndex} 
          resetUpload={resetUpload} 
        />
      )}
    </>
  );
}

export default App;

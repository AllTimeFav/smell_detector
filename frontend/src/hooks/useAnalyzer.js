import { useState } from 'react';

export function useAnalyzer() {
  const [view, setView] = useState('upload'); // 'upload' | 'dashboard'
  const [issues, setIssues] = useState([]);
  const [filesAnalyzed, setFilesAnalyzed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetUpload = () => {
    setView('upload');
    setIssues([]);
    setFilesAnalyzed(0);
    setErrorMsg('');
  };

  const analyzeFiles = async (fileList) => {
    setErrorMsg('');
    setLoading(true);

    const formData = new FormData();
    // Append all selected files under the 'files' key
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || data.error || 'Analysis failed');

      setFilesAnalyzed(data.files_analyzed);
      setIssues(data.results.issues || []);
      setView('dashboard');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    view,
    issues,
    filesAnalyzed,
    loading,
    errorMsg,
    resetUpload,
    analyzeFiles,
  };
}

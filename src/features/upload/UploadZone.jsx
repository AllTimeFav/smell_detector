import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileCode } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { analyzeCodebase } from '../../services/api';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { cn } from '../../utils/cn';

export function UploadZone() {
  const { setIssues, setFilesAnalyzed, setLoading, setErrorMsg, resetAnalysis } = useAnalysisStore();

  const mutation = useMutation({
    mutationFn: analyzeCodebase,
    onMutate: () => {
      resetAnalysis();
      setLoading(true);
    },
    onSuccess: (data) => {
      setFilesAnalyzed(data.files_analyzed);
      setIssues(data.results.issues || []);
      setLoading(false);
    },
    onError: (error) => {
      setErrorMsg(error.message);
      setLoading(false);
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      mutation.mutate(acceptedFiles);
    }
  }, [mutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/x-c++src': ['.cpp', '.c', '.cc', '.cxx'],
      'text/x-c++hdr': ['.h', '.hpp'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
        isDragActive 
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
          : "border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
          <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Upload C++ Source Files or Archives</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Drag and drop your .cpp, .h files, or .zip/.rar projects here</p>
        </div>
        
        {mutation.isPending && (
          <div className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center mt-4">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing codebase...
          </div>
        )}
        
        {mutation.isError && (
          <div className="text-red-500 mt-4 text-sm font-medium bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-md">
            {mutation.error.message}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';

export function UploadView({ onAnalyze, loading, errorMsg }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onAnalyze(files);
    }
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await onAnalyze(files);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div 
        className={`bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 w-full max-w-150 text-center transition-all duration-200 ${dragOver ? 'border-zinc-600 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800' : 'hover:border-zinc-600 hover:dark:border-zinc-400'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <svg className="text-zinc-600 dark:text-zinc-400 mb-4 inline-block" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h2 className="text-[1.1rem] font-medium mb-4">Upload Project or Files</h2>
        
        <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer">
                Select Files
            </button>
            <button onClick={() => folderInputRef.current?.click()} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
                Select Folder
            </button>
        </div>

        <p className="text-[0.85rem] text-zinc-600 dark:text-zinc-400">Drag & drop files/folders, or use the buttons above.</p>
        
        <input 
          type="file" 
          multiple
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".cpp,.cxx,.cc,.h,.hpp" 
          style={{ display: 'none' }} 
        />
        <input 
          type="file" 
          webkitdirectory="true"
          directory="true"
          multiple
          ref={folderInputRef} 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />
        
        {loading && <div className="loader-spinner block"></div>}
        {errorMsg && <div className="text-red-800 dark:text-red-300 mt-4 text-[0.85rem]">{errorMsg}</div>}
      </div>
    </div>
  );
}

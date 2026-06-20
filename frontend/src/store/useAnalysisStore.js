import { create } from 'zustand';

export const useAnalysisStore = create((set) => ({
  issues: [],
  filesAnalyzed: 0,
  loading: false,
  errorMsg: '',
  selectedIssueId: null,
  
  // Setters
  setIssues: (issues) => set({ issues }),
  setFilesAnalyzed: (count) => set({ filesAnalyzed: count }),
  setLoading: (loading) => set({ loading }),
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
  
  resetAnalysis: () => set({
    issues: [],
    filesAnalyzed: 0,
    loading: false,
    errorMsg: '',
    selectedIssueId: null
  }),
}));

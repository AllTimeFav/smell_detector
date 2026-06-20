import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useThemeStore } from '../../store/useThemeStore';

export function CodeEditor() {
  const { issues, selectedIssueId } = useAnalysisStore();
  const { isDark } = useThemeStore();
  const editorRef = useRef(null);
  const monaco = useMonaco();
  const decorationsRef = useRef([]);

  const issue = issues.find(i => i.id === selectedIssueId);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!monaco || !editorRef.current || !issue) return;

    // We only have the snippet, so the editor's line 1 is actually issue.context_start
    const localStart = issue.line_start - issue.context_start + 1;
    const localEnd = issue.line_end - issue.context_start + 1;

    let highlightColor = 'bg-amber-500/30';
    if (issue.type === 'Singleton Abuse') highlightColor = 'bg-purple-500/30';
    else if (issue.type === 'Blob Class') highlightColor = 'bg-red-500/30';
    else if (issue.type === 'Refused Bequest') highlightColor = 'bg-orange-500/30';
    else if (issue.type === 'Speculative Generality') highlightColor = 'bg-yellow-500/30';
    else if (issue.type === 'Inappropriate Intimacy') highlightColor = 'bg-blue-500/30';
    else if (issue.type === 'Mutable Global State') highlightColor = 'bg-pink-500/30';

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: new monaco.Range(localStart, 1, localEnd, 1000),
          options: {
            isWholeLine: true,
            className: highlightColor,
            marginClassName: `border-l-4 border-l-red-500`, // Margin indicator
          },
        },
      ]
    );

  }, [monaco, issue]);

  if (!issue) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
        Select an issue to view its source code snippet.
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="h-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
        {issue.filename}
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language="cpp"
          theme={isDark ? "vs-dark" : "light"}
          value={issue.snippet}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: (num) => (num + issue.context_start - 1).toString(),
            scrollBeyondLastLine: false,
            renderLineHighlight: "all",
            smoothScrolling: true,
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}

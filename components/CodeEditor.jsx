'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-nova-accent animate-bounce" />
        <span className="text-xs font-mono text-nova-text-dim">Loading editor...</span>
      </div>
    </div>
  ),
});

function getLanguage(path) {
  if (!path) return 'plaintext';
  if (path.endsWith('.java')) return 'java';
  if (path.endsWith('.json') || path.endsWith('.mcmeta')) return 'json';
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
  if (path.endsWith('.gradle')) return 'groovy';
  if (path.endsWith('.toml')) return 'ini';
  if (path.endsWith('.xml')) return 'xml';
  if (path.endsWith('.properties')) return 'ini';
  if (path.endsWith('.mcfunction')) return 'plaintext';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

function getFileName(path) {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export default function CodeEditor({ files, activeFile, onUpdate }) {
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Nova theme
    monaco.editor.defineTheme('nova-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a6a4a', fontStyle: 'italic' },
        { token: 'keyword', foreground: '3ddc84' },
        { token: 'string', foreground: 'd4a843' },
        { token: 'number', foreground: '80b4ff' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'annotation', foreground: '7a9a7a' },
      ],
      colors: {
        'editor.background': '#0a0f0a',
        'editor.foreground': '#d4e8d4',
        'editor.lineHighlightBackground': '#111a1180',
        'editor.selectionBackground': '#3ddc8430',
        'editor.inactiveSelectionBackground': '#3ddc8415',
        'editorLineNumber.foreground': '#2a5a2a',
        'editorLineNumber.activeForeground': '#3ddc84',
        'editorCursor.foreground': '#3ddc84',
        'editor.selectionHighlightBackground': '#3ddc8420',
        'editorIndentGuide.background': '#1e3a1e40',
        'editorIndentGuide.activeBackground': '#1e3a1e80',
        'editorWidget.background': '#111a11',
        'editorWidget.border': '#1e3a1e',
        'editorSuggestWidget.background': '#111a11',
        'editorSuggestWidget.border': '#1e3a1e',
        'editorSuggestWidget.selectedBackground': '#162016',
        'scrollbarSlider.background': '#1e3a1e60',
        'scrollbarSlider.hoverBackground': '#2a5a2a80',
      },
    });

    monaco.editor.setTheme('nova-dark');
  };

  const handleChange = (value) => {
    if (activeFile && value !== undefined) {
      onUpdate(activeFile, value);
    }
  };

  const content = activeFile ? files[activeFile] || '' : '';
  const language = getLanguage(activeFile);

  return (
    <div className="h-full flex flex-col bg-nova-bg">
      {/* Editor tabs / header */}
      <div className="flex-shrink-0 h-9 border-b border-nova-border flex items-center px-2">
        {activeFile ? (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-nova-olive/50 border border-nova-border">
            <span className="text-[11px] font-mono text-nova-text-bright">{getFileName(activeFile)}</span>
            <span className="text-[9px] font-mono text-nova-text-dim uppercase">{language}</span>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-nova-text-dim">No file selected</span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language={language}
            value={content}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontLigatures: true,
              lineHeight: 20,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'off',
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-nova-text-dim/30 mx-auto mb-2"
              >
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                <path d="M13 2v7h7" />
              </svg>
              <p className="text-xs text-nova-text-dim font-mono">Select a file to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-hud-green animate-bounce" />
        <span className="font-mono text-[9px] text-hud-text-dim tracking-wider">LOADING EDITOR...</span>
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
  if (path.endsWith('.mcfunction')) return 'plaintext';
  return 'plaintext';
}

function getFileName(path) {
  return path ? path.split('/').pop() : '';
}

export default function CodeEditor({ files, activeFile, onUpdate }) {
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('nova-hud', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '2a6a3a', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ff6a' },
        { token: 'string', foreground: 'ffaa00' },
        { token: 'number', foreground: '00ddff' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'annotation', foreground: '4a8a5e' },
      ],
      colors: {
        'editor.background': '#020a04',
        'editor.foreground': '#b0f0c8',
        'editor.lineHighlightBackground': '#00ff6a08',
        'editor.selectionBackground': '#00ff6a20',
        'editor.inactiveSelectionBackground': '#00ff6a10',
        'editorLineNumber.foreground': '#00883a',
        'editorLineNumber.activeForeground': '#00ff6a',
        'editorCursor.foreground': '#00ff6a',
        'editorIndentGuide.background': '#00ff6a10',
        'editorIndentGuide.activeBackground': '#00ff6a20',
        'editorWidget.background': '#051a0c',
        'editorWidget.border': '#00ff6a30',
        'editorSuggestWidget.background': '#051a0c',
        'editorSuggestWidget.border': '#00ff6a20',
        'editorSuggestWidget.selectedBackground': '#00ff6a15',
        'scrollbarSlider.background': '#00ff6a15',
        'scrollbarSlider.hoverBackground': '#00ff6a25',
      },
    });
    monaco.editor.setTheme('nova-hud');
  };

  const handleChange = (value) => {
    if (activeFile && value !== undefined) onUpdate(activeFile, value);
  };

  const content = activeFile ? files[activeFile] || '' : '';
  const language = getLanguage(activeFile);

  return (
    <div className="h-full flex flex-col" style={{ background: '#020a04' }}>
      {/* Tab bar */}
      <div className="flex-shrink-0 h-8 border-b border-[rgba(0,255,106,0.1)] flex items-center px-2 hud-panel relative z-10">
        {activeFile ? (
          <div className="flex items-center gap-2 px-2 py-1 rounded border border-[rgba(0,255,106,0.15)] bg-[rgba(0,255,106,0.04)]">
            <div className="w-1.5 h-1.5 rounded-full bg-hud-green glow" />
            <span className="font-mono text-[10px] text-hud-green tracking-wider">{getFileName(activeFile)}</span>
            <span className="font-mono text-[7px] text-hud-text-dim uppercase tracking-widest">{language}</span>
          </div>
        ) : (
          <span className="font-mono text-[9px] text-hud-text-dim tracking-wider">NO FILE SELECTED</span>
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
              fontFamily: '"JetBrains Mono", "Share Tech Mono", monospace',
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
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center animate-fade">
              <div className="w-14 h-14 mx-auto mb-3 hexagon bg-[rgba(0,255,106,0.04)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-hud-text-dim opacity-30">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M13 2v7h7" />
                </svg>
              </div>
              <p className="font-mono text-[9px] text-hud-text-dim tracking-wider">SELECT A FILE TO EDIT</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProject, getProjectFiles, saveProjectFiles, getChatHistory, saveChatHistory } from '../lib/store';
import { processToolCall, extractArtifacts } from '../lib/ai-tools';
import ChatPanel from './ChatPanel';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import SettingsPanel from './SettingsPanel';
import Terminal from './Terminal';
import StatusBar from './StatusBar';

export default function Builder({ projectId }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [layout, setLayout] = useState('balanced');
  const [chatWidth, setChatWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [logs, setLogs] = useState([
    { type: 'system', text: 'Nova AI Mod Creator initialized.' },
    { type: 'system', text: 'Awaiting commands...' },
  ]);
  const [time, setTime] = useState('');

  useEffect(() => {
    const p = getProject(projectId);
    if (!p) { router.push('/'); return; }
    setProject(p);
    setFiles(getProjectFiles(projectId));
    setChatMessages(getChatHistory(projectId));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, [projectId, router]);

  useEffect(() => {
    if (projectId && Object.keys(files).length > 0) saveProjectFiles(projectId, files);
  }, [files, projectId]);

  useEffect(() => {
    if (projectId && chatMessages.length > 0) saveChatHistory(projectId, chatMessages);
  }, [chatMessages, projectId]);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => setChatWidth(Math.max(280, Math.min(600, e.clientX)));
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
  };

  const sendMessage = async (userMessage) => {
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setLoading(true);
    addLog('info', `User: ${userMessage.slice(0, 60)}${userMessage.length > 60 ? '...' : ''}`);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })),
          projectFiles: files,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setChatMessages([...newMessages, { role: 'assistant', content: `⚠ ${data.error}`, isError: true }]);
        addLog('error', data.error);
        setLoading(false);
        return;
      }
      const contentBlocks = data.content || [];
      const textParts = [];
      const artifacts = extractArtifacts(contentBlocks);
      let currentFiles = { ...files };

      for (const artifact of artifacts) {
        const { files: updatedFiles, result } = processToolCall(artifact.tool, artifact.input, currentFiles);
        currentFiles = updatedFiles;
        addLog('success', result.message || `${artifact.tool}: ${artifact.input.path || ''}`);
      }
      for (const block of contentBlocks) {
        if (block.type === 'text') textParts.push(block.text);
      }
      setFiles(currentFiles);
      const assistantMsg = { role: 'assistant', content: textParts.join('\n\n'), artifacts: artifacts.length > 0 ? artifacts : undefined };
      setChatMessages([...newMessages, assistantMsg]);
      addLog('info', 'Nova responded.');

      if (artifacts.length > 0 && data.stop_reason === 'tool_use') {
        const toolResults = artifacts.map(a => {
          const { result } = processToolCall(a.tool, a.input, files);
          return { type: 'tool_result', tool_use_id: a.id, content: result.message };
        });
        const continueRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...newMessages, { role: 'assistant', content: contentBlocks }, { role: 'user', content: toolResults }].map(m => ({ role: m.role, content: m.content })),
            projectFiles: currentFiles,
          }),
        });
        const continueData = await continueRes.json();
        if (continueData.content) {
          const continueText = continueData.content.filter(b => b.type === 'text').map(b => b.text).join('\n\n');
          if (continueText) {
            assistantMsg.content += '\n\n' + continueText;
            setChatMessages([...newMessages, assistantMsg]);
          }
        }
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: '⚠ Connection failed. Check your API key.', isError: true }]);
      addLog('error', 'Connection failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleFileSelect = (path) => setActiveFile(path);
  const handleFileUpdate = (path, content) => setFiles(prev => ({ ...prev, [path]: content }));
  const handleFileCreate = (path, content = '') => { setFiles(prev => ({ ...prev, [path]: content })); setActiveFile(path); };
  const handleFileDelete = (path) => { setFiles(prev => { const n = { ...prev }; delete n[path]; return n; }); if (activeFile === path) setActiveFile(null); };

  if (!project) return null;

  const fileCount = Object.keys(files).length;
  const lineCount = Object.values(files).reduce((sum, c) => sum + (c.match(/\n/g) || []).length + 1, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden grid-bg">
      {/* ══════ TOP BAR ══════ */}
      <header className="flex-shrink-0 hud-panel-strong border-b border-[rgba(0,255,106,0.15)] h-11 px-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-hud-text-dim hover:text-hud-green transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="hud-divider-v h-5" />
          <div className="w-6 h-6 hexagon bg-[rgba(0,255,106,0.1)] flex items-center justify-center">
            <span className="font-display font-bold text-hud-green text-[8px]">N</span>
          </div>
          <span className="font-display font-semibold text-hud-green text-glow-subtle text-sm tracking-[0.15em]">{project.name.toUpperCase()}</span>
          <span className="font-mono text-[9px] text-hud-text-dim px-1.5 py-0.5 rounded border border-[rgba(0,255,106,0.1)] bg-[rgba(0,255,106,0.03)]">
            v{project.version}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="status-dot" />
            <span className="font-mono text-[9px] text-hud-green">READY</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout toggles */}
          {['ai-focus', 'balanced', 'code-focus'].map(l => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-2.5 py-1 rounded text-[9px] font-display font-semibold tracking-wider transition-all border ${
                layout === l
                  ? 'bg-[rgba(0,255,106,0.12)] border-[rgba(0,255,106,0.35)] text-hud-green glow'
                  : 'border-transparent text-hud-text-dim hover:text-hud-text'
              }`}
            >
              {l === 'ai-focus' ? 'AI' : l === 'balanced' ? 'SPLIT' : 'CODE'}
            </button>
          ))}
          <div className="hud-divider-v h-5 mx-1" />
          <button onClick={() => setTerminalOpen(!terminalOpen)} className={`px-2 py-1 rounded text-[9px] font-display tracking-wider transition-all border ${terminalOpen ? 'bg-[rgba(0,255,106,0.08)] border-[rgba(0,255,106,0.25)] text-hud-green' : 'border-transparent text-hud-text-dim'}`}>
            TERM
          </button>
          <button onClick={() => setShowSettings(true)} className="text-hud-text-dim hover:text-hud-green transition p-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ══════ WORKSPACE ══════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div
          className="flex-shrink-0 border-r border-[rgba(0,255,106,0.1)]"
          style={{
            width: layout === 'code-focus' ? 0 : layout === 'ai-focus' ? '55%' : chatWidth,
            transition: isDragging ? 'none' : 'width 0.3s ease',
            overflow: 'hidden',
          }}
        >
          <ChatPanel messages={chatMessages} onSend={sendMessage} loading={loading} project={project} />
        </div>

        {/* Drag handle */}
        {layout === 'balanced' && (
          <div onMouseDown={handleMouseDown} className="w-1 cursor-col-resize hover:bg-[rgba(0,255,106,0.2)] active:bg-[rgba(0,255,106,0.4)] transition-colors flex-shrink-0 relative">
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Right side: Files + Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ display: layout === 'ai-focus' ? 'none' : undefined }}>
          {/* Files + Editor row */}
          <div className="flex-1 flex overflow-hidden">
            {/* File tree */}
            <div className="w-52 flex-shrink-0 border-r border-[rgba(0,255,106,0.1)] overflow-auto">
              <FileTree files={files} activeFile={activeFile} onSelect={handleFileSelect} onCreate={handleFileCreate} onDelete={handleFileDelete} />
            </div>
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor files={files} activeFile={activeFile} onUpdate={handleFileUpdate} />
            </div>
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div className="flex-shrink-0 border-t border-[rgba(0,255,106,0.15)]" style={{ height: terminalHeight }}>
              <Terminal logs={logs} />
            </div>
          )}
        </div>
      </div>

      {/* ══════ BOTTOM STATUS BAR ══════ */}
      <StatusBar project={project} fileCount={fileCount} lineCount={lineCount} time={time} activeFile={activeFile} loading={loading} />

      {showSettings && <SettingsPanel project={project} files={files} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProject, getProjectFiles, saveProjectFiles, getChatHistory, saveChatHistory } from '../lib/store';
import { processToolCall, extractArtifacts } from '../lib/ai-tools';
import ChatPanel from './ChatPanel';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import SettingsPanel from './SettingsPanel';

export default function Builder({ projectId }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [layout, setLayout] = useState('balanced'); // 'ai-focus', 'code-focus', 'balanced'
  const [chatWidth, setChatWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const p = getProject(projectId);
    if (!p) {
      router.push('/');
      return;
    }
    setProject(p);
    setFiles(getProjectFiles(projectId));
    setChatMessages(getChatHistory(projectId));
  }, [projectId, router]);

  // Save files whenever they change
  useEffect(() => {
    if (projectId && Object.keys(files).length > 0) {
      saveProjectFiles(projectId, files);
    }
  }, [files, projectId]);

  // Save chat whenever it changes
  useEffect(() => {
    if (projectId && chatMessages.length > 0) {
      saveChatHistory(projectId, chatMessages);
    }
  }, [chatMessages, projectId]);

  // Panel drag resize
  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      setChatWidth(Math.max(280, Math.min(600, e.clientX)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // Send message to AI
  const sendMessage = async (userMessage) => {
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          })),
          projectFiles: files,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setChatMessages([
          ...newMessages,
          { role: 'assistant', content: `⚠️ ${data.error}`, isError: true },
        ]);
        setLoading(false);
        return;
      }

      // Process response content blocks
      const contentBlocks = data.content || [];
      const textParts = [];
      const artifacts = extractArtifacts(contentBlocks);
      let currentFiles = { ...files };

      // Apply tool calls
      for (const artifact of artifacts) {
        const { files: updatedFiles, result } = processToolCall(
          artifact.tool,
          artifact.input,
          currentFiles
        );
        currentFiles = updatedFiles;
      }

      // Gather text
      for (const block of contentBlocks) {
        if (block.type === 'text') {
          textParts.push(block.text);
        }
      }

      setFiles(currentFiles);

      // Build assistant message
      const assistantMsg = {
        role: 'assistant',
        content: textParts.join('\n\n'),
        artifacts: artifacts.length > 0 ? artifacts : undefined,
      };

      setChatMessages([...newMessages, assistantMsg]);

      // If there were tool calls, we need to send tool results back
      if (artifacts.length > 0 && data.stop_reason === 'tool_use') {
        // Build tool result messages
        const toolResults = artifacts.map((a) => {
          const { result } = processToolCall(a.tool, a.input, files);
          return {
            type: 'tool_result',
            tool_use_id: a.id,
            content: result.message,
          };
        });

        // Continue the conversation with tool results
        const continueMessages = [
          ...newMessages,
          { role: 'assistant', content: contentBlocks },
          { role: 'user', content: toolResults },
        ];

        const continueRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: continueMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            projectFiles: currentFiles,
          }),
        });

        const continueData = await continueRes.json();
        if (continueData.content) {
          const continueText = continueData.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('\n\n');

          if (continueText) {
            assistantMsg.content += '\n\n' + continueText;
            setChatMessages([...newMessages, assistantMsg]);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: '⚠️ Failed to connect to AI. Make sure your API key is set.', isError: true },
      ]);
    }

    setLoading(false);
  };

  // File operations
  const handleFileSelect = (path) => setActiveFile(path);
  const handleFileUpdate = (path, content) => {
    setFiles((prev) => ({ ...prev, [path]: content }));
  };
  const handleFileCreate = (path, content = '') => {
    setFiles((prev) => ({ ...prev, [path]: content }));
    setActiveFile(path);
  };
  const handleFileDelete = (path) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    if (activeFile === path) setActiveFile(null);
  };

  if (!project) return null;

  const layoutClasses = {
    balanced: '',
    'ai-focus': 'ai-focus',
    'code-focus': 'code-focus',
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 glass-strong border-b border-nova-border h-11 px-4 flex items-center justify-between relative noise">
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-nova-text-dim hover:text-nova-accent transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="w-6 h-6 rounded bg-nova-accent/10 border border-nova-accent/30 flex items-center justify-center">
            <span className="text-nova-accent font-display font-bold text-[10px]">N</span>
          </div>
          <span className="font-display font-semibold text-sm text-nova-text-bright tracking-wide">{project.name}</span>
          <span className="text-[10px] font-mono text-nova-text-dim px-1.5 py-0.5 rounded bg-nova-olive border border-nova-border">
            v{project.version}
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="status-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[10px] font-mono text-nova-accent-dim">Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {/* Layout toggle */}
          {['ai-focus', 'balanced', 'code-focus'].map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                layout === l
                  ? 'bg-nova-accent/15 text-nova-accent border border-nova-accent/30'
                  : 'text-nova-text-dim hover:text-nova-text'
              }`}
            >
              {l === 'ai-focus' ? 'AI' : l === 'balanced' ? 'BAL' : 'CODE'}
            </button>
          ))}
          <div className="w-px h-4 bg-nova-border mx-1" />
          <button
            onClick={() => setShowSettings(true)}
            className="text-nova-text-dim hover:text-nova-text transition p-1"
            title="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div
          className="flex-shrink-0 border-r border-nova-border"
          style={{
            width: layout === 'code-focus' ? 0 : layout === 'ai-focus' ? '50%' : chatWidth,
            transition: isDragging ? 'none' : 'width 0.3s ease',
            overflow: 'hidden',
          }}
        >
          <ChatPanel
            messages={chatMessages}
            onSend={sendMessage}
            loading={loading}
            project={project}
          />
        </div>

        {/* Drag handle */}
        {layout === 'balanced' && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1 cursor-col-resize hover:bg-nova-accent/30 active:bg-nova-accent/50 transition-colors flex-shrink-0"
          />
        )}

        {/* Files + Editor */}
        <div className="flex-1 flex overflow-hidden" style={{ display: layout === 'ai-focus' ? 'none' : undefined }}>
          {/* File tree */}
          <div className="w-56 flex-shrink-0 border-r border-nova-border overflow-auto">
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelect={handleFileSelect}
              onCreate={handleFileCreate}
              onDelete={handleFileDelete}
            />
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              files={files}
              activeFile={activeFile}
              onUpdate={handleFileUpdate}
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <SettingsPanel
          project={project}
          files={files}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

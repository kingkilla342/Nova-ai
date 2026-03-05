'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ messages, onSend, loading, project }) {
  const [input, setInput] = useState('');
  const [webEnabled, setWebEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [expandedArtifacts, setExpandedArtifacts] = useState({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleArtifact = (idx) => {
    setExpandedArtifacts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const actionLabels = {
    createFile: 'Created',
    editFile: 'Edited',
    deleteFile: 'Deleted',
    readFile: 'Read',
    listFiles: 'Listed',
  };

  const actionColors = {
    createFile: 'text-nova-accent',
    editFile: 'text-nova-amber',
    deleteFile: 'text-nova-red',
    readFile: 'text-nova-text-dim',
    listFiles: 'text-nova-text-dim',
  };

  return (
    <div className="h-full flex flex-col bg-nova-bg">
      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-nova-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-nova-accent/10 flex items-center justify-center">
            <span className="text-nova-accent text-[10px] font-bold">AI</span>
          </div>
          <span className="text-xs font-semibold text-nova-text-bright">Nova Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWebEnabled(!webEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
              webEnabled
                ? 'bg-nova-accent/15 text-nova-accent border border-nova-accent/30'
                : 'text-nova-text-dim hover:text-nova-text'
            }`}
            title="Toggle web browsing"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Web
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-nova-accent/10 border border-nova-accent/30 flex items-center justify-center glow-accent">
              <span className="text-nova-accent font-display font-bold text-lg">N</span>
            </div>
            <h3 className="font-display text-sm text-nova-text-bright mb-1">Nova Ready</h3>
            <p className="text-xs text-nova-text-dim max-w-[240px] mx-auto leading-relaxed">
              Describe what you want to build. I'll create the files, write the code, and explain everything.
            </p>
            <div className="mt-5 space-y-1.5">
              {[
                'Create a /heal command with cooldown',
                'Add a custom enchantment system',
                'Build a scoreboard manager',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-xs text-nova-text-dim hover:text-nova-accent hover:bg-nova-accent/5 border border-transparent hover:border-nova-accent/20 transition-all font-mono"
                >
                  → {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-br-sm bg-nova-accent/10 border border-nova-accent/20 text-sm text-nova-text-bright">
                {msg.content}
              </div>
            ) : (
              <div className="space-y-2">
                {/* AI text */}
                <div className={`text-sm leading-relaxed ${msg.isError ? 'text-nova-red' : 'text-nova-text'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded bg-nova-accent/20 flex items-center justify-center">
                      <span className="text-nova-accent text-[8px] font-bold">N</span>
                    </div>
                    <span className="text-[10px] font-mono text-nova-text-dim">Nova</span>
                  </div>
                  <div className="pl-5 whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Artifact panel */}
                {msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="pl-5">
                    <button
                      onClick={() => toggleArtifact(idx)}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-nova-text-dim hover:text-nova-accent transition"
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="currentColor"
                        className={`transition-transform ${expandedArtifacts[idx] ? 'rotate-90' : ''}`}
                      >
                        <path d="M2 1l4 3-4 3V1z" />
                      </svg>
                      {msg.artifacts.length} file action{msg.artifacts.length !== 1 ? 's' : ''}
                    </button>
                    {expandedArtifacts[idx] && (
                      <div className="mt-1.5 glass rounded-lg p-2 space-y-1 animate-fade-in">
                        {msg.artifacts.map((a, ai) => (
                          <div key={ai} className="flex items-center gap-2 text-[11px] font-mono">
                            <span className={actionColors[a.tool] || 'text-nova-text-dim'}>
                              {actionLabels[a.tool] || a.tool}
                            </span>
                            <span className="text-nova-text-dim">{a.input.path || '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 animate-fade-in pl-5">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-nova-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nova-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nova-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-mono text-nova-text-dim">Nova is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-nova-border p-3">
        <div className="flex items-end gap-2">
          {/* + button */}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-nova-olive border border-nova-border text-nova-text-dim hover:text-nova-accent hover:border-nova-accent/30 transition flex items-center justify-center"
            title="Upload files"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              rows={1}
              className="w-full px-3 py-2 rounded-lg bg-nova-olive border border-nova-border text-sm text-nova-text-bright placeholder:text-nova-text-dim/50 font-mono resize-none focus:outline-none focus:border-nova-accent/50 focus:ring-1 focus:ring-nova-accent/20 transition"
              style={{ minHeight: '36px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-nova-accent/20 border border-nova-accent/40 text-nova-accent hover:bg-nova-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ messages, onSend, loading, project, onUpload }) {
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const actionLabels = { createFile: 'CREATED', editFile: 'MODIFIED', deleteFile: 'DELETED', readFile: 'SCANNED', listFiles: 'LISTED' };
  const actionColors = { createFile: 'text-hud-green', editFile: 'text-hud-amber', deleteFile: 'text-hud-red', readFile: 'text-hud-cyan', listFiles: 'text-hud-text-dim' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between hud-panel">
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-6 h-7 rounded-full border border-[rgba(0,255,106,0.3)] flex items-center justify-center radar" style={{ width: 22, height: 22 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-hud-green" />
          </div>
          <div>
            <span className="font-display text-[14px] text-hud-green font-semibold tracking-[0.2em]">NOVA AI</span>
            <span className="font-mono text-[14px] text-hud-text-dim ml-2 tracking-wider">
              {loading ? 'PROCESSING...' : 'STANDING BY'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setWebEnabled(!webEnabled)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-mono tracking-wider transition-all border ${
            webEnabled ? 'glass-tag text-hud-green border-[rgba(0,255,106,0.25)]' : 'border-[rgba(0,255,106,0.08)] text-hud-text-dim'
          }`}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
          </svg>
          WEB
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 animate-fade">
            <div className="w-16 h-16 mx-auto mb-4 hexagon bg-[rgba(0,255,106,0.06)] flex items-center justify-center animate-float">
              <div className="w-12 h-12 hexagon bg-[rgba(0,255,106,0.1)] flex items-center justify-center glow">
                <span className="font-display font-black text-hud-green text-glow text-3xl">N</span>
              </div>
            </div>
            <h3 className="font-display text-hud-green text-glow-subtle tracking-[0.2em] text-base mb-1">SYSTEM READY</h3>
            <p className="font-mono text-[13px] text-hud-text-dim max-w-[260px] mx-auto leading-relaxed tracking-wide mb-6">
              Describe your target. Nova will analyze, plan, and execute.
            </p>
            <div className="glass-card hud-corners rounded-lg p-4 max-w-[280px] mx-auto space-y-1.5">
              <p className="font-mono text-[14px] text-hud-text-dim tracking-[0.3em] uppercase mb-2">QUICK START</p>
              {[
                'Create a /heal command with cooldown',
                'Add a custom enchantment system',
                'Build a scoreboard manager',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="block w-full text-left px-4 py-2.5 rounded text-[13px] text-hud-text-dim hover:text-hud-green glass hover:border-[rgba(0,255,106,0.2)] transition-all font-mono tracking-wide"
                >
                  ▸ {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] px-4 py-3 rounded-xl rounded-br-sm glass-user text-base text-hud-text-bright font-sans">
                {msg.content}
              </div>
            ) : (
              <div className="space-y-2">
                {/* AI message */}
                <div className={`glass-message rounded-xl rounded-tl-sm px-4 py-3 ${msg.isError ? '' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 hexagon bg-[rgba(0,255,106,0.12)] flex items-center justify-center">
                      <span className="text-hud-green text-[13px] font-bold">N</span>
                    </div>
                    <span className="font-display text-[12px] text-hud-green tracking-[0.2em]">NOVA</span>
                    <div className="flex-1 h-px bg-[rgba(0,255,106,0.06)]" />
                  </div>
                  <div className={`whitespace-pre-wrap font-sans text-base leading-relaxed ${msg.isError ? 'text-hud-red' : 'text-hud-text'}`}>
                    {msg.content}
                  </div>
                </div>

                {/* Artifacts */}
                {msg.artifacts?.length > 0 && (
                  <div className="ml-2">
                    <button
                      onClick={() => setExpandedArtifacts(p => ({ ...p, [idx]: !p[idx] }))}
                      className="flex items-center gap-1.5 font-mono text-[12px] text-hud-text-dim hover:text-hud-green transition tracking-wider"
                    >
                      <svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${expandedArtifacts[idx] ? 'rotate-90' : ''}`}>
                        <path d="M2 1l4 3-4 3V1z" />
                      </svg>
                      {msg.artifacts.length} FILE ACTION{msg.artifacts.length !== 1 ? 'S' : ''}
                    </button>
                    {expandedArtifacts[idx] && (
                      <div className="mt-1.5 glass rounded-lg p-2.5 space-y-1 animate-fade">
                        {msg.artifacts.map((a, ai) => (
                          <div key={ai} className="flex items-center gap-2 font-mono text-[12px]">
                            <span className={`glass-tag px-1.5 py-0.5 rounded text-[14px] ${actionColors[a.tool] || 'text-hud-text-dim'}`}>
                              {actionLabels[a.tool] || a.tool}
                            </span>
                            <span className="text-hud-text-dim truncate">{a.input.path || '—'}</span>
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

        {loading && (
          <div className="animate-fade">
            <div className="glass-message rounded-xl px-4 py-3 inline-flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-hud-green animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <span className="font-mono text-[12px] text-hud-text-dim tracking-wider">PROCESSING REQUEST...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[rgba(0,255,106,0.1)] p-3 hud-panel">
        <div className="flex items-end gap-2 relative z-10">
          <button onClick={onUpload} className="flex-shrink-0 w-8 h-9 rounded hud-btn flex items-center justify-center" title="Import files">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              rows={1}
              className="w-full px-4 py-2.5 rounded hud-input text-base resize-none font-mono"
              style={{ minHeight: 36, maxHeight: 120 }}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-9 rounded hud-btn flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

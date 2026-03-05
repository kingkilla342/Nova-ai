'use client';

import { useState, useEffect } from 'react';
import { getVersionHistory, rollbackToVersion } from '../lib/store';

export default function VersionHistory({ projectId, onRollback, onClose }) {
  const [versions, setVersions] = useState([]);
  const [confirmRollback, setConfirmRollback] = useState(null);

  useEffect(() => {
    setVersions(getVersionHistory(projectId));
  }, [projectId]);

  const handleRollback = (versionId) => {
    const target = rollbackToVersion(projectId, versionId);
    if (target) {
      onRollback(target.files);
      setConfirmRollback(null);
      onClose();
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-md mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green">
              <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-base">VERSION HISTORY</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Versions */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-mono text-[13px] text-hud-text-dim tracking-wider">NO SNAPSHOTS YET</p>
            </div>
          ) : (
            [...versions].reverse().map((v, i) => (
              <div
                key={v.id}
                className={`hud-panel rounded-lg p-3 transition-all ${i === 0 ? 'border-[rgba(0,255,106,0.25)] glow' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-7 rounded flex items-center justify-center font-display text-[12px] font-bold ${
                      i === 0 ? 'bg-[rgba(0,255,106,0.15)] text-hud-green' : 'bg-[rgba(0,255,106,0.05)] text-hud-text-dim'
                    }`}>
                      v{v.number}
                    </div>
                    <div>
                      <div className="font-sans text-base text-hud-text-bright">{v.label}</div>
                      <div className="font-mono text-[14px] text-hud-text-dim tracking-wider">{formatTime(v.timestamp)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[14px] text-hud-text-dim">
                      {v.fileCount}F / {v.lineCount}L
                    </div>
                    {i !== 0 && (
                      <button
                        onClick={() => setConfirmRollback(v.id)}
                        className="hud-btn px-2 py-1 rounded text-[14px] tracking-wider"
                      >
                        RESTORE
                      </button>
                    )}
                    {i === 0 && (
                      <span className="font-mono text-[14px] text-hud-green tracking-wider px-2 py-1 rounded bg-[rgba(0,255,106,0.08)] border border-[rgba(0,255,106,0.2)]">
                        CURRENT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <span className="font-mono text-[14px] text-hud-text-dim tracking-wider">{versions.length} SNAPSHOT{versions.length !== 1 ? 'S' : ''}</span>
          <button onClick={onClose} className="hud-btn px-4 py-1.5 rounded text-[13px] tracking-wider">CLOSE</button>
        </div>
      </div>

      {/* Rollback confirm */}
      {confirmRollback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade">
          <div className="hud-panel-strong rounded-lg p-5 w-full max-w-xs mx-4 animate-materialize">
            <h3 className="font-display text-hud-amber text-base tracking-wider mb-2">⚠ CONFIRM ROLLBACK</h3>
            <p className="font-mono text-[13px] text-hud-text-dim mb-4 leading-relaxed">
              This will replace all current files with the snapshot. Current state will be saved as a new snapshot first.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmRollback(null)} className="hud-btn px-3 py-1.5 rounded text-[13px] tracking-wider">CANCEL</button>
              <button
                onClick={() => handleRollback(confirmRollback)}
                className="px-3 py-1.5 rounded text-[13px] tracking-wider font-semibold bg-hud-amber/20 border border-hud-amber/40 text-hud-amber hover:bg-hud-amber/30 transition"
              >
                ROLLBACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

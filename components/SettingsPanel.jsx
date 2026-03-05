'use client';

import { useMemo } from 'react';

export default function SettingsPanel({ project, files, onClose }) {
  const stats = useMemo(() => {
    const filePaths = Object.keys(files);
    let totalLines = 0, totalChars = 0;
    for (const content of Object.values(files)) {
      totalLines += (content.match(/\n/g) || []).length + 1;
      totalChars += content.length;
    }
    return { fileCount: filePaths.length, totalLines, totalChars };
  }, [files]);

  const created = new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const updated = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : created;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-lg mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-hud-green rounded-full glow" />
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em]">PROJECT CONFIG</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
              <span className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em]">DETAILS</span>
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
            </div>
            <div className="space-y-2">
              {[
                ['DESIGNATION', project.name],
                ['TYPE', project.type?.toUpperCase()],
                ['VERSION', project.version],
                ...(project.packageName ? [['NAMESPACE', project.packageName]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-hud-text-dim tracking-wider">{label}</span>
                  <span className="font-mono text-[10px] text-hud-text-bright">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
              <span className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em]">TIMELINE</span>
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
            </div>
            <div className="space-y-2">
              {[['CREATED', created], ['LAST MODIFIED', updated]].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-hud-text-dim tracking-wider">{label}</span>
                  <span className="font-mono text-[10px] text-hud-text-bright">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
              <span className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em]">METRICS</span>
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                [stats.fileCount, 'FILES'],
                [stats.totalLines.toLocaleString(), 'LINES'],
                [stats.totalChars.toLocaleString(), 'CHARS'],
              ].map(([value, label]) => (
                <div key={label} className="hud-panel hud-corners rounded-lg p-3 text-center">
                  <div className="font-display text-xl text-hud-green text-glow font-bold">{value}</div>
                  <div className="font-mono text-[8px] text-hud-text-dim mt-0.5 tracking-[0.2em]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
              <span className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em]">EXPORT</span>
              <div className="flex-1 h-px bg-[rgba(0,255,106,0.1)]" />
            </div>
            <button className="w-full hud-btn px-4 py-2.5 rounded font-display text-[10px] tracking-[0.2em] opacity-50 cursor-not-allowed" disabled>
              COMPILATION MODULE — COMING SOON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

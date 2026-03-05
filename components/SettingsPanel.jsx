'use client';

import { useMemo } from 'react';

export default function SettingsPanel({ project, files, onClose }) {
  const stats = useMemo(() => {
    const filePaths = Object.keys(files);
    let totalLines = 0;
    let totalChars = 0;

    for (const content of Object.values(files)) {
      totalLines += (content.match(/\n/g) || []).length + 1;
      totalChars += content.length;
    }

    return {
      fileCount: filePaths.length,
      totalLines,
      totalChars,
    };
  }, [files]);

  const created = new Date(project.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const updated = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : created;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-strong rounded-xl w-full max-w-lg mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-nova-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-nova-text-bright tracking-wide">Project Settings</h2>
          <button onClick={onClose} className="text-nova-text-dim hover:text-nova-text transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Project details */}
          <div>
            <h3 className="text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-3">Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-nova-text-dim">Name</span>
                <span className="text-sm text-nova-text-bright font-mono">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-nova-text-dim">Type</span>
                <span className="text-sm text-nova-text-bright font-mono capitalize">{project.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-nova-text-dim">Version</span>
                <span className="text-sm text-nova-text-bright font-mono">{project.version}</span>
              </div>
              {project.packageName && (
                <div className="flex justify-between">
                  <span className="text-sm text-nova-text-dim">Package</span>
                  <span className="text-sm text-nova-text-bright font-mono">{project.packageName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-nova-text-dim">Created</span>
                <span className="text-sm text-nova-text-bright font-mono">{created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-nova-text-dim">Last Updated</span>
                <span className="text-sm text-nova-text-bright font-mono">{updated}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-3">Statistics</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <div className="font-display text-xl text-nova-accent font-bold">{stats.fileCount}</div>
                <div className="text-[10px] font-mono text-nova-text-dim mt-0.5">Files</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="font-display text-xl text-nova-accent font-bold">
                  {stats.totalLines.toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-nova-text-dim mt-0.5">Lines</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="font-display text-xl text-nova-accent font-bold">
                  {stats.totalChars.toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-nova-text-dim mt-0.5">Chars</div>
              </div>
            </div>
          </div>

          {/* Download placeholder */}
          <div>
            <h3 className="text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-3">Export</h3>
            <button
              className="w-full px-4 py-2.5 rounded-lg bg-nova-olive border border-nova-border text-sm text-nova-text-dim font-mono hover:border-nova-border-light transition cursor-not-allowed opacity-60"
              disabled
            >
              Compilation coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

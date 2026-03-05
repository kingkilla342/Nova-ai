'use client';

import { useState } from 'react';
import { exportProject, downloadBlob } from '../lib/jar-handler';

export default function ExportPanel({ project, files, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const fileCount = Object.keys(files).length;
  const lineCount = Object.values(files).reduce((sum, c) => sum + (c.match(/\n/g) || []).length + 1, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportProject(files, project.name || 'nova-project');
      downloadBlob(blob, `${project.name || 'nova-project'}.zip`);
      setDone(true);
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-md mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-sm">EXPORT PROJECT</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Project summary */}
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 hexagon bg-[rgba(0,255,106,0.1)] flex items-center justify-center glow">
                <span className="font-display font-bold text-hud-green text-sm">
                  {project.type === 'plugin' ? 'P' : project.type === 'mod' ? 'M' : 'D'}
                </span>
              </div>
              <div>
                <div className="font-display text-sm text-hud-green tracking-wider">{project.name}</div>
                <div className="font-mono text-[8px] text-hud-text-dim tracking-wider">
                  MC {project.mcVersion || '1.20.4'} • v{project.version}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Files', fileCount],
                ['Lines', lineCount.toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="glass-tag rounded px-3 py-2 text-center">
                  <div className="font-display text-lg text-hud-green">{v}</div>
                  <div className="font-mono text-[7px] text-hud-text-dim tracking-wider">{k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What's included */}
          <div>
            <p className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em] uppercase mb-2">PACKAGE INCLUDES</p>
            <div className="space-y-1.5">
              {[
                ['All source files', 'Java, YAML, JSON, Gradle configs'],
                ['Build scripts', 'Gradle build + shadow plugin for fat JARs'],
                ['README', 'Build instructions + GitHub Actions workflow'],
                ['.gitignore', 'Ready for Git/GitHub'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hud-green mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-sans text-xs text-hud-text-bright">{title}</span>
                    <span className="font-mono text-[9px] text-hud-text-dim ml-1.5">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to build */}
          <div className="glass-card rounded-lg p-4">
            <p className="font-mono text-[8px] text-hud-text-dim tracking-[0.3em] uppercase mb-2">HOW TO BUILD</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[rgba(0,255,106,0.1)] font-display text-[9px] text-hud-green font-bold">1</div>
                <span className="font-mono text-[10px] text-hud-text">Unzip the downloaded file</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[rgba(0,255,106,0.1)] font-display text-[9px] text-hud-green font-bold">2</div>
                <span className="font-mono text-[10px] text-hud-text">Run <span className="text-hud-green">./gradlew build</span> in terminal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[rgba(0,255,106,0.1)] font-display text-[9px] text-hud-green font-bold">3</div>
                <span className="font-mono text-[10px] text-hud-text">JAR appears in <span className="text-hud-green">build/libs/</span></span>
              </div>
            </div>
          </div>

          {done && (
            <div className="glass-card rounded-lg p-3 border-[rgba(0,255,106,0.3)] animate-slide-up text-center">
              <span className="font-display text-sm text-hud-green text-glow tracking-wider">✓ DOWNLOAD STARTED</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <span className="font-mono text-[8px] text-hud-text-dim tracking-wider">
            {project.name}.zip
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-xs tracking-wider">CLOSE</button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="hud-btn-primary px-5 py-2 rounded font-display text-xs tracking-wider font-bold disabled:opacity-50"
            >
              {exporting ? 'PACKAGING...' : 'DOWNLOAD ZIP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

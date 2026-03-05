'use client';

import { useState, useRef, useCallback } from 'react';

export default function UploadModal({ onClose, onImport }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [upgradeFrom, setUpgradeFrom] = useState(null);
  const [upgradeTo, setUpgradeTo] = useState('1.20.4');
  const [mode, setMode] = useState('import'); // 'import', 'debug', 'upgrade'
  const inputRef = useRef(null);

  const MC_TARGETS = ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.20.1', '1.19.4'];

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name: file.name, path: file.webkitRelativePath || file.name, content: e.target.result, size: file.size });
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const detectVersion = (fileContents) => {
    for (const f of fileContents) {
      // Check plugin.yml for api-version
      if (f.name === 'plugin.yml' || f.path.endsWith('plugin.yml')) {
        const match = f.content.match(/api-version:\s*['"]?(\d+\.\d+)/);
        if (match) return match[1];
      }
      // Check build.gradle for spigot version
      if (f.name === 'build.gradle' || f.path.endsWith('build.gradle')) {
        const match = f.content.match(/spigot-api:(\d+\.\d+\.\d+)/);
        if (match) return match[1];
      }
      // Check for old imports
      if (f.content.includes('org.bukkit.craftbukkit.v1_16')) return '1.16';
      if (f.content.includes('org.bukkit.craftbukkit.v1_17')) return '1.17';
      if (f.content.includes('org.bukkit.craftbukkit.v1_18')) return '1.18';
      if (f.content.includes('org.bukkit.craftbukkit.v1_19')) return '1.19';
    }
    return null;
  };

  const handleFiles = async (fileList) => {
    const validExts = ['.java', '.yml', '.yaml', '.json', '.gradle', '.toml', '.xml', '.properties', '.mcfunction', '.mcmeta', '.txt', '.md', '.cfg'];
    const validFiles = Array.from(fileList).filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return validExts.includes(ext) && f.size < 512 * 1024;
    });

    if (validFiles.length === 0) return;

    setProcessing(true);
    try {
      const contents = await Promise.all(validFiles.map(readFile));
      setFiles(contents);

      // Auto-detect version
      const detected = detectVersion(contents);
      if (detected) {
        setUpgradeFrom(detected);
        setMode('upgrade');
      }
    } catch (err) {
      console.error('File read error:', err);
    }
    setProcessing(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleImport = () => {
    if (files.length === 0) return;

    // Build file map
    const fileMap = {};
    for (const f of files) {
      // Clean up paths — remove leading folder if it's a project root
      let path = f.path || f.name;
      // Remove common root prefixes
      path = path.replace(/^(src\/|main\/)?/, '');
      // If it has a relative path with folders, use it; otherwise just use name
      if (!path.includes('/')) {
        // Try to guess correct path based on file type
        if (f.name.endsWith('.java')) {
          path = `src/main/java/${f.name}`;
        } else if (f.name === 'plugin.yml' || f.name === 'config.yml') {
          path = `src/main/resources/${f.name}`;
        } else if (f.name === 'build.gradle' || f.name === 'settings.gradle') {
          path = f.name;
        }
      }
      fileMap[path] = f.content;
    }

    onImport({
      files: fileMap,
      mode,
      upgradeFrom,
      upgradeTo: mode === 'upgrade' ? upgradeTo : null,
    });
    onClose();
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-lg mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-sm">IMPORT PROJECT</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'import', label: 'IMPORT', desc: 'Add files to project', icon: '📥' },
              { key: 'debug', label: 'DEBUG', desc: 'Fix broken plugin', icon: '🔧' },
              { key: 'upgrade', label: 'UPGRADE', desc: 'Update MC version', icon: '⬆️' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-3 rounded text-center transition-all border ${
                  mode === m.key
                    ? 'glass-card border-[rgba(0,255,106,0.35)] text-hud-green glow'
                    : 'bg-[rgba(0,255,106,0.02)] border-[rgba(0,255,106,0.08)] text-hud-text-dim hover:border-[rgba(0,255,106,0.2)]'
                }`}
              >
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="font-display text-[10px] font-bold tracking-wider">{m.label}</div>
                <div className="font-mono text-[7px] mt-0.5 opacity-50">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`rounded-lg p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
              dragOver
                ? 'border-hud-green bg-[rgba(0,255,106,0.06)] glow-strong'
                : 'border-[rgba(0,255,106,0.15)] hover:border-[rgba(0,255,106,0.3)] bg-[rgba(0,255,106,0.02)]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".java,.yml,.yaml,.json,.gradle,.toml,.xml,.properties,.mcfunction,.mcmeta,.txt,.md"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-hud-green animate-bounce" />
                <span className="font-mono text-[10px] text-hud-green tracking-wider">SCANNING FILES...</span>
              </div>
            ) : files.length === 0 ? (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-hud-green opacity-40 mx-auto mb-3">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <p className="font-display text-xs text-hud-text-dim tracking-wider mb-1">DROP FILES HERE</p>
                <p className="font-mono text-[8px] text-hud-text-dim opacity-60">
                  .java, .yml, .json, .gradle, .toml — max 512KB each
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-sm text-hud-green text-glow">{files.length}</span>
                  <span className="font-mono text-[10px] text-hud-text-dim tracking-wider">
                    FILE{files.length !== 1 ? 'S' : ''} LOADED ({(totalSize / 1024).toFixed(1)}KB)
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-0.5">
                  {files.map((f, i) => (
                    <div key={i} className="font-mono text-[8px] text-hud-text-dim">{f.path || f.name}</div>
                  ))}
                </div>
                <p className="font-mono text-[8px] text-hud-green opacity-60">Click to add more files</p>
              </div>
            )}
          </div>

          {/* Version upgrade panel */}
          {mode === 'upgrade' && (
            <div className="glass-card rounded-lg p-4 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-amber">
                  <path d="M12 2v20M2 12l10-10 10 10" />
                </svg>
                <span className="font-display text-[11px] text-hud-amber tracking-[0.2em]">VERSION UPGRADE</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="font-mono text-[8px] text-hud-text-dim tracking-wider mb-1">FROM</div>
                  <div className="glass-tag px-3 py-2 rounded font-mono text-sm text-hud-red">
                    {upgradeFrom || 'Unknown'}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green flex-shrink-0">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="flex-1 text-center">
                  <div className="font-mono text-[8px] text-hud-text-dim tracking-wider mb-1">TO</div>
                  <select
                    value={upgradeTo}
                    onChange={(e) => setUpgradeTo(e.target.value)}
                    className="w-full hud-input px-3 py-2 rounded font-mono text-sm text-hud-green text-center appearance-none cursor-pointer"
                  >
                    {MC_TARGETS.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="font-mono text-[8px] text-hud-text-dim leading-relaxed">
                Nova will automatically fix deprecated APIs, update imports, adjust config files, and ensure compatibility with the target version.
              </div>
            </div>
          )}

          {/* Debug mode info */}
          {mode === 'debug' && files.length > 0 && (
            <div className="glass-card rounded-lg p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔧</span>
                <span className="font-display text-[11px] text-hud-cyan tracking-[0.2em]">DEBUG MODE</span>
              </div>
              <p className="font-mono text-[9px] text-hud-text-dim leading-relaxed">
                Nova will scan all files, check for missing imports, broken dependencies, invalid configs, and common plugin errors. Fixes will be applied automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <span className="font-mono text-[8px] text-hud-text-dim tracking-wider">
            {files.length > 0 ? `${files.length} FILES READY` : 'AWAITING FILES...'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-xs tracking-wider">CANCEL</button>
            <button
              onClick={handleImport}
              disabled={files.length === 0}
              className="hud-btn-primary px-5 py-2 rounded font-display text-xs tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {mode === 'debug' ? 'SCAN & FIX' : mode === 'upgrade' ? 'UPGRADE' : 'IMPORT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

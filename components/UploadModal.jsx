'use client';

import { useState, useRef, useCallback } from 'react';
import { importJar, buildProjectFromJar } from '../lib/jar-handler';

export default function UploadModal({ onClose, onImport }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [jarData, setJarData] = useState(null);
  const [upgradeFrom, setUpgradeFrom] = useState(null);
  const [upgradeTo, setUpgradeTo] = useState('1.20.4');
  const [mode, setMode] = useState('import');
  const [status, setStatus] = useState('');
  const inputRef = useRef(null);

  const MC_TARGETS = ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.20.1', '1.19.4'];

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name: file.name, path: file.webkitRelativePath || file.name, content: e.target.result, size: file.size });
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const detectVersion = (fileContents) => {
    for (const f of fileContents) {
      if (f.name === 'plugin.yml' || f.path.endsWith('plugin.yml')) {
        const match = f.content.match(/api-version:\s*['"]?(\d+\.\d+)/);
        if (match) return match[1];
      }
      if (f.name === 'build.gradle' || f.path.endsWith('build.gradle')) {
        const match = f.content.match(/spigot-api:(\d+\.\d+\.\d+)/);
        if (match) return match[1];
      }
    }
    return null;
  };

  const handleJar = async (file) => {
    setProcessing(true);
    setStatus('Extracting JAR contents...');
    try {
      const data = await importJar(file);
      setJarData(data);
      setStatus(`Found ${data.classes.length} classes, ${Object.keys(data.resources).length} resources`);

      if (data.apiVersion) {
        setUpgradeFrom(data.apiVersion);
        setMode('upgrade');
      } else {
        setMode('debug');
      }
    } catch (err) {
      setStatus('Failed to read JAR: ' + err.message);
    }
    setProcessing(false);
  };

  const handleFiles = async (fileList) => {
    const allFiles = Array.from(fileList);

    // Check for JAR files first
    const jarFile = allFiles.find(f => f.name.endsWith('.jar'));
    if (jarFile) {
      await handleJar(jarFile);
      return;
    }

    const validExts = ['.java', '.yml', '.yaml', '.json', '.gradle', '.toml', '.xml', '.properties', '.mcfunction', '.mcmeta', '.txt', '.md'];
    const validFiles = allFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return validExts.includes(ext) && f.size < 512 * 1024;
    });

    if (validFiles.length === 0) return;

    setProcessing(true);
    setStatus('Reading files...');
    try {
      const contents = await Promise.all(validFiles.map(readTextFile));
      setFiles(contents);
      const detected = detectVersion(contents);
      if (detected) { setUpgradeFrom(detected); setMode('upgrade'); }
      setStatus(`${contents.length} files loaded`);
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setProcessing(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleImport = () => {
    if (jarData) {
      // JAR import path
      const { files: projectFiles, summary } = buildProjectFromJar(jarData);
      onImport({
        files: projectFiles,
        mode,
        upgradeFrom: jarData.apiVersion,
        upgradeTo: mode === 'upgrade' ? upgradeTo : null,
        jarSummary: summary,
      });
      onClose();
      return;
    }

    if (files.length === 0) return;

    const fileMap = {};
    for (const f of files) {
      let path = f.path || f.name;
      if (!path.includes('/')) {
        if (f.name.endsWith('.java')) path = `src/main/java/${f.name}`;
        else if (f.name === 'plugin.yml' || f.name === 'config.yml') path = `src/main/resources/${f.name}`;
        else path = f.name;
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
  const hasContent = files.length > 0 || jarData;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-lg mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-base">IMPORT PROJECT</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'import', label: 'IMPORT', desc: 'Add files', icon: '📥' },
              { key: 'debug', label: 'DEBUG', desc: 'Fix errors', icon: '🔧' },
              { key: 'upgrade', label: 'UPGRADE', desc: 'Update version', icon: '⬆️' },
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
                <div className="text-3xl mb-1">{m.icon}</div>
                <div className="font-display text-[13px] font-bold tracking-wider">{m.label}</div>
                <div className="font-mono text-[13px] mt-0.5 opacity-50">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
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
              accept=".java,.yml,.yaml,.json,.gradle,.toml,.xml,.properties,.jar,.mcfunction,.mcmeta,.txt,.md"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            {processing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-hud-green animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="font-mono text-[13px] text-hud-green tracking-wider">{status}</span>
              </div>
            ) : !hasContent ? (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-hud-green opacity-40 mx-auto mb-3">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <p className="font-display text-base text-hud-text-dim tracking-wider mb-1">DROP FILES OR JAR HERE</p>
                <p className="font-mono text-[14px] text-hud-text-dim opacity-60">
                  .jar (decompile) • .java, .yml, .json, .gradle — max 512KB each
                </p>
              </>
            ) : jarData ? (
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-3xl">📦</span>
                  <span className="font-display text-base text-hud-green text-glow">{jarData.pluginName || 'Unknown Plugin'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    ['Classes', jarData.classes.length],
                    ['Resources', Object.keys(jarData.resources).length],
                    ['Commands', jarData.commands.length],
                    ['Version', jarData.version || '?'],
                  ].map(([k, v]) => (
                    <div key={k} className="glass-tag rounded px-2 py-1.5 text-center">
                      <div className="font-display text-base text-hud-green">{v}</div>
                      <div className="font-mono text-[13px] text-hud-text-dim tracking-wider">{k}</div>
                    </div>
                  ))}
                </div>
                {jarData.mainClass && (
                  <div className="font-mono text-[14px] text-hud-text-dim text-center mt-2">
                    Main: {jarData.mainClass}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-base text-hud-green text-glow">{files.length}</span>
                  <span className="font-mono text-[13px] text-hud-text-dim tracking-wider">
                    FILE{files.length !== 1 ? 'S' : ''} ({(totalSize / 1024).toFixed(1)}KB)
                  </span>
                </div>
                <div className="max-h-20 overflow-y-auto space-y-0.5">
                  {files.map((f, i) => (
                    <div key={i} className="font-mono text-[14px] text-hud-text-dim">{f.path || f.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* JAR decompile info */}
          {jarData && (
            <div className="glass-card rounded-lg p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔍</span>
                <span className="font-display text-[14px] text-hud-cyan tracking-[0.2em]">JAR ANALYSIS</span>
              </div>
              <p className="font-mono text-[12px] text-hud-text-dim leading-relaxed mb-3">
                Resources extracted. Nova AI will regenerate Java source code from the class structure and plugin metadata. This creates editable source you can modify and rebuild.
              </p>
              {jarData.classes.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-0.5">
                  <p className="font-mono text-[14px] text-hud-text-dim tracking-wider mb-1">DETECTED CLASSES:</p>
                  {jarData.classes.slice(0, 20).map((c, i) => (
                    <div key={i} className="font-mono text-[14px] text-hud-text-dim opacity-60">
                      {c.className}
                    </div>
                  ))}
                  {jarData.classes.length > 20 && (
                    <div className="font-mono text-[14px] text-hud-green">+{jarData.classes.length - 20} more</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upgrade panel */}
          {mode === 'upgrade' && (upgradeFrom || jarData?.apiVersion) && (
            <div className="glass-card rounded-lg p-4 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2">
                <span className="text-base">⬆️</span>
                <span className="font-display text-[14px] text-hud-amber tracking-[0.2em]">VERSION UPGRADE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="font-mono text-[14px] text-hud-text-dim tracking-wider mb-1">FROM</div>
                  <div className="glass-tag px-4 py-2.5 rounded font-mono text-base text-hud-red">
                    {upgradeFrom || jarData?.apiVersion || '?'}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green flex-shrink-0">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="flex-1 text-center">
                  <div className="font-mono text-[14px] text-hud-text-dim tracking-wider mb-1">TO</div>
                  <select
                    value={upgradeTo}
                    onChange={(e) => setUpgradeTo(e.target.value)}
                    className="w-full hud-input px-4 py-2.5 rounded font-mono text-base text-hud-green text-center appearance-none cursor-pointer"
                  >
                    {MC_TARGETS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Debug panel */}
          {mode === 'debug' && hasContent && (
            <div className="glass-card rounded-lg p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔧</span>
                <span className="font-display text-[14px] text-hud-cyan tracking-[0.2em]">DEBUG MODE</span>
              </div>
              <p className="font-mono text-[12px] text-hud-text-dim leading-relaxed">
                Nova will scan all files for missing imports, broken dependencies, invalid configs, and common plugin errors. Fixes applied automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <span className="font-mono text-[14px] text-hud-text-dim tracking-wider">
            {jarData ? `JAR: ${jarData.pluginName || 'plugin'}` : files.length > 0 ? `${files.length} FILES` : 'AWAITING INPUT...'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-base tracking-wider">CANCEL</button>
            <button
              onClick={handleImport}
              disabled={!hasContent}
              className="hud-btn-primary px-5 py-2 rounded font-display text-base tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {jarData ? 'DECOMPILE & IMPORT' : mode === 'debug' ? 'SCAN & FIX' : mode === 'upgrade' ? 'UPGRADE' : 'IMPORT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

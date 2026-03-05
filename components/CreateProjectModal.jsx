'use client';

import { useState } from 'react';
import { PROJECT_TYPES, MC_VERSIONS, generatePluginTemplate, generateDatapackTemplate, generateModTemplate } from '../lib/templates';
import { saveProjectFiles, createSnapshot } from '../lib/store';

export default function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('plugin');
  const [packageName, setPackageName] = useState('com.example.');
  const [version, setVersion] = useState('1.0.0');
  const [mcVersion, setMcVersion] = useState('1.20.4');

  const selectedMC = MC_VERSIONS.find(v => v.value === mcVersion);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const project = {
      id,
      name: name.trim(),
      type,
      version,
      mcVersion,
      packageName: type !== 'datapack' ? packageName : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let files = {};
    switch (type) {
      case 'plugin': files = generatePluginTemplate(name.trim(), packageName, mcVersion); break;
      case 'datapack': files = generateDatapackTemplate(name.trim(), packageName, mcVersion); break;
      case 'mod': files = generateModTemplate(name.trim(), packageName, mcVersion); break;
    }

    saveProjectFiles(id, files);
    createSnapshot(id, files, 'Project created');
    onCreate(project);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-lg mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-hud-green rounded-full glow" />
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-base">INITIALIZE PROJECT</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">PROJECT DESIGNATION</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="MyPlugin"
              className="w-full px-3 py-3 rounded hud-input text-base"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">PROJECT TYPE</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROJECT_TYPES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`px-3 py-3 rounded text-center transition-all border ${
                    type === key
                      ? 'bg-[rgba(0,255,106,0.12)] border-[rgba(0,255,106,0.4)] text-hud-green glow'
                      : 'bg-[rgba(0,255,106,0.02)] border-[rgba(0,255,106,0.1)] text-hud-text-dim hover:border-[rgba(0,255,106,0.25)]'
                  }`}
                >
                  <div className="font-display text-[14px] font-bold tracking-wider">{key.toUpperCase()}</div>
                  <div className="font-mono text-[14px] mt-0.5 opacity-60">{label.match(/\((.+)\)/)?.[1] || label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Minecraft Version */}
          <div>
            <label className="block font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">MINECRAFT VERSION</label>
            <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {MC_VERSIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setMcVersion(v.value)}
                  className={`px-2 py-2 rounded text-center transition-all border ${
                    mcVersion === v.value
                      ? 'bg-[rgba(0,255,106,0.12)] border-[rgba(0,255,106,0.4)] text-hud-green glow'
                      : 'bg-[rgba(0,255,106,0.02)] border-[rgba(0,255,106,0.08)] text-hud-text-dim hover:border-[rgba(0,255,106,0.2)]'
                  }`}
                >
                  <div className="font-mono text-[14px] font-semibold">{v.value}</div>
                </button>
              ))}
            </div>
            {/* Version info */}
            {selectedMC && (
              <div className="mt-2 flex gap-3 font-mono text-[14px] text-hud-text-dim tracking-wider">
                <span>JAVA {selectedMC.java}</span>
                <span>•</span>
                <span>PACK FORMAT {selectedMC.packFormat}</span>
                <span>•</span>
                <span>API {selectedMC.apiVersion}</span>
              </div>
            )}
          </div>

          {/* Package name */}
          {type !== 'datapack' && (
            <div>
              <label className="block font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">PACKAGE NAMESPACE</label>
              <input
                type="text" value={packageName} onChange={e => setPackageName(e.target.value)}
                className="w-full px-3 py-3 rounded hud-input text-base"
                placeholder="com.yourname.pluginname"
              />
            </div>
          )}

          {/* Version */}
          <div>
            <label className="block font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">PLUGIN VERSION</label>
            <input
              type="text" value={version} onChange={e => setVersion(e.target.value)}
              className="w-full px-3 py-3 rounded hud-input text-base"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="font-mono text-[14px] text-hud-text-dim tracking-wider">
            {name.trim() ? `${name.trim().toUpperCase()} // MC ${mcVersion} // ${type.toUpperCase()}` : 'AWAITING INPUT...'}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-base tracking-wider">CANCEL</button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="hud-btn-primary px-5 py-2 rounded font-display text-base tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              INITIALIZE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

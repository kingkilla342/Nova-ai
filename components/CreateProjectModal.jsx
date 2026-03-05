'use client';

import { useState } from 'react';
import { PROJECT_TYPES, generatePluginTemplate, generateDatapackTemplate, generateModTemplate } from '../lib/templates';
import { saveProjectFiles } from '../lib/store';

export default function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('plugin');
  const [packageName, setPackageName] = useState('com.example.');
  const [version, setVersion] = useState('1.0.0');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const project = {
      id,
      name: name.trim(),
      type,
      version,
      packageName: type !== 'datapack' ? packageName : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let files = {};
    switch (type) {
      case 'plugin': files = generatePluginTemplate(name.trim(), packageName); break;
      case 'datapack': files = generateDatapackTemplate(name.trim()); break;
      case 'mod': files = generateModTemplate(name.trim(), packageName); break;
    }
    saveProjectFiles(id, files);
    onCreate(project);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-md mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-hud-green rounded-full glow" />
            <h2 className="font-display font-bold text-hud-green tracking-[0.2em] text-base">NEW PROJECT</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block font-mono text-[9px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">
              PROJECT DESIGNATION
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyPlugin"
              className="w-full px-3 py-2.5 rounded hud-input text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">
              PROJECT TYPE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROJECT_TYPES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`px-3 py-2.5 rounded text-[10px] font-display font-semibold tracking-wider transition-all border ${
                    type === key
                      ? 'bg-[rgba(0,255,106,0.12)] border-[rgba(0,255,106,0.4)] text-hud-green glow'
                      : 'bg-[rgba(0,255,106,0.02)] border-[rgba(0,255,106,0.1)] text-hud-text-dim hover:border-[rgba(0,255,106,0.25)]'
                  }`}
                >
                  {label.split(' ')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {type !== 'datapack' && (
            <div>
              <label className="block font-mono text-[9px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">
                PACKAGE NAMESPACE
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-3 py-2.5 rounded hud-input text-sm"
              />
            </div>
          )}

          <div>
            <label className="block font-mono text-[9px] text-hud-text-dim tracking-[0.3em] uppercase mb-1.5">
              VERSION
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2.5 rounded hud-input text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex justify-end gap-3">
          <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-xs tracking-wider">CANCEL</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="hud-btn-primary px-5 py-2 rounded font-display text-xs tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            INITIALIZE
          </button>
        </div>
      </div>
    </div>
  );
}

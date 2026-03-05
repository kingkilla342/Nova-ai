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

    // Generate template files
    let files = {};
    switch (type) {
      case 'plugin':
        files = generatePluginTemplate(name.trim(), packageName);
        break;
      case 'datapack':
        files = generateDatapackTemplate(name.trim());
        break;
      case 'mod':
        files = generateModTemplate(name.trim(), packageName);
        break;
    }

    saveProjectFiles(id, files);
    onCreate(project);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-strong rounded-xl w-full max-w-md mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-nova-border">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-nova-text-bright tracking-wide">New Project</h2>
            <button onClick={onClose} className="text-nova-text-dim hover:text-nova-text transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyPlugin"
              className="w-full px-3 py-2.5 rounded-lg bg-nova-olive border border-nova-border text-sm text-nova-text-bright placeholder:text-nova-text-dim/50 font-mono focus:outline-none focus:border-nova-accent/50 focus:ring-1 focus:ring-nova-accent/20 transition"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-1.5">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROJECT_TYPES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                    type === key
                      ? 'bg-nova-accent/15 border-nova-accent/50 text-nova-accent glow-accent'
                      : 'bg-nova-olive border-nova-border text-nova-text-dim hover:border-nova-border-light'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Package name (not for datapacks) */}
          {type !== 'datapack' && (
            <div>
              <label className="block text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-1.5">
                Package Name
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.example.myplugin"
                className="w-full px-3 py-2.5 rounded-lg bg-nova-olive border border-nova-border text-sm text-nova-text-bright placeholder:text-nova-text-dim/50 font-mono focus:outline-none focus:border-nova-accent/50 focus:ring-1 focus:ring-nova-accent/20 transition"
              />
            </div>
          )}

          {/* Version */}
          <div>
            <label className="block text-xs font-mono text-nova-text-dim uppercase tracking-wider mb-1.5">
              Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-nova-olive border border-nova-border text-sm text-nova-text-bright font-mono focus:outline-none focus:border-nova-accent/50 focus:ring-1 focus:ring-nova-accent/20 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-nova-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-nova-text-dim hover:text-nova-text transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2 rounded-lg bg-nova-accent text-nova-bg font-semibold text-sm hover:bg-nova-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';

function buildTree(files) {
  const root = { name: '', children: {}, isDir: true };
  for (const path of Object.keys(files)) {
    const parts = path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current.children[part] = { name: part, path, isDir: false };
      } else {
        if (!current.children[part]) current.children[part] = { name: part, children: {}, isDir: true };
        current = current.children[part];
      }
    }
  }
  return root;
}

function getFileIcon(name) {
  if (name.endsWith('.java')) return { label: 'JV', color: 'text-orange-400' };
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return { label: 'YM', color: 'text-pink-400' };
  if (name.endsWith('.json')) return { label: 'JS', color: 'text-yellow-300' };
  if (name.endsWith('.gradle')) return { label: 'GR', color: 'text-cyan-400' };
  if (name.endsWith('.toml')) return { label: 'TM', color: 'text-purple-400' };
  if (name.endsWith('.mcfunction')) return { label: 'MC', color: 'text-emerald-400' };
  return { label: 'FL', color: 'text-hud-text-dim' };
}

function TreeNode({ node, depth, activeFile, onSelect, onDelete }) {
  const [expanded, setExpanded] = useState(depth < 3);

  if (!node.isDir) {
    const { label, color } = getFileIcon(node.name);
    const isActive = activeFile === node.path;
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] text-left group transition-all ${
          isActive
            ? 'bg-[rgba(0,255,106,0.08)] text-hud-green border-l-2 border-hud-green'
            : 'text-hud-text-dim hover:text-hud-text hover:bg-[rgba(0,255,106,0.03)] border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <span className={`font-mono text-[7px] font-bold ${isActive ? 'text-hud-green' : color}`}>{label}</span>
        <span className="font-mono text-[10px] truncate flex-1">{node.name}</span>
        <span
          onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
          className="hidden group-hover:block text-hud-text-dim hover:text-hud-red text-[9px] cursor-pointer px-1"
        >×</span>
      </button>
    );
  }

  const children = Object.values(node.children).sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)));

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 px-2 py-[3px] text-left text-hud-text-dim hover:text-hud-green transition"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          <svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
            <path d="M2 1l4 3-4 3V1z" />
          </svg>
          <span className="font-mono text-[10px] font-semibold tracking-wider">{node.name}</span>
        </button>
      )}
      {expanded && children.map(child => (
        <TreeNode key={child.name} node={child} depth={node.name ? depth + 1 : depth} activeFile={activeFile} onSelect={onSelect} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function FileTree({ files, activeFile, onSelect, onCreate, onDelete }) {
  const [showInput, setShowInput] = useState(false);
  const [newPath, setNewPath] = useState('');
  const tree = useMemo(() => buildTree(files), [files]);
  const fileCount = Object.keys(files).length;

  const handleCreate = () => {
    if (!newPath.trim()) return;
    onCreate(newPath.trim(), '');
    setNewPath('');
    setShowInput(false);
  };

  return (
    <div className="h-full flex flex-col scan-line">
      <div className="flex-shrink-0 px-3 py-2 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between hud-panel relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-display text-[10px] text-hud-green font-semibold tracking-[0.2em]">FILES</span>
          <span className="font-mono text-[8px] text-hud-text-dim px-1 py-0.5 rounded border border-[rgba(0,255,106,0.1)] bg-[rgba(0,255,106,0.03)]">{fileCount}</span>
        </div>
        <button onClick={() => setShowInput(!showInput)} className="text-hud-text-dim hover:text-hud-green transition">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {showInput && (
        <div className="px-2 py-2 border-b border-[rgba(0,255,106,0.08)]">
          <input
            type="text" value={newPath} onChange={e => setNewPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="path/to/file.java"
            className="w-full px-2 py-1.5 rounded hud-input text-[10px]"
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {fileCount === 0 ? (
          <p className="font-mono text-[9px] text-hud-text-dim px-3 py-4 text-center tracking-wider">NO FILES DETECTED</p>
        ) : (
          <TreeNode node={tree} depth={0} activeFile={activeFile} onSelect={onSelect} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

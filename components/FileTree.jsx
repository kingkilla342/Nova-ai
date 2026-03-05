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

function FileIcon({ name, isDir, isOpen }) {
  if (isDir) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={isOpen ? 'text-hud-green' : 'text-hud-green opacity-50'}>
        <path d="M2 4h4l2 2h6v7H2V4z" stroke="currentColor" strokeWidth="1.2" fill={isOpen ? 'rgba(0,255,106,0.1)' : 'none'} />
        {isOpen && <path d="M1 8h14l-2 6H3L1 8z" stroke="currentColor" strokeWidth="1" fill="rgba(0,255,106,0.06)" />}
      </svg>
    );
  }

  // File type icons
  if (name.endsWith('.java')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#ff8a00" strokeWidth="1" fill="rgba(255,138,0,0.08)" />
        <text x="5" y="11" fontSize="7" fontWeight="bold" fill="#ff8a00" fontFamily="monospace">J</text>
      </svg>
    );
  }
  if (name.endsWith('.yml') || name.endsWith('.yaml')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#ff55aa" strokeWidth="1" fill="rgba(255,85,170,0.08)" />
        <path d="M5 5l3 3-3 3" stroke="#ff55aa" strokeWidth="1.2" />
      </svg>
    );
  }
  if (name.endsWith('.json') || name.endsWith('.mcmeta')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#ffcc00" strokeWidth="1" fill="rgba(255,204,0,0.08)" />
        <text x="4" y="11" fontSize="7" fontWeight="bold" fill="#ffcc00" fontFamily="monospace">{'{}'}</text>
      </svg>
    );
  }
  if (name.endsWith('.gradle')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#00ddff" strokeWidth="1" fill="rgba(0,221,255,0.08)" />
        <path d="M5 5h6M5 8h4M5 11h5" stroke="#00ddff" strokeWidth="1" />
      </svg>
    );
  }
  if (name.endsWith('.toml')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#aa77ff" strokeWidth="1" fill="rgba(170,119,255,0.08)" />
        <text x="4.5" y="11" fontSize="7" fontWeight="bold" fill="#aa77ff" fontFamily="monospace">T</text>
      </svg>
    );
  }
  if (name.endsWith('.mcfunction')) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="#00ff6a" strokeWidth="1" fill="rgba(0,255,106,0.08)" />
        <path d="M5 5l3 2-3 2M9 11h3" stroke="#00ff6a" strokeWidth="1.2" />
      </svg>
    );
  }
  // Default
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M4 1h5l4 4v10H4V1z" stroke="currentColor" strokeWidth="1" className="text-hud-text-dim" fill="rgba(0,255,106,0.03)" />
      <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1" className="text-hud-text-dim" />
    </svg>
  );
}

function TreeNode({ node, depth, activeFile, onSelect, onDelete }) {
  const [expanded, setExpanded] = useState(depth < 3);

  if (!node.isDir) {
    const isActive = activeFile === node.path;
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-[4px] text-left group transition-all ${
          isActive
            ? 'bg-[rgba(0,255,106,0.08)] text-hud-green border-l-2 border-hud-green'
            : 'text-hud-text-dim hover:text-hud-text hover:bg-[rgba(0,255,106,0.03)] border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <FileIcon name={node.name} isDir={false} />
        <span className="font-mono text-[10px] truncate flex-1">{node.name}</span>
        <span
          onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
          className="hidden group-hover:flex w-4 h-4 items-center justify-center text-hud-text-dim hover:text-hud-red text-[9px] cursor-pointer rounded hover:bg-[rgba(255,51,68,0.1)]"
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
          className="w-full flex items-center gap-1.5 px-2 py-[4px] text-left text-hud-text-dim hover:text-hud-green transition"
          style={{ paddingLeft: depth * 14 + 8 }}
        >
          <svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}>
            <path d="M2 1l4 3-4 3V1z" />
          </svg>
          <FileIcon name={node.name} isDir={true} isOpen={expanded} />
          <span className="font-mono text-[10px] font-semibold tracking-wider">{node.name}</span>
          <span className="font-mono text-[7px] text-hud-text-dim opacity-50 ml-auto">{Object.keys(node.children).length}</span>
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
        <button onClick={() => setShowInput(!showInput)} className="text-hud-text-dim hover:text-hud-green transition" title="New file">
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

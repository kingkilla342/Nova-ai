'use client';

import { useState, useMemo } from 'react';

// Build tree structure from flat file paths
function buildTree(files) {
  const root = { name: '', children: {}, isDir: true };

  for (const path of Object.keys(files)) {
    const parts = path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // File
        current.children[part] = { name: part, path, isDir: false };
      } else {
        // Directory
        if (!current.children[part]) {
          current.children[part] = { name: part, children: {}, isDir: true };
        }
        current = current.children[part];
      }
    }
  }

  return root;
}

function getFileIcon(name) {
  if (name.endsWith('.java')) return { icon: 'J', color: 'text-orange-400' };
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return { icon: 'Y', color: 'text-pink-400' };
  if (name.endsWith('.json')) return { icon: '{', color: 'text-yellow-400' };
  if (name.endsWith('.gradle')) return { icon: 'G', color: 'text-cyan-400' };
  if (name.endsWith('.toml')) return { icon: 'T', color: 'text-purple-400' };
  if (name.endsWith('.mcfunction')) return { icon: 'F', color: 'text-emerald-400' };
  if (name.endsWith('.mcmeta')) return { icon: 'M', color: 'text-blue-400' };
  return { icon: 'F', color: 'text-nova-text-dim' };
}

function TreeNode({ node, depth, activeFile, onSelect, onDelete }) {
  const [expanded, setExpanded] = useState(depth < 3);

  if (!node.isDir) {
    const { icon, color } = getFileIcon(node.name);
    const isActive = activeFile === node.path;

    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-left group transition-all ${
          isActive
            ? 'bg-nova-accent/10 text-nova-accent'
            : 'text-nova-text-dim hover:text-nova-text hover:bg-nova-olive'
        }`}
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-nova-accent' : color}`}>
          {icon}
        </span>
        <span className="text-[11px] font-mono truncate flex-1">{node.name}</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.path);
          }}
          className="hidden group-hover:block text-nova-text-dim hover:text-nova-red text-[10px] cursor-pointer px-1"
        >
          ×
        </span>
      </button>
    );
  }

  const children = Object.values(node.children).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 px-2 py-1 text-left text-nova-text-dim hover:text-nova-text hover:bg-nova-olive transition"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="currentColor"
            className={`transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M2 1l4 3-4 3V1z" />
          </svg>
          <span className="text-[11px] font-mono truncate">{node.name}</span>
        </button>
      )}
      {expanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={node.name ? depth + 1 : depth}
              activeFile={activeFile}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
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
    <div className="h-full flex flex-col bg-nova-bg">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-nova-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-nova-text-bright">Files</span>
          <span className="text-[10px] font-mono text-nova-text-dim">{fileCount}</span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-nova-text-dim hover:text-nova-accent transition"
          title="New file"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* New file input */}
      {showInput && (
        <div className="px-2 py-2 border-b border-nova-border">
          <input
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="path/to/file.java"
            className="w-full px-2 py-1.5 rounded bg-nova-olive border border-nova-border text-[11px] font-mono text-nova-text-bright placeholder:text-nova-text-dim/50 focus:outline-none focus:border-nova-accent/50"
            autoFocus
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {fileCount === 0 ? (
          <p className="text-[11px] text-nova-text-dim px-3 py-4 text-center font-mono">No files yet</p>
        ) : (
          <TreeNode
            node={tree}
            depth={0}
            activeFile={activeFile}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}

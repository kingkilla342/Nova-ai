'use client';

import { PROJECT_TYPES } from '../lib/templates';

const typeIcons = {
  plugin: '⚙️',
  datapack: '📦',
  mod: '🔧',
};

export default function ProjectCard({ project, onOpen, onDelete }) {
  const typeLabel = PROJECT_TYPES[project.type]?.label || project.type;
  const created = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="glass rounded-xl p-4 hover:border-nova-border-light transition-all duration-200 group animate-fade-in cursor-pointer relative">
      <div onClick={onOpen} className="flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{typeIcons[project.type] || '📁'}</span>
            <div>
              <h3 className="font-semibold text-sm text-nova-text-bright group-hover:text-nova-accent transition-colors">
                {project.name}
              </h3>
              <span className="text-[11px] text-nova-text-dim font-mono">{typeLabel}</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[11px] text-nova-text-dim font-mono">
          <span>v{project.version || '1.0.0'}</span>
          <span>{created}</span>
        </div>

        {/* Package */}
        {project.packageName && (
          <div className="mt-2 px-2 py-1 rounded bg-nova-olive text-[10px] font-mono text-nova-text-dim inline-block">
            {project.packageName}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 rounded-md flex items-center justify-center text-nova-text-dim hover:text-nova-red hover:bg-nova-red/10 transition-all"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

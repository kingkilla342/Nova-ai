'use client';

import { PROJECT_TYPES } from '../lib/templates';

export default function ProjectCard({ project, onOpen, onDelete }) {
  const typeLabel = PROJECT_TYPES[project.type]?.label || project.type;
  const created = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="hud-panel hud-corners rounded-lg p-4 cursor-pointer group hover:border-[rgba(0,255,106,0.35)] transition-all duration-300 relative"
      onClick={onOpen}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 hexagon bg-[rgba(0,255,106,0.08)] flex items-center justify-center group-hover:bg-[rgba(0,255,106,0.15)] transition-all">
              <span className="font-display text-hud-green text-[10px] font-bold">
                {project.type === 'plugin' ? 'PLG' : project.type === 'mod' ? 'MOD' : 'DPK'}
              </span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-hud-text-bright group-hover:text-hud-green transition-colors tracking-wider">
                {project.name}
              </h3>
              <span className="font-mono text-[9px] text-hud-text-dim tracking-wider uppercase">{typeLabel}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-hud-text-dim hover:text-hud-red hover:bg-hud-red/10 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="hud-divider mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[9px] text-hud-text-dim tracking-wider">
            <span>v{project.version || '1.0.0'}</span>
            <span>{created}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="status-dot" style={{ width: 4, height: 4 }} />
            <span className="font-mono text-[8px] text-hud-green tracking-wider">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

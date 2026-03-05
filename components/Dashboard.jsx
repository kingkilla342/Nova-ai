'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, createProject, deleteProject } from '../lib/store';
import CreateProjectModal from './CreateProjectModal';
import ProjectCard from './ProjectCard';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [time, setTime] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
    setLoaded(true);
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = (project) => {
    createProject(project);
    setProjects(getProjects());
    setShowModal(false);
    router.push(`/builder/${project.id}`);
  };

  const handleDelete = (id) => {
    deleteProject(id);
    setProjects(getProjects());
    setDeleteConfirm(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden grid-bg">
      {/* ══════ TOP BAR ══════ */}
      <header className="flex-shrink-0 hud-panel-strong border-b border-[rgba(0,255,106,0.15)] h-16 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="relative">
            <div className="w-10 h-10 hexagon bg-[rgba(0,255,106,0.1)] flex items-center justify-center">
              <div className="w-8 h-9 hexagon bg-[rgba(0,255,106,0.15)] flex items-center justify-center glow">
                <span className="font-display font-black text-hud-green text-glow text-base">N</span>
              </div>
            </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-hud-green text-glow tracking-[0.25em] text-base leading-none">NOVA</h1>
            <p className="font-mono text-[12px] text-hud-text-dim tracking-[0.3em] uppercase">AI MOD CREATOR // v1.0</p>
          </div>
          <div className="hud-divider-v h-7 mx-2" />
          <span className="font-mono text-[13px] text-hud-text-dim tracking-wider">JAVA EDITION</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="font-mono text-[13px] text-hud-green tracking-wider">SYSTEMS ONLINE</span>
          </div>
          <div className="hud-divider-v h-7" />
          <span className="font-mono text-[14px] text-hud-text-dim tabular-nums tracking-wider">{time}</span>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Status strip */}
          <div className="flex items-center gap-3 mb-8 animate-fade">
            <div className="flex-1 hud-divider" />
            <span className="font-mono text-[12px] text-hud-text-dim tracking-[0.4em] uppercase">Command Center</span>
            <div className="flex-1 hud-divider" />
          </div>

          {/* Title + Create */}
          <div className={`flex items-end justify-between mb-8 ${loaded ? 'animate-slide-up' : 'opacity-0'}`}>
            <div>
              <h2 className="font-display font-bold text-3xl text-hud-green text-glow-subtle tracking-wider">
                PROJECTS
              </h2>
              <p className="font-mono text-base text-hud-text-dim mt-1 tracking-wide">
                {projects.length} PROJECT{projects.length !== 1 ? 'S' : ''} IN DATABASE
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="hud-btn px-5 py-3 rounded text-base tracking-wider flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              NEW PROJECT
            </button>
          </div>

          {/* Projects */}
          {projects.length === 0 ? (
            <div className={`hud-panel hud-corners hud-corners-bottom rounded-lg p-14 text-center ${loaded ? 'animate-materialize' : 'opacity-0'}`}>
              <div className="w-20 h-20 mx-auto mb-5 hexagon bg-[rgba(0,255,106,0.05)] flex items-center justify-center animate-float">
                <div className="w-14 h-16 hexagon bg-[rgba(0,255,106,0.08)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-hud-green opacity-50" strokeWidth="1">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-hud-green text-glow-subtle tracking-wider text-3xl mb-2">NO PROJECTS DETECTED</h3>
              <p className="font-mono text-base text-hud-text-dim mb-7 tracking-wide">Initialize your first Minecraft Java project to begin.</p>
              <button
                onClick={() => setShowModal(true)}
                className="hud-btn-primary px-6 py-3 rounded font-display text-base tracking-wider font-bold"
              >
                INITIALIZE PROJECT
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <div key={project.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-slide-up">
                  <ProjectCard
                    project={project}
                    onOpen={() => router.push(`/builder/${project.id}`)}
                    onDelete={() => setDeleteConfirm(project.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ══════ BOTTOM STATUS BAR ══════ */}
      <footer className="flex-shrink-0 hud-panel-strong border-t border-[rgba(0,255,106,0.15)] h-9 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] text-hud-text-dim tracking-wider">NOVA://DASHBOARD</span>
          <div className="hud-divider-v h-3" />
          <span className="font-mono text-[12px] text-hud-text-dim">MEM: 128MB</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] text-hud-text-dim">GEMINI-2.5-FLASH</span>
          <div className="hud-divider-v h-3" />
          <div className="flex items-center gap-1.5">
            <div className="status-dot" />
            <span className="font-mono text-[12px] text-hud-green">CONNECTED</span>
          </div>
        </div>
      </footer>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
          <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg p-6 w-full max-w-sm mx-4 animate-materialize">
            <h3 className="font-display text-hud-red text-3xl tracking-wider mb-2">⚠ CONFIRM DELETION</h3>
            <p className="font-mono text-base text-hud-text-dim mb-6">This operation is irreversible. All project data will be purged.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="hud-btn px-4 py-2 rounded text-base tracking-wider">
                ABORT
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded text-base tracking-wider font-semibold bg-hud-red/20 border border-hud-red/40 text-hud-red hover:bg-hud-red/30 transition"
              >
                PURGE PROJECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

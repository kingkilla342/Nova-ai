'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, createProject, deleteProject } from '../lib/store';
import { PROJECT_TYPES } from '../lib/templates';
import CreateProjectModal from './CreateProjectModal';
import ProjectCard from './ProjectCard';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    setProjects(getProjects());
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

  const handleOpen = (id) => {
    router.push(`/builder/${id}`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 glass-strong border-b border-nova-border px-6 py-4 flex items-center justify-between relative noise">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-nova-accent/10 border border-nova-accent/30 flex items-center justify-center glow-accent">
            <span className="text-nova-accent font-display font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-nova-text-bright tracking-wider">NOVA</h1>
            <p className="text-[10px] text-nova-text-dim font-mono tracking-widest uppercase">AI Mod Creator</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-xs text-nova-text-dim font-mono">Java Edition</span>
          <div className="status-dot" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto grid-bg relative noise">
        <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-2xl text-nova-text-bright tracking-wide">Projects</h2>
              <p className="text-sm text-nova-text-dim mt-1">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nova-accent/10 border border-nova-accent/40 text-nova-accent font-medium text-sm hover:bg-nova-accent/20 hover:border-nova-accent/60 transition-all duration-200 glow-accent"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Project
            </button>
          </div>

          {/* Project grid */}
          {projects.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-nova-surface border border-nova-border flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-nova-text-dim" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="font-display text-lg text-nova-text-bright mb-2">No Projects Yet</h3>
              <p className="text-sm text-nova-text-dim mb-6">Create your first Minecraft Java project to get started.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-lg bg-nova-accent text-nova-bg font-semibold text-sm hover:bg-nova-accent/90 transition-all"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => handleOpen(project.id)}
                  onDelete={() => setDeleteConfirm(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-display text-lg text-nova-text-bright mb-2">Delete Project?</h3>
            <p className="text-sm text-nova-text-dim mb-6">This action cannot be undone. All files and chat history will be lost.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-nova-text-dim hover:text-nova-text transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-nova-red/20 border border-nova-red/40 text-nova-red text-sm font-medium hover:bg-nova-red/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

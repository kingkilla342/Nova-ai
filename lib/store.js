// Simple project store using localStorage
// In production, this would be a database (Supabase, Planetscale, etc.)

const STORAGE_KEY = 'nova_projects';

export function getProjects() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id) {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function createProject(project) {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id, updates) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id) {
  const projects = getProjects();
  saveProjects(projects.filter((p) => p.id !== id));
}

// File operations within a project
export function getProjectFiles(projectId) {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(`nova_files_${projectId}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProjectFiles(projectId, files) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`nova_files_${projectId}`, JSON.stringify(files));
}

export function getChatHistory(projectId) {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`nova_chat_${projectId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(projectId, messages) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`nova_chat_${projectId}`, JSON.stringify(messages));
}

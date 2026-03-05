// ═══════════════════════════════════════════
// PROJECT STORE
// ═══════════════════════════════════════════

const STORAGE_KEY = 'nova_projects';

export function getProjects() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

export function saveProjects(projects) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id) {
  return getProjects().find(p => p.id === id) || null;
}

export function createProject(project) {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id, updates) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id) {
  saveProjects(getProjects().filter(p => p.id !== id));
  // Clean up related data
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`nova_files_${id}`);
    localStorage.removeItem(`nova_chat_${id}`);
    localStorage.removeItem(`nova_versions_${id}`);
  }
}

// ═══════════════════════════════════════════
// FILE OPERATIONS
// ═══════════════════════════════════════════

export function getProjectFiles(projectId) {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(`nova_files_${projectId}`)) || {}; } catch { return {}; }
}

export function saveProjectFiles(projectId, files) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`nova_files_${projectId}`, JSON.stringify(files));
}

// ═══════════════════════════════════════════
// CHAT HISTORY
// ═══════════════════════════════════════════

export function getChatHistory(projectId) {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`nova_chat_${projectId}`)) || []; } catch { return []; }
}

export function saveChatHistory(projectId, messages) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`nova_chat_${projectId}`, JSON.stringify(messages));
}

// ═══════════════════════════════════════════
// VERSION HISTORY / SNAPSHOTS
// ═══════════════════════════════════════════

export function getVersionHistory(projectId) {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`nova_versions_${projectId}`)) || []; } catch { return []; }
}

export function saveVersionHistory(projectId, versions) {
  if (typeof window === 'undefined') return;
  // Keep max 50 versions to avoid localStorage overflow
  const trimmed = versions.slice(-50);
  localStorage.setItem(`nova_versions_${projectId}`, JSON.stringify(trimmed));
}

export function createSnapshot(projectId, files, label = 'AI Edit') {
  const versions = getVersionHistory(projectId);
  const version = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    number: versions.length + 1,
    label,
    timestamp: new Date().toISOString(),
    files: JSON.parse(JSON.stringify(files)), // deep clone
    fileCount: Object.keys(files).length,
    lineCount: Object.values(files).reduce((sum, c) => sum + (c.match(/\n/g) || []).length + 1, 0),
  };
  versions.push(version);
  saveVersionHistory(projectId, versions);
  return version;
}

export function rollbackToVersion(projectId, versionId) {
  const versions = getVersionHistory(projectId);
  const target = versions.find(v => v.id === versionId);
  if (!target) return null;
  saveProjectFiles(projectId, target.files);
  return target;
}

// ═══════════════════════════════════════════
// SECURITY HELPERS
// ═══════════════════════════════════════════

const ALLOWED_EXTENSIONS = [
  '.java', '.yml', '.yaml', '.json', '.xml', '.toml', '.properties',
  '.gradle', '.mcfunction', '.mcmeta', '.txt', '.md', '.cfg', '.conf',
  '.lang', '.png', '.jpg', '.gif', '.ogg',
];

const MAX_FILE_SIZE = 512 * 1024; // 512KB per file
const MAX_FILES = 200;
const MAX_PATH_LENGTH = 256;

export function validateFilePath(path) {
  if (!path || typeof path !== 'string') return { valid: false, error: 'Invalid path' };
  if (path.length > MAX_PATH_LENGTH) return { valid: false, error: 'Path too long (max 256 chars)' };
  if (path.includes('..')) return { valid: false, error: 'Path traversal not allowed' };
  if (path.startsWith('/') || path.startsWith('\\')) return { valid: false, error: 'Absolute paths not allowed' };
  if (/[<>"|?*]/.test(path)) return { valid: false, error: 'Invalid characters in path' };

  const ext = '.' + path.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type "${ext}" not allowed` };
  }

  return { valid: true };
}

export function validateFileContent(content) {
  if (typeof content !== 'string') return { valid: false, error: 'Content must be text' };
  if (content.length > MAX_FILE_SIZE) return { valid: false, error: `File too large (max ${MAX_FILE_SIZE / 1024}KB)` };

  // Block dangerous patterns
  const dangerous = [
    /Runtime\.getRuntime\(\)\.exec/i,
    /ProcessBuilder/i,
    /System\.exit/i,
    /\beval\s*\(/i,
    /\/bin\/sh/i,
    /\/bin\/bash/i,
  ];
  for (const pattern of dangerous) {
    if (pattern.test(content)) {
      return { valid: false, error: 'Potentially dangerous code pattern detected' };
    }
  }

  return { valid: true };
}

export function validateFileCount(currentFiles) {
  if (Object.keys(currentFiles).length >= MAX_FILES) {
    return { valid: false, error: `Max ${MAX_FILES} files per project` };
  }
  return { valid: true };
}

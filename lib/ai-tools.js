import { validateFilePath, validateFileContent, validateFileCount } from './store';

// Process AI tool calls with security validation
export function processToolCall(toolName, toolInput, files) {
  const updatedFiles = { ...files };
  let result = { success: true, message: '' };

  switch (toolName) {
    case 'createFile': {
      const { path, content } = toolInput;

      // Security checks
      const pathCheck = validateFilePath(path);
      if (!pathCheck.valid) { result = { success: false, message: `BLOCKED: ${pathCheck.error}` }; break; }
      const countCheck = validateFileCount(updatedFiles);
      if (!countCheck.valid) { result = { success: false, message: `BLOCKED: ${countCheck.error}` }; break; }
      const contentCheck = validateFileContent(content || '');
      if (!contentCheck.valid) { result = { success: false, message: `BLOCKED: ${contentCheck.error}` }; break; }

      updatedFiles[path] = content || '';
      result.message = `Created: ${path}`;
      result.action = 'create';
      result.path = path;
      break;
    }
    case 'editFile': {
      const { path, oldContent, newContent } = toolInput;
      if (!updatedFiles[path]) { result = { success: false, message: `File not found: ${path}` }; break; }

      const contentCheck = validateFileContent(newContent || '');
      if (!contentCheck.valid) { result = { success: false, message: `BLOCKED: ${contentCheck.error}` }; break; }

      if (oldContent && updatedFiles[path].includes(oldContent)) {
        updatedFiles[path] = updatedFiles[path].replace(oldContent, newContent || '');
      } else {
        // If oldContent not found, replace entire file
        updatedFiles[path] = newContent || '';
      }
      result.message = `Edited: ${path}`;
      result.action = 'edit';
      result.path = path;
      break;
    }
    case 'deleteFile': {
      const { path } = toolInput;
      if (!updatedFiles[path]) { result = { success: false, message: `File not found: ${path}` }; break; }
      delete updatedFiles[path];
      result.message = `Deleted: ${path}`;
      result.action = 'delete';
      result.path = path;
      break;
    }
    case 'readFile': {
      const { path } = toolInput;
      if (!updatedFiles[path]) { result = { success: false, message: `File not found: ${path}` }; break; }
      result.message = updatedFiles[path];
      result.action = 'read';
      result.path = path;
      break;
    }
    case 'listFiles': {
      const { path: dirPath } = toolInput;
      const prefix = dirPath ? (dirPath.endsWith('/') ? dirPath : dirPath + '/') : '';
      const matching = Object.keys(updatedFiles).filter(f => prefix ? f.startsWith(prefix) : true);
      result.message = matching.join('\n') || 'No files found.';
      result.action = 'list';
      break;
    }
    default:
      result = { success: false, message: `Unknown tool: ${toolName}` };
  }

  return { files: updatedFiles, result };
}

// Extract tool calls from response
export function extractArtifacts(contentBlocks) {
  const artifacts = [];
  for (const block of contentBlocks) {
    if (block.type === 'tool_use') {
      artifacts.push({ tool: block.name, input: block.input, id: block.id });
    }
  }
  return artifacts;
}

// Simulate basic Java compilation check
export function validateJavaFiles(files) {
  const errors = [];

  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith('.java')) continue;

    const lines = content.split('\n');
    const fileName = path.split('/').pop().replace('.java', '');

    // Check class name matches filename
    const classMatch = content.match(/public\s+class\s+(\w+)/);
    if (classMatch && classMatch[1] !== fileName) {
      errors.push({
        file: path,
        line: lines.findIndex(l => l.includes(`public class ${classMatch[1]}`)) + 1,
        message: `Class name "${classMatch[1]}" doesn't match filename "${fileName}"`,
        severity: 'error',
      });
    }

    // Check package declaration exists
    if (!content.includes('package ')) {
      errors.push({
        file: path,
        line: 1,
        message: 'Missing package declaration',
        severity: 'warning',
      });
    }

    // Check common missing imports
    const importChecks = [
      { usage: 'JavaPlugin', imp: 'org.bukkit.plugin.java.JavaPlugin' },
      { usage: 'CommandExecutor', imp: 'org.bukkit.command.CommandExecutor' },
      { usage: 'CommandSender', imp: 'org.bukkit.command.CommandSender' },
      { usage: 'Player', imp: 'org.bukkit.entity.Player' },
      { usage: 'Listener', imp: 'org.bukkit.event.Listener' },
      { usage: 'EventHandler', imp: 'org.bukkit.event.EventHandler' },
      { usage: 'BukkitRunnable', imp: 'org.bukkit.scheduler.BukkitRunnable' },
      { usage: 'FileConfiguration', imp: 'org.bukkit.configuration.file.FileConfiguration' },
      { usage: 'ChatColor', imp: 'org.bukkit.ChatColor' },
      { usage: 'Material', imp: 'org.bukkit.Material' },
      { usage: 'ItemStack', imp: 'org.bukkit.inventory.ItemStack' },
    ];

    for (const { usage, imp } of importChecks) {
      // Check if class is used (not in import/comment) but not imported
      const usageRegex = new RegExp(`\\b${usage}\\b`);
      const importRegex = new RegExp(`import\\s+${imp.replace(/\./g, '\\.')}`);
      const isUsed = lines.some((l, i) => {
        const trimmed = l.trim();
        return usageRegex.test(trimmed) && !trimmed.startsWith('import ') && !trimmed.startsWith('//') && !trimmed.startsWith('*');
      });
      if (isUsed && !importRegex.test(content)) {
        const lineNum = lines.findIndex(l => usageRegex.test(l) && !l.trim().startsWith('import')) + 1;
        errors.push({
          file: path,
          line: lineNum,
          message: `Missing import: ${imp}`,
          severity: 'error',
        });
      }
    }

    // Check for unclosed braces
    let braceCount = 0;
    for (const char of content) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    if (braceCount !== 0) {
      errors.push({
        file: path,
        line: lines.length,
        message: `Unmatched braces (${braceCount > 0 ? 'missing closing' : 'extra closing'} brace)`,
        severity: 'error',
      });
    }
  }

  // Check plugin.yml
  const pluginYml = files['src/main/resources/plugin.yml'];
  if (pluginYml) {
    if (!pluginYml.includes('name:')) errors.push({ file: 'src/main/resources/plugin.yml', line: 1, message: 'Missing "name" field', severity: 'error' });
    if (!pluginYml.includes('main:')) errors.push({ file: 'src/main/resources/plugin.yml', line: 1, message: 'Missing "main" field', severity: 'error' });
    if (!pluginYml.includes('version:')) errors.push({ file: 'src/main/resources/plugin.yml', line: 1, message: 'Missing "version" field', severity: 'warning' });
  }

  return errors;
}

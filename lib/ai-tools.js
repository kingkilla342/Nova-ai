// Process AI tool calls and apply them to project files

export function processToolCall(toolName, toolInput, files) {
  const updatedFiles = { ...files };
  let result = { success: true, message: '' };

  switch (toolName) {
    case 'createFile': {
      const { path, content } = toolInput;
      updatedFiles[path] = content;
      result.message = `Created: ${path}`;
      result.action = 'create';
      result.path = path;
      break;
    }
    case 'editFile': {
      const { path, oldContent, newContent } = toolInput;
      if (!updatedFiles[path]) {
        result = { success: false, message: `File not found: ${path}` };
        break;
      }
      if (!updatedFiles[path].includes(oldContent)) {
        result = { success: false, message: `Content not found in ${path}` };
        break;
      }
      updatedFiles[path] = updatedFiles[path].replace(oldContent, newContent);
      result.message = `Edited: ${path}`;
      result.action = 'edit';
      result.path = path;
      break;
    }
    case 'deleteFile': {
      const { path } = toolInput;
      if (!updatedFiles[path]) {
        result = { success: false, message: `File not found: ${path}` };
        break;
      }
      delete updatedFiles[path];
      result.message = `Deleted: ${path}`;
      result.action = 'delete';
      result.path = path;
      break;
    }
    case 'readFile': {
      const { path } = toolInput;
      if (!updatedFiles[path]) {
        result = { success: false, message: `File not found: ${path}` };
        break;
      }
      result.message = updatedFiles[path];
      result.action = 'read';
      result.path = path;
      break;
    }
    case 'listFiles': {
      const { path: dirPath } = toolInput;
      const prefix = dirPath ? (dirPath.endsWith('/') ? dirPath : dirPath + '/') : '';
      const matchingFiles = Object.keys(updatedFiles).filter((f) =>
        prefix ? f.startsWith(prefix) : true
      );
      result.message = matchingFiles.join('\n') || 'No files found.';
      result.action = 'list';
      break;
    }
    default:
      result = { success: false, message: `Unknown tool: ${toolName}` };
  }

  return { files: updatedFiles, result };
}

// Build artifact summary from tool calls in a response
export function extractArtifacts(contentBlocks) {
  const artifacts = [];
  for (const block of contentBlocks) {
    if (block.type === 'tool_use') {
      artifacts.push({
        tool: block.name,
        input: block.input,
        id: block.id,
      });
    }
  }
  return artifacts;
}

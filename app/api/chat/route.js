import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Nova, an expert AI assistant specialized in Minecraft Java Edition mod/plugin development.
You help users create Minecraft plugins (Spigot/Paper), mods (Forge/Fabric), and datapacks.

You MUST use tools to make any file changes. Never output raw code — always use the appropriate tool.

When a user asks you to build something:
1. Analyze their intent
2. Ask clarifying questions about Minecraft-specific details (events, triggers, permissions, etc.)
3. Generate a plan
4. Execute using tools
5. Explain what you did

Be concise and professional. Use Minecraft terminology accurately.`;

const TOOLS = [
  {
    name: 'createFile',
    description: 'Create a new file in the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'editFile',
    description: 'Edit an existing file with a diff',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to edit' },
        oldContent: { type: 'string', description: 'Content to find and replace' },
        newContent: { type: 'string', description: 'New content to insert' },
      },
      required: ['path', 'oldContent', 'newContent'],
    },
  },
  {
    name: 'deleteFile',
    description: 'Delete a file from the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'readFile',
    description: 'Read a file from the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'listFiles',
    description: 'List all files in the project or a subdirectory',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (optional, defaults to root)' },
      },
    },
  },
];

export async function POST(request) {
  try {
    const { messages, projectFiles } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Build context about current project state
    const fileList = Object.keys(projectFiles || {}).join('\n');
    const contextMessage = fileList
      ? `\n\nCurrent project files:\n${fileList}`
      : '\n\nThe project is empty. No files yet.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT + contextMessage,
        tools: TOOLS,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json(
        { error: 'AI request failed. Check your API key and try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

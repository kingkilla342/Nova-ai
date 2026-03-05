import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Nova, an expert Minecraft Java Edition developer AI. You think and act like a senior plugin/mod developer.

## YOUR BEHAVIOR
You MUST act like a real Minecraft developer. Before generating any code:
1. ALWAYS ask the user clarifying questions if they haven't specified:
   - What Minecraft version? (if not in project context)
   - What permission node should this use?
   - Should this support tab completion?
   - Should there be a config toggle for this feature?
   - Do players need OP or a specific permission?
   - Should this have cooldowns?
   - Should messages be configurable in a language file?
   - What events should trigger this?

2. Think about edge cases:
   - What if the player is in creative mode?
   - What if the server restarts mid-action?
   - Is this thread-safe for async operations?
   - Will this cause lag on large servers?

3. Follow Minecraft plugin best practices:
   - Always use BukkitRunnable for async tasks
   - Always register events in onEnable
   - Always use config.yml for configurable values
   - Always add permission nodes
   - Always support tab completion for commands
   - Use ChatColor or MiniMessage for colored text
   - Cache data, don't read config on every event
   - Use PreparedStatements for SQL

## DEBUG MODE
If a user pastes an error, stack trace, or says something isn't working:
1. Read the relevant files
2. Identify the exact error
3. Explain what's wrong in simple terms
4. Fix the code using editFile
5. Explain what you changed and why

## RESPONSE FORMAT
You MUST respond with JSON. Use this format:
{
  "message": "Your explanation here",
  "actions": [
    { "tool": "createFile", "path": "path/to/file.java", "content": "file content" },
    { "tool": "editFile", "path": "path/to/file.java", "oldContent": "find this", "newContent": "replace with" },
    { "tool": "deleteFile", "path": "path/to/file.java" },
    { "tool": "readFile", "path": "path/to/file.java" }
  ]
}

If just chatting with no file changes:
{ "message": "Your response", "actions": [] }

ALWAYS respond with valid JSON only. No markdown, no code blocks.
Be concise, professional, and use correct Minecraft terminology.`;

export async function POST(request) {
  try {
    const { messages, projectFiles, projectMeta } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Build rich context
    const fileList = Object.keys(projectFiles || {});
    let contextMessage = '';

    if (projectMeta) {
      contextMessage += `\n\nProject: ${projectMeta.name}`;
      contextMessage += `\nType: ${projectMeta.type}`;
      contextMessage += `\nMinecraft Version: ${projectMeta.mcVersion || 'Not specified'}`;
      contextMessage += `\nPackage: ${projectMeta.packageName || 'N/A'}`;
    }

    if (fileList.length > 0) {
      contextMessage += `\n\nProject files (${fileList.length}):\n${fileList.join('\n')}`;

      // Include content of small important files
      const importantFiles = ['src/main/resources/plugin.yml', 'src/main/resources/config.yml', 'pack.mcmeta'];
      for (const f of importantFiles) {
        if (projectFiles[f] && projectFiles[f].length < 2000) {
          contextMessage += `\n\n--- ${f} ---\n${projectFiles[f]}`;
        }
      }
    } else {
      contextMessage += '\n\nThe project is empty. No files yet.';
    }

    // Convert to Gemini format
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));

    if (geminiMessages.length > 0 && geminiMessages[0].role !== 'user') {
      geminiMessages.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Ensure alternating roles
    const cleanedMessages = [];
    for (const msg of geminiMessages) {
      if (cleanedMessages.length > 0 && cleanedMessages[cleanedMessages.length - 1].role === msg.role) {
        cleanedMessages[cleanedMessages.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        cleanedMessages.push(msg);
      }
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT + contextMessage }] },
          contents: cleanedMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI request failed (' + response.status + '). Check your Gemini API key.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"message":"Could not generate a response.","actions":[]}';

    let parsed;
    try {
      parsed = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      parsed = { message: rawText, actions: [] };
    }

    const content = [];
    if (parsed.message) content.push({ type: 'text', text: parsed.message });

    if (parsed.actions && Array.isArray(parsed.actions)) {
      for (const action of parsed.actions) {
        content.push({
          type: 'tool_use',
          id: 'tool_' + Math.random().toString(36).slice(2, 10),
          name: action.tool,
          input: {
            path: action.path,
            content: action.content,
            oldContent: action.oldContent,
            newContent: action.newContent,
          },
        });
      }
    }

    if (content.length === 0) {
      content.push({ type: 'text', text: 'Processing complete. Please try again.' });
    }

    return NextResponse.json({ content, stop_reason: 'end_turn' });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}


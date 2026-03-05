import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Nova, an expert AI assistant specialized in Minecraft Java Edition mod/plugin development.
You help users create Minecraft plugins (Spigot/Paper), mods (Forge/Fabric), and datapacks.

You MUST respond with JSON when making file changes. Use this format:
{
  "message": "Your explanation here",
  "actions": [
    { "tool": "createFile", "path": "path/to/file.java", "content": "file content here" },
    { "tool": "editFile", "path": "path/to/file.java", "oldContent": "find this", "newContent": "replace with this" },
    { "tool": "deleteFile", "path": "path/to/file.java" }
  ]
}

If you have NO file actions (just chatting), respond with:
{ "message": "Your response here", "actions": [] }

ALWAYS respond with valid JSON only. No markdown, no code blocks, just raw JSON.

When a user asks you to build something:
1. Analyze their intent
2. Ask clarifying questions about Minecraft-specific details (events, triggers, permissions, etc.)
3. Generate a plan
4. Execute using actions
5. Explain what you did

Be concise and professional. Use Minecraft terminology accurately.`;

export async function POST(request) {
  try {
    const { messages, projectFiles } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Build context about current project state
    const fileList = Object.keys(projectFiles || {}).join('\n');
    const contextMessage = fileList
      ? `\n\nCurrent project files:\n${fileList}`
      : '\n\nThe project is empty. No files yet.';

    // Convert messages to Gemini format
    const geminiMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT + contextMessage }],
          },
          contents: geminiMessages,
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
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'AI request failed. Check your Gemini API key and try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"message":"Sorry, I could not generate a response.","actions":[]}';

    // Parse the JSON response
    let parsed;
    try {
      // Clean up potential markdown code blocks
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, treat as plain text
      parsed = { message: rawText, actions: [] };
    }

    // Convert to the format the frontend expects
    const content = [];

    // Add text block
    if (parsed.message) {
      content.push({ type: 'text', text: parsed.message });
    }

    // Add tool use blocks for each action
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

    return NextResponse.json({
      content,
      stop_reason: 'end_turn',
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

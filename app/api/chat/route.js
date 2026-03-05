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

    // Ensure conversation starts with a user message
    if (geminiMessages.length > 0 && geminiMessages[0].role !== 'user') {
      geminiMessages.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Ensure alternating roles (Gemini requires this)
    const cleanedMessages = [];
    for (let i = 0; i < geminiMessages.length; i++) {
      const msg = geminiMessages[i];
      if (i > 0 && cleanedMessages[cleanedMessages.length - 1].role === msg.role) {
        cleanedMessages[cleanedMessages.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        cleanedMessages.push(msg);
      }
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT + contextMessage }],
        },
        contents: cleanedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI request failed (' + response.status + '). Check your Gemini API key.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '{"message":"Sorry, I could not generate a response.","actions":[]}';

    // Parse the JSON response
    let parsed;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { message: rawText, actions: [] };
    }

    // Convert to the format the frontend expects
    const content = [];

    if (parsed.message) {
      content.push({ type: 'text', text: parsed.message });
    }

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
      content.push({ type: 'text', text: 'I received your message but could not generate a response. Please try again.' });
    }

    return NextResponse.json({
      content,
      stop_reason: 'end_turn',
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Internal server error: ' + err.message },
      { status: 500 }
    );
  }
}

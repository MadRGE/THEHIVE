import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Claude, an AI assistant integrated into TheHive Mission Control dashboard.
You help users manage tasks, plan missions, and provide strategic guidance.

Your capabilities:
- Help break down complex projects into manageable tasks
- Suggest priorities and task ordering
- Provide technical guidance and problem-solving
- Analyze task progress and suggest next steps
- Draft task descriptions and mission plans

Be concise, actionable, and organized in your responses. Use markdown formatting when helpful.
When suggesting tasks, format them clearly so users can easily add them to the board.`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new Anthropic({ apiKey });
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(
  messages: ClaudeMessage[],
  context?: string
): Promise<string> {
  const client = getClient();
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

  const systemPrompt = context
    ? `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}`
    : SYSTEM_PROMPT;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "No response generated.";
}

export async function* streamMessage(
  messages: ClaudeMessage[],
  context?: string
): AsyncGenerator<string> {
  const client = getClient();
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

  const systemPrompt = context
    ? `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}`
    : SYSTEM_PROMPT;

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

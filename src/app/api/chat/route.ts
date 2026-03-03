import { NextRequest } from "next/server";
import { streamMessage, type ClaudeMessage } from "@/lib/claude";
import { getChatMessages, saveChatMessage, getAllTasks, getAllMissions } from "@/lib/db";
import { logActivity } from "@/lib/db";

export async function GET() {
  const messages = getChatMessages();
  return Response.json(messages);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, task_id = null } = body;

  if (!message) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  // Save user message
  saveChatMessage({ role: "user", content: message, task_id });

  // Build context from current tasks and missions
  const tasks = getAllTasks();
  const missions = getAllMissions();
  const context = buildContext(tasks, missions);

  // Build conversation history
  const history = getChatMessages();
  const claudeMessages: ClaudeMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        for await (const chunk of streamMessage(claudeMessages, context)) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }

        // Save assistant message
        saveChatMessage({ role: "assistant", content: fullResponse, task_id });

        logActivity({
          type: "chat_message",
          message: `Claude responded to: "${message.substring(0, 60)}${message.length > 60 ? "..." : ""}"`,
          task_id,
          mission_id: null,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildContext(
  tasks: { title: string; status: string; priority: string; description: string }[],
  missions: { name: string; status: string; description: string }[]
): string {
  const tasksSummary = tasks.length
    ? tasks
        .map((t) => `- [${t.status}] (${t.priority}) ${t.title}${t.description ? `: ${t.description}` : ""}`)
        .join("\n")
    : "No tasks yet.";

  const missionsSummary = missions.length
    ? missions
        .map((m) => `- [${m.status}] ${m.name}${m.description ? `: ${m.description}` : ""}`)
        .join("\n")
    : "No missions yet.";

  return `Current Tasks:\n${tasksSummary}\n\nCurrent Missions:\n${missionsSummary}`;
}

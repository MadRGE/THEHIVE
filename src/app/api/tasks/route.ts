import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask, updateTask, deleteTask } from "@/lib/db";
import { logActivity } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const tasks = getAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description = "", status = "inbox", priority = "medium", mission_id = null } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = createTask({
    id: generateId(),
    title,
    description,
    status,
    priority,
    mission_id,
    assigned_agent: "claude",
  });

  logActivity({
    type: "task_created",
    message: `Task created: "${task.title}"`,
    task_id: task.id,
    mission_id: task.mission_id,
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const task = updateTask(id, updates);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (updates.status) {
    logActivity({
      type: "task_status_changed",
      message: `Task "${task.title}" moved to ${updates.status}`,
      task_id: task.id,
      mission_id: task.mission_id,
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const deleted = deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  logActivity({
    type: "task_deleted",
    message: `Task deleted`,
    task_id: id,
    mission_id: null,
  });

  return NextResponse.json({ success: true });
}

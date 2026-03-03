import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "mission-control.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'inbox',
      priority TEXT NOT NULL DEFAULT 'medium',
      mission_id TEXT,
      assigned_agent TEXT DEFAULT 'claude',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      task_id TEXT,
      mission_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      task_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
  `);
}

// --- Tasks ---

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  mission_id: string | null;
  assigned_agent: string;
  created_at: string;
  updated_at: string;
}

export function getAllTasks(): Task[] {
  return getDb().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Task[];
}

export function getTasksByStatus(status: string): Task[] {
  return getDb().prepare("SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC").all(status) as Task[];
}

export function getTaskById(id: string): Task | undefined {
  return getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
}

export function createTask(task: Omit<Task, "created_at" | "updated_at">): Task {
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO tasks (id, title, description, status, priority, mission_id, assigned_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task.id, task.title, task.description, task.status, task.priority, task.mission_id, task.assigned_agent, now, now);
  return getTaskById(task.id)!;
}

export function updateTask(id: string, updates: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "mission_id" | "assigned_agent">>): Task | undefined {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | null);
    }
  }
  if (fields.length === 0) return getTaskById(id);
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  getDb().prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const result = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

// --- Missions ---

export interface Mission {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function getAllMissions(): Mission[] {
  return getDb().prepare("SELECT * FROM missions ORDER BY created_at DESC").all() as Mission[];
}

export function getMissionById(id: string): Mission | undefined {
  return getDb().prepare("SELECT * FROM missions WHERE id = ?").get(id) as Mission | undefined;
}

export function createMission(mission: Omit<Mission, "created_at" | "updated_at">): Mission {
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO missions (id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(mission.id, mission.name, mission.description, mission.status, now, now);
  return getMissionById(mission.id)!;
}

export function updateMission(id: string, updates: Partial<Pick<Mission, "name" | "description" | "status">>): Mission | undefined {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value as string | null);
    }
  }
  if (fields.length === 0) return getMissionById(id);
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  getDb().prepare(`UPDATE missions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getMissionById(id);
}

export function deleteMission(id: string): boolean {
  const result = getDb().prepare("DELETE FROM missions WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getMissionTaskCounts(missionId: string): { total: number; completed: number } {
  const total = (getDb().prepare("SELECT COUNT(*) as count FROM tasks WHERE mission_id = ?").get(missionId) as { count: number }).count;
  const completed = (getDb().prepare("SELECT COUNT(*) as count FROM tasks WHERE mission_id = ? AND status = 'done'").get(missionId) as { count: number }).count;
  return { total, completed };
}

// --- Activity Log ---

export interface ActivityEntry {
  id: number;
  type: string;
  message: string;
  task_id: string | null;
  mission_id: string | null;
  created_at: string;
}

export function getActivityLog(limit = 50): ActivityEntry[] {
  return getDb().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(limit) as ActivityEntry[];
}

export function logActivity(entry: Omit<ActivityEntry, "id" | "created_at">): void {
  getDb().prepare(`
    INSERT INTO activity_log (type, message, task_id, mission_id)
    VALUES (?, ?, ?, ?)
  `).run(entry.type, entry.message, entry.task_id, entry.mission_id);
}

// --- Chat ---

export interface ChatMessage {
  id: number;
  role: string;
  content: string;
  task_id: string | null;
  created_at: string;
}

export function getChatMessages(limit = 100): ChatMessage[] {
  return getDb().prepare("SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT ?").all(limit) as ChatMessage[];
}

export function saveChatMessage(msg: Omit<ChatMessage, "id" | "created_at">): ChatMessage {
  const result = getDb().prepare(`
    INSERT INTO chat_messages (role, content, task_id)
    VALUES (?, ?, ?)
  `).run(msg.role, msg.content, msg.task_id);
  return getDb().prepare("SELECT * FROM chat_messages WHERE id = ?").get(result.lastInsertRowid) as ChatMessage;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  activeMissions: number;
  tasksByStatus: Record<string, number>;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const totalTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }).count;
  const activeTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('done', 'inbox')").get() as { count: number }).count;
  const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get() as { count: number }).count;
  const activeMissions = (db.prepare("SELECT COUNT(*) as count FROM missions WHERE status = 'active'").get() as { count: number }).count;

  const statusRows = db.prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status").all() as { status: string; count: number }[];
  const tasksByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    tasksByStatus[row.status] = row.count;
  }

  return { totalTasks, activeTasks, completedTasks, activeMissions, tasksByStatus };
}

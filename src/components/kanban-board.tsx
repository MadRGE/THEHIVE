"use client";

import { useState } from "react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useMissions } from "@/hooks/use-missions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils";
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Bot,
} from "lucide-react";

const COLUMNS = [
  { id: "inbox", label: "Inbox", color: "bg-slate-500" },
  { id: "assigned", label: "Assigned", color: "bg-blue-500" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-500" },
  { id: "review", label: "Review", color: "bg-purple-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];

const PRIORITIES = [
  { value: "low", label: "Low", variant: "secondary" as const },
  { value: "medium", label: "Medium", variant: "info" as const },
  { value: "high", label: "High", variant: "warning" as const },
  { value: "urgent", label: "Urgent", variant: "destructive" as const },
];

export function KanbanBoard() {
  const { tasks, createTask, updateTask, deleteTask, tasksByStatus } = useTasks();
  const { missions } = useMissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newMission, setNewMission] = useState<string>("none");
  const [newStatus, setNewStatus] = useState("inbox");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      status: newStatus,
      mission_id: newMission === "none" ? null : newMission,
    });
    setNewTitle("");
    setNewDesc("");
    setNewPriority("medium");
    setNewMission("none");
    setNewStatus("inbox");
    setCreateOpen(false);
  };

  const moveTask = async (task: Task, direction: "left" | "right") => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === task.status);
    const newIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;
    await updateTask(task.id, { status: COLUMNS[newIndex].id });
  };

  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    if (!p) return null;
    return <Badge variant={p.variant} className="text-[10px] px-1.5 py-0">{p.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task Board</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>Add a new task to the board.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newMission} onValueChange={setNewMission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Mission</SelectItem>
                    {missions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newTitle.trim()}>
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-5 gap-3 min-h-[calc(100vh-14rem)]">
        {COLUMNS.map((column, colIndex) => {
          const columnTasks = tasksByStatus(column.id);
          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                <span className="text-sm font-medium">{column.label}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {columnTasks.length}
                </Badge>
              </div>

              {/* Column Body */}
              <div className="flex-1 space-y-2 p-1 rounded-lg bg-muted/30 min-h-[200px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colIndex={colIndex}
                    totalColumns={COLUMNS.length}
                    onMove={(dir) => moveTask(task, dir)}
                    onDelete={() => deleteTask(task.id)}
                    missions={missions}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  colIndex,
  totalColumns,
  onMove,
  onDelete,
  missions,
}: {
  task: Task;
  colIndex: number;
  totalColumns: number;
  onMove: (dir: "left" | "right") => void;
  onDelete: () => void;
  missions: { id: string; name: string }[];
}) {
  const priorityBadge = PRIORITIES.find((p) => p.value === task.priority);
  const mission = missions.find((m) => m.id === task.mission_id);

  return (
    <Card className="group cursor-default hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm font-medium flex-1 leading-tight">{task.title}</p>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {priorityBadge && (
            <Badge variant={priorityBadge.variant} className="text-[10px] px-1.5 py-0">
              {priorityBadge.label}
            </Badge>
          )}
          {mission && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {mission.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Bot className="h-3 w-3" />
            <span>{task.assigned_agent}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(task.created_at)}
          </span>
        </div>

        {/* Move / Delete actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={colIndex === 0}
            onClick={() => onMove("left")}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={colIndex === totalColumns - 1}
            onClick={() => onMove("right")}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

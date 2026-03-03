"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActivity, type ActivityEntry } from "@/hooks/use-activity";
import { formatRelativeTime } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  CheckCircle2,
  Target,
  Clock,
  MessageSquare,
  ListTodo,
  AlertTriangle,
} from "lucide-react";

interface Stats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  activeMissions: number;
  tasksByStatus: Record<string, number>;
}

const activityIcons: Record<string, React.ReactNode> = {
  task_created: <ListTodo className="h-3.5 w-3.5 text-blue-500" />,
  task_status_changed: <Zap className="h-3.5 w-3.5 text-amber-500" />,
  task_deleted: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  mission_created: <Target className="h-3.5 w-3.5 text-purple-500" />,
  mission_deleted: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  chat_message: <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />,
};

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { activity } = useActivity(3000);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    const interval = setInterval(() => {
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: "Total Tasks", value: stats?.totalTasks ?? 0, icon: LayoutDashboard, color: "text-blue-500" },
    { label: "Active", value: stats?.activeTasks ?? 0, icon: Zap, color: "text-amber-500" },
    { label: "Completed", value: stats?.completedTasks ?? 0, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Missions", value: stats?.activeMissions ?? 0, icon: Target, color: "text-purple-500" },
  ];

  const statusLabels: Record<string, string> = {
    inbox: "Inbox",
    assigned: "Assigned",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.tasksByStatus && Object.keys(stats.tasksByStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(statusLabels).map(([key, label]) => {
                  const count = stats.tasksByStatus[key] || 0;
                  const total = stats.totalTasks || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks yet. Create your first task from the Board tab.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {activity.slice(0, 15).map((entry: ActivityEntry) => (
                  <div key={entry.id} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5">
                      {activityIcons[entry.type] || <Zap className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{entry.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet. Start by creating tasks or chatting with Claude.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Hexagon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Claude</span>
                <Badge variant="success">Online</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                AI Assistant - Ready to receive tasks and provide guidance
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Model: Claude Sonnet</p>
              <p>Tasks assigned: {stats?.activeTasks ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Hexagon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

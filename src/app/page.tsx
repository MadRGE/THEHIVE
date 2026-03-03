"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { DashboardView } from "@/components/dashboard-view";
import { KanbanBoard } from "@/components/kanban-board";
import { MissionsView } from "@/components/missions-view";
import { ChatPanel } from "@/components/chat-panel";
import { AgentsView } from "@/components/agents-view";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "board" && <KanbanBoard />}
        {activeTab === "missions" && <MissionsView />}
        {activeTab === "agents" && <AgentsView />}
        {activeTab === "chat" && <ChatPanel />}
      </main>
    </div>
  );
}

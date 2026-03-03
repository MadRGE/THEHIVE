"use client";

import { useState, useEffect, useCallback } from "react";

export interface Mission {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  total?: number;
  completed?: number;
}

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch("/api/missions");
      const data = await res.json();
      setMissions(data);
    } catch (err) {
      console.error("Failed to fetch missions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const createMission = async (mission: { name: string; description?: string }) => {
    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mission),
    });
    const newMission = await res.json();
    setMissions((prev) => [newMission, ...prev]);
    return newMission;
  };

  const updateMission = async (id: string, updates: Partial<Mission>) => {
    const res = await fetch("/api/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    const updated = await res.json();
    setMissions((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteMission = async (id: string) => {
    await fetch(`/api/missions?id=${id}`, { method: "DELETE" });
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  return { missions, loading, fetchMissions, createMission, updateMission, deleteMission };
}

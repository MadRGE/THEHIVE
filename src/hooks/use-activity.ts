"use client";

import { useState, useEffect, useCallback } from "react";

export interface ActivityEntry {
  id: number;
  type: string;
  message: string;
  task_id: string | null;
  mission_id: string | null;
  created_at: string;
}

export function useActivity(pollInterval = 5000) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/activity?limit=50");
      const data = await res.json();
      setActivity(data);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, pollInterval);
    return () => clearInterval(interval);
  }, [fetchActivity, pollInterval]);

  return { activity, loading, fetchActivity };
}

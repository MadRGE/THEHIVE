"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatMessage {
  id: number;
  role: string;
  content: string;
  task_id: string | null;
  created_at: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (content: string, taskId?: string | null) => {
    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content,
      task_id: taskId || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Add placeholder for assistant response
    const assistantMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      task_id: taskId || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, task_id: taskId }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const json = JSON.parse(line.slice(6));
          if (json.text) {
            fullText += json.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: fullText } : m
              )
            );
          }
          if (json.error) {
            fullText = `Error: ${json.error}`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: fullText } : m
              )
            );
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Failed to get response. Check your API key configuration." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return { messages, loading, streaming, sendMessage, fetchMessages };
}

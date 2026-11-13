"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function NovaChat() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Nova, your Learnova study companion. Ask me any JSS, SSS, WAEC, NECO, or JAMB question and I'll walk through it step-by-step.",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Guided Study Companion
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-0.5 flex items-center gap-2">
            <Sparkles size={22} className="text-[#D97706]" />
            Nova AI Tutor
          </h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col h-[calc(100vh-220px)] min-h-[460px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs px-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
              <span className="ml-1 font-medium">Nova is preparing explanation...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4 space-y-3 bg-white rounded-b-2xl">
          <SuggestedPrompts onSelect={sendMessage} />
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";

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
        "👋 Hello! I'm Nova. Ask me any question and I'll help you learn.",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ||
            "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto h-[85vh] flex flex-col">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Nova AI
        </h1>

        <p className="text-slate-400 mt-2">
          Your personal AI tutor.
        </p>
      </div>

      {/* Chat Area */}

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-5 pb-8">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" />
              <div
                className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />

              <span className="ml-2 text-sm">
                Nova is thinking...
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions */}

      <div className="mt-4">
        <SuggestedPrompts
          onSelect={sendMessage}
        />
      </div>

      {/* Sticky Input */}

      <div className="sticky bottom-0 bg-[#020817] pt-4">
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}
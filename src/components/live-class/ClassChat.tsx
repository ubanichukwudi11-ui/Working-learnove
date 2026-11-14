"use client";

import { useState } from "react";
import { Send, Hand, Pin } from "lucide-react";

type Message = {
  id: number;
  user: string;
  role: "student" | "teacher";
  text: string;
  important?: boolean;
};

export default function ClassChat() {
  const [input, setInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "Mr James",
      role: "teacher",
      text: "Welcome everyone. Today we are learning Newton's Laws.",
      important: true,
    },
  ]);

  function sendMessage() {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        role: "student",
        text: input,
      },
    ]);
    setInput("");
  }

  function raiseHand() {
    setHandRaised(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        role: "student",
        text: "Raised hand to speak on stage.",
      },
    ]);
  }

  return (
    <div className="bg-[#0D1438] border border-white/12 rounded-2xl h-[600px] flex flex-col overflow-hidden text-white">
      <div className="p-4 border-b border-white/10 bg-[#121A4A] flex items-center justify-between gap-2">
        <h2 className="landing-display font-bold text-sm">Class Chat</h2>
        <button
          onClick={raiseHand}
          className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/35 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap"
        >
          <Hand size={14} />
          {handRaised ? "Hand Raised" : "Raise Hand"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 max-w-[82%] text-xs ${
                msg.role === "teacher"
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                  : "bg-[#121A4A] border border-white/10 text-slate-100"
              }`}
            >
              <div className="flex gap-2 items-center text-[11px] opacity-80 mb-0.5">
                <span className="font-semibold">{msg.user}</span>
                {msg.important && <Pin size={12} />}
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/10 bg-[#121A4A] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Ask a question..."
          className="flex-1 h-10 bg-[#070D24] border border-white/15 rounded-xl px-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#7C3AED]"
        />
        <button
          onClick={sendMessage}
          className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white px-4 h-10 rounded-xl inline-flex items-center justify-center transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
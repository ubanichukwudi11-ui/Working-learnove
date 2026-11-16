"use client";

import { useState } from "react";
import { Sparkles, Send, X, Bot, Loader2 } from "lucide-react";

interface NovaClassAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  subject?: string;
  topic?: string;
  isTeacher?: boolean;
}

export default function NovaClassAssistantModal({
  isOpen,
  onClose,
  initialPrompt = "",
  subject = "Mathematics",
  topic = "Term 2 Revision",
  isTeacher = false,
}: NovaClassAssistantModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "nova"; text: string }[]>([
    {
      role: "nova",
      text: isTeacher
        ? `Hello! I'm Nova AI Co-Teacher for ${subject}. I can generate quick WAEC/JAMB check-for-understanding poll questions or worked board examples.`
        : `Hello! I'm Nova AI. Ask me to explain any formula or concept from this ${subject} class (${topic}).`,
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? prompt).trim();
    if (!textToSend || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Subject: ${subject}. Topic: ${topic}. Request: ${textToSend}`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "nova",
          text:
            data.response ||
            "Let's break this down step by step according to the NERDC/WAEC syllabus.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "nova",
          text: "Focus on writing down known variables with their SI units first, then substitute carefully into the governing formula.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = isTeacher
    ? [
        `Generate 2 quick poll questions on ${topic}`,
        `Give a Nigerian real-life example for ${subject}`,
      ]
    : [
        `Explain the key formula in ${topic}`,
        `Give me one WAEC practice question on ${topic}`,
      ];

  return (
    <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E4E1F5] bg-white overflow-hidden shadow-2xl flex flex-col max-h-[84vh]">
        <div className="px-5 py-4 bg-[#070D24] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="landing-display text-sm font-extrabold">Nova AI Classroom Co-Pilot</h3>
              <p className="text-[11px] text-[#22D3EE]">{subject} · {topic}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F4FB]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "nova" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-medium"
                    : "bg-white border border-[#E4E1F5] text-[#0B1230]"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6D28D9]">
              <Loader2 size={14} className="animate-spin" />
              Nova is preparing a clear explanation...
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-white border-t border-[#E4E1F5] flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              onClick={() => handleSend(qp)}
              className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#DCD7F5] bg-[#FAF8FF] hover:border-[#7C3AED] text-[#0B1230] whitespace-nowrap transition"
            >
              {qp}
            </button>
          ))}
        </div>

        <div className="p-3 bg-white border-t border-[#E4E1F5] flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Nova about this live lesson..."
            className="flex-1 h-9 px-3.5 rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] text-xs text-[#0B1230] placeholder-[#7C82A1] focus:outline-none focus:border-[#7C3AED]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || loading}
            className="px-4 h-9 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center transition"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

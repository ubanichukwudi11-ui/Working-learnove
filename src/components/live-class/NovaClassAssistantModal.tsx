"use client";

import { useState } from "react";
import { Sparkles, Send, X, Bot, Loader2, BookOpen } from "lucide-react";

interface NovaClassAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  isTeacher?: boolean;
}

export default function NovaClassAssistantModal({
  isOpen,
  onClose,
  initialPrompt = "",
  isTeacher = false,
}: NovaClassAssistantModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "nova"; text: string }[]
  >([
    {
      role: "nova",
      text: isTeacher
        ? "Hello Ms. Sarah! I'm Nova, your AI Co-Teacher. I can help generate quick check-for-understanding quizzes, explain complex steps for students, or draft whiteboard examples."
        : "Hi there! I'm Nova AI, your classroom learning assistant. Need help understanding Quadratic Equations, vertex formulas, or graphing parabolas? Ask me anything!",
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user" as const, text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `In the context of the live mathematics lecture on Quadratic Equations: ${textToSend}`,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "nova",
          text:
            data.response ||
            "The quadratic equation in standard form is ax² + bx + c = 0. Its graph forms a parabola whose axis of symmetry is x = -b/(2a).",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "nova",
          text:
            "The vertex form of a quadratic equation is f(x) = a(x - h)² + k, where (h, k) is the vertex point. If 'a' is positive, the parabola opens upward, giving a minimum value.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = isTeacher
    ? [
        "Generate 3-question live quiz on parabolas",
        "Give a real-world application of quadratic equations",
        "Explain vertex formula in simple words",
      ]
    : [
        "Explain the formula ax² + bx + c = 0",
        "How do I find the vertex of a parabola?",
        "What does the discriminant D = b² - 4ac mean?",
      ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0e1424] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/40">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                Nova AI Classroom Assistant
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/30 text-purple-300 font-normal">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-purple-200/70">
                Mathematics: Quadratic Equations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "nova" && (
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs mt-0.5">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-purple-600 text-white font-medium"
                    : "bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-line"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center text-purple-400 text-xs py-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Nova is thinking...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/20 text-purple-300 transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Ask Nova a question about this lesson..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || loading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Props = {
  onSend: (message: string) => void;
};

export default function ChatInput({ onSend }: Props) {
  const [message, setMessage] = useState("");

  function submit() {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  }

  return (
    <div className="flex gap-2.5">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit();
          }
        }}
        placeholder="Ask Nova about WAEC Maths, Physics formulas, or Essay outlines..."
        className="flex-1 bg-[#F7F8FA] border border-slate-300 focus:border-[#0B1F3A] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#0F1F38] placeholder:text-slate-400 outline-none transition"
      />

      <button
        onClick={submit}
        aria-label="Send message"
        className="w-12 h-12 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white flex items-center justify-center transition shrink-0"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
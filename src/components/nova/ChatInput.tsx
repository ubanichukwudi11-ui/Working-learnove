"use client";

import { useState } from "react";

import { Send } from "lucide-react";

type Props = {
  onSend: (message: string) => void;
};

export default function ChatInput({
  onSend,
}: Props) {
  const [message, setMessage] = useState("");

  function submit() {
    if (!message.trim()) return;

    onSend(message);

    setMessage("");
  }

  return (
    <div className="flex gap-3 mt-2">
      <input
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit();
          }
        }}
        placeholder="Ask Nova anything..."
        className="
        flex-1
        bg-[#111827]
        border
        border-slate-800
        rounded-xl
        px-4
        py-3
        outline-none
        "
      />

      <button
        onClick={submit}
        className="
        w-12
        h-12
        rounded-xl
        bg-purple-600
        flex
        items-center
        justify-center
        "
      >
        <Send size={18} />
      </button>
    </div>
  );
}
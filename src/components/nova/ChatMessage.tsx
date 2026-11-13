"use client";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#0B1F3A] text-white"
            : "bg-[#F7F8FA] border border-slate-200 text-[#0F1F38]"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
"use client";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({
  role,
  content,
}: Props) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[80%]
          rounded-2xl
          px-4
          py-3
          whitespace-pre-wrap
          ${
            isUser
              ? "bg-purple-600 text-white"
              : "bg-slate-800 text-slate-100"
          }
        `}
      >
        {content}
      </div>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
} from "lucide-react";

interface QAReply {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  isAiAssisted?: boolean;
  createdAt: string;
}

interface QAItem {
  id: string;
  videoId: string;
  topicId: string;
  timestampLabel?: string;
  authorName: string;
  authorRole: string;
  question: string;
  replies: QAReply[];
  createdAt: string;
}

interface Props {
  videoId: string;
  topicId: string;
  videoTitle: string;
  subjectName: string;
  userRole: string;
}

export default function VideoTimestampQA({
  videoId,
  topicId,
  videoTitle,
  subjectName,
  userRole,
}: Props) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [timestampInput, setTimestampInput] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [draftingAiId, setDraftingAiId] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/lms/videos/qa?videoId=${encodeURIComponent(videoId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.questions) ? data.questions : []);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/lms/videos/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASK_QUESTION",
          videoId,
          topicId,
          question: questionText.trim(),
          timestampLabel: timestampInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setItems((prev) => [data.question, ...prev]);
        }
        setQuestionText("");
        setTimestampInput("");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (questionId: string) => {
    if (!replyBody.trim() || replying) return;
    setReplying(true);
    try {
      const res = await fetch("/api/lms/videos/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLY_QUESTION",
          questionId,
          body: replyBody.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setItems((prev) =>
            prev.map((q) => (q.id === questionId ? data.question : q))
          );
        }
        setReplyBody("");
        setReplyOpenId(null);
      }
    } finally {
      setReplying(false);
    }
  };

  const handleAiDraft = async (q: QAItem) => {
    setDraftingAiId(q.id);
    setReplyOpenId(q.id);
    try {
      const res = await fetch("/api/lms/videos/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_DRAFT_REPLY",
          question: q.question,
          lessonContext: `${subjectName} — ${videoTitle}`,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setReplyBody(data.draft);
      }
    } finally {
      setDraftingAiId(null);
    }
  };

  const canAiDraft =
    userRole === "TEACHER" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  return (
    <div className="learnova-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0B1230]">
            Timestamped Topic Q&amp;A ({items.length})
          </h3>
          <p className="text-xs text-[#6B6F94]">
            Pin a question to a specific video timestamp (e.g. 04:20) so teachers &amp; classmates can explain directly.
          </p>
        </div>
      </div>

      {/* Ask Form */}
      <form
        onSubmit={handleAsk}
        className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#DCD7F5] bg-white px-3 py-2 sm:w-36 shrink-0">
            <Clock size={14} className="text-[#4F46E5] shrink-0" />
            <input
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="e.g. 04:20"
              aria-label="Timestamp"
              className="w-full text-xs text-[#0B1230] placeholder:text-[#6B6F94] outline-none tabular-nums"
            />
          </div>
          <input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            placeholder="Ask a question about a formula, step, or example in this video..."
            className="flex-1 rounded-xl border border-[#DCD7F5] bg-white px-3.5 py-2 text-xs text-[#0B1230] placeholder:text-[#6B6F94] outline-none focus:border-[#7C3AED]"
          />
          <button
            type="submit"
            disabled={posting || !questionText.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold disabled:opacity-50 shrink-0 whitespace-nowrap transition"
          >
            {posting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <MessageSquarePlus size={14} />
            )}
            Post Question
          </button>
        </div>
      </form>

      {/* Questions Feed */}
      {loading ? (
        <p className="text-xs text-[#6B6F94]">Loading lesson Q&amp;A thread...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DCD7F5] bg-[#FAF8FF] p-6 text-center text-xs text-[#6B6F94]">
          No questions posted for this video lesson yet. Be the first to ask about a step or timestamp!
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border border-[#E4E1F5] bg-white p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#0B1230]">{q.authorName}</span>
                  <span className="text-[#6B6F94]">·</span>
                  <span className="text-[#6B6F94] font-medium">{q.authorRole}</span>
                  {q.timestampLabel && (
                    <>
                      <span className="text-[#6B6F94]">·</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#4F46E5] tabular-nums">
                        <Clock size={12} /> @ {q.timestampLabel}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-[#6B6F94]">
                  {new Date(q.createdAt).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <p className="text-sm text-[#0B1230] leading-relaxed">{q.question}</p>

              {/* Replies */}
              {q.replies.length > 0 && (
                <div className="pl-4 space-y-2.5">
                  {q.replies.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[#0B1230]">
                        <span>{r.authorName}</span>
                        <span className="text-[#6B6F94]">·</span>
                        <span className="text-[#6D28D9]">{r.authorRole}</span>
                      </div>
                      <p className="text-[#43466E] leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpenId((cur) => (cur === q.id ? null : q.id));
                    setReplyBody("");
                  }}
                  className="text-xs font-bold text-[#4F46E5] hover:text-[#6D28D9] hover:underline"
                >
                  {replyOpenId === q.id ? "Cancel Reply" : "Reply"}
                </button>

                {canAiDraft && (
                  <button
                    type="button"
                    disabled={draftingAiId === q.id}
                    onClick={() => handleAiDraft(q)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1230] hover:text-[#6D28D9]"
                  >
                    {draftingAiId === q.id ? (
                      <Loader2 size={12} className="animate-spin text-[#4F46E5]" />
                    ) : (
                      <Sparkles size={12} className="text-[#6D28D9]" />
                    )}
                    Draft Reply with Nova AI
                  </button>
                )}
              </div>

              {replyOpenId === q.id && (
                <div className="flex gap-2 pt-1">
                  <input
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write explanation or guidance..."
                    className="flex-1 rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] px-3 py-2 text-xs text-[#0B1230] outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={!replyBody.trim() || replying}
                    onClick={() => handleReply(q.id)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send size={13} /> Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

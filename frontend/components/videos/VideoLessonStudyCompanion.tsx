"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  NotebookPen,
  Play,
  PlayCircle,
  Send,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { VideoLessonItem } from "./VideoLessonPlayer";
import { saveNoteToNotebook } from "@frontend/lib/notebookStorage";

interface TopicSummary {
  id: string;
  subjectId?: string;
  title: string;
  description: string;
  weekLabel?: string;
}

interface NovaMsg {
  role: "user" | "assistant";
  content: string;
  savedToNotebook?: boolean;
}

interface QuizQuestionItem {
  id: string;
  examTag?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type CompanionTab = "playlist" | "nova" | "materials" | "quiz";

interface Props {
  subjectId: string;
  subjectName: string;
  termName: string;
  topic: TopicSummary;
  topicVideos: VideoLessonItem[];
  activeVideo: VideoLessonItem;
  watchedIds: string[];
  activeTab: CompanionTab;
  onChangeTab: (tab: CompanionTab) => void;
  onSelectVideo: (video: VideoLessonItem) => void;
  canSwitchTopic: boolean;
  canPrevTopic: boolean;
  canNextTopic: boolean;
  onPrevTopic: () => void;
  onNextTopic: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF Study Sheet";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoLessonStudyCompanion({
  subjectId,
  subjectName,
  termName,
  topic,
  topicVideos,
  activeVideo,
  watchedIds,
  activeTab,
  onChangeTab,
  onSelectVideo,
  canSwitchTopic,
  canPrevTopic,
  canNextTopic,
  onPrevTopic,
  onNextTopic,
}: Props) {
  const [messages, setMessages] = useState<NovaMsg[]>([]);
  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizGenerating, setQuizGenerating] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSavedScore, setQuizSavedScore] = useState<string | null>(null);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Ask me anything about **${activeVideo.title}** (${subjectName} · ${topic.title}). I can summarize the concept, walk through formulas, or give WAEC/JAMB practice questions.`,
      },
    ]);
  }, [activeVideo.id, activeVideo.title, subjectName, topic.title]);

  useEffect(() => {
    let cancelled = false;
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizSavedScore(null);
    setQuizLoading(true);
    fetch(
      `/api/lms/quizzes?topicId=${encodeURIComponent(
        topic.id
      )}&subjectId=${encodeURIComponent(subjectId)}`,
      { cache: "no-store" }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.questions)) {
          setQuizQuestions(data.questions);
        }
      })
      .finally(() => {
        if (!cancelled) setQuizLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topic.id, subjectId]);

  const askNova = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || asking) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setPrompt("");
    setAsking(true);

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          mode: "general",
          persona: "tutor",
          subjectHint: `${subjectName} (${termName}) — Topic: ${topic.title} — Video Lesson: ${activeVideo.title}. Description: ${activeVideo.description}`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ||
            data.error ||
            "I could not generate a response right now. Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error while contacting Nova AI. Please try again.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleSaveAiReplyToNotebook = (index: number, content: string) => {
    saveNoteToNotebook({
      title: `${topic.title} — Nova Study Notes`,
      folder: subjectName,
      content,
      sourceLabel: `Nova AI · ${activeVideo.title}`,
    });
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, savedToNotebook: true } : m))
    );
  };

  const handleGenerateAiQuiz = async () => {
    setQuizGenerating(true);
    try {
      const res = await fetch("/api/lms/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_AI_QUIZ",
          subjectId,
          subjectName,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuizQuestions(data.questions);
          setQuizAnswers({});
          setQuizSubmitted(false);
          setQuizSavedScore(null);
        }
      }
    } finally {
      setQuizGenerating(false);
    }
  };

  const handleSubmitTopicQuiz = async () => {
    if (quizQuestions.length === 0) return;
    const score = quizQuestions.filter(
      (q) => quizAnswers[q.id] === q.correctAnswer
    ).length;
    setQuizSubmitted(true);
    try {
      const res = await fetch("/api/lms/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_ATTEMPT",
          subjectId,
          subjectName,
          topicId: topic.id,
          topicTitle: topic.title,
          quizType: "TOPIC_QUIZ",
          title: `${topic.title} — Mastery Check`,
          score,
          total: quizQuestions.length,
          durationSeconds: 120,
        }),
      });
      if (res.ok) {
        const pct = Math.round((score / quizQuestions.length) * 100);
        setQuizSavedScore(`Recorded ${score}/${quizQuestions.length} (${pct}%) in Analytics`);
      }
    } catch {
      // non-fatal
    }
  };

  const attachedMaterials = activeVideo.materials || [];
  const defaultSummaryHref = `/api/lms/videos/materials/download?videoId=${encodeURIComponent(
    activeVideo.id
  )}`;

  const quizCorrectCount = quizQuestions.filter(
    (q) => quizAnswers[q.id] === q.correctAnswer
  ).length;

  return (
    <div className="learnova-card overflow-hidden flex flex-col">
      {/* Companion Mode Switcher */}
      <div className="p-2 bg-[var(--surface-lavender)] border-b border-[var(--border)] grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onChangeTab("playlist")}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
            activeTab === "playlist"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-2xs border border-[var(--border)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Playlist ({topicVideos.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("nova")}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === "nova"
              ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Sparkles
            size={11}
            className={activeTab === "nova" ? "text-[#22D3EE]" : "text-[#6D28D9] dark:text-[#C4B5FD]"}
          />
          Nova AI
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("materials")}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === "materials"
              ? "bg-[#4F46E5] text-white"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Download size={11} />
          Files ({attachedMaterials.length + 1})
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("quiz")}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === "quiz"
              ? "bg-[#0B1230] dark:bg-[#1E293B] text-white"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ClipboardCheck
            size={11}
            className={activeTab === "quiz" ? "text-[#22D3EE]" : "text-[#4F46E5] dark:text-[#A5B4FC]"}
          />
          Quiz
        </button>
      </div>

      {activeTab === "playlist" ? (
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Lessons in This Topic ({topicVideos.length})
            </h3>
            <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
              Switch between teacher recordings and curated explanations.
            </p>
          </div>

          <div className="space-y-2.5">
            {topicVideos.map((vid, idx) => {
              const isActive = vid.id === activeVideo.id;
              const watched = watchedIds.includes(vid.id);
              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => onSelectVideo(vid)}
                  className={`w-full text-left rounded-xl p-3.5 border transition flex items-start gap-3 ${
                    isActive
                      ? "bg-[var(--surface-subtle)] border-[#7C3AED]"
                      : "bg-[var(--surface-lavender)] border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white"
                        : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]"
                    }`}
                  >
                    {vid.sourceType === "YOUTUBE" ? (
                      <PlayCircle size={15} />
                    ) : (
                      <Play size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--foreground)] line-clamp-2">
                      {idx + 1}. {vid.title}
                    </p>
                    <p className="text-[11px] text-[var(--foreground-subtle)] mt-1 flex items-center gap-1.5">
                      <span>
                        {vid.sourceType === "UPLOADED_VIDEO"
                          ? "Teacher Video"
                          : vid.sourceType === "YOUTUBE"
                          ? "YouTube"
                          : "Video Link"}
                      </span>
                      {vid.durationLabel && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{vid.durationLabel}</span>
                        </>
                      )}
                      {watched && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Watched
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {canSwitchTopic && (
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={!canPrevTopic}
                onClick={onPrevTopic}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] disabled:opacity-40"
              >
                Previous Topic
              </button>
              <button
                type="button"
                disabled={!canNextTopic}
                onClick={onNextTopic}
                className="px-3 py-2 rounded-lg bg-[#0B1230] dark:bg-[#1E293B] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40"
              >
                Next Topic
              </button>
            </div>
          )}
        </div>
      ) : activeTab === "nova" ? (
        <div className="flex flex-col h-[520px]">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--foreground)] truncate">
                Nova Classroom Tutor
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] truncate">
                Focused on {subjectName} · {topic.title}
              </p>
            </div>
            <Link
              href={`/nova?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(
                topic.title
              )}`}
              className="text-[11px] font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Full Workspace <ExternalLink size={11} />
            </Link>
          </div>

          {/* Quick Prompt Starters */}
          <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex flex-wrap gap-1.5 bg-[var(--surface-lavender)]">
            {[
              "Summarize key points",
              "Give 3 WAEC practice questions",
              "Explain worked steps simply",
            ].map((q) => (
              <button
                key={q}
                type="button"
                disabled={asking}
                onClick={() => askNova(q)}
                className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] hover:border-[#7C3AED] text-[11px] font-semibold text-[var(--foreground)] transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Inline Chat Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 text-xs leading-relaxed space-y-2 ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white ml-6"
                    : "bg-[var(--surface-lavender)] border border-[var(--border)] text-[var(--foreground)] mr-2"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}

                {m.role === "assistant" && idx > 0 && (
                  <div className="pt-1.5 border-t border-[var(--border)] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleSaveAiReplyToNotebook(idx, m.content)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                    >
                      {m.savedToNotebook ? (
                        <>
                          <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> Saved to Notebook
                        </>
                      ) : (
                        <>
                          <NotebookPen size={12} /> Save Answer to Notebook
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {asking && (
              <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] px-1">
                <Loader2 size={14} className="animate-spin text-[#4F46E5]" />
                Nova AI is preparing explanation...
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askNova(prompt);
            }}
            className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-2"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={asking}
              placeholder="Ask Nova about this video..."
              className="learnova-input flex-1 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || asking}
              aria-label="Send question to Nova AI"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : activeTab === "materials" ? (
        /* MATERIALS TAB */
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Downloadable Lesson Materials
            </h3>
            <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
              Study guides, worksheets, and notes for offline revision.
            </p>
          </div>

          <div className="space-y-2.5">
            {attachedMaterials.map((mat) => (
              <div
                key={mat.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] line-clamp-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#4F46E5] dark:text-[#A5B4FC] shrink-0" />
                    <span>{mat.title}</span>
                  </p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                    {mat.type} · {formatBytes(mat.fileSizeBytes)}
                  </p>
                </div>
                <a
                  href={
                    mat.url.startsWith("/api/")
                      ? mat.url
                      : `/api/lms/videos/materials/download?videoId=${encodeURIComponent(
                          activeVideo.id
                        )}&materialId=${encodeURIComponent(mat.id)}`
                  }
                  download={mat.fileName || undefined}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1230] dark:bg-[#1E293B] text-white text-[11px] font-bold shrink-0 whitespace-nowrap"
                >
                  <Download size={12} /> Download
                </a>
              </div>
            ))}

            {/* Always-available generated topic summary PDF */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#6D28D9] dark:text-[#C4B5FD] shrink-0" />
                  <span>{topic.title} — Lesson Summary Sheet</span>
                </p>
                <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                  Printable PDF · Topic objectives &amp; checklist
                </p>
              </div>
              <a
                href={defaultSummaryHref}
                download
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-[11px] font-bold shrink-0 whitespace-nowrap"
              >
                <Download size={12} /> PDF
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--foreground-subtle)]">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              Offline-ready study handouts
            </span>
            <Link href="/notebook" className="font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline">
              Open Notebook
            </Link>
          </div>
        </div>
      ) : (
        /* TOPIC MASTERY QUIZ TAB */
        <div className="p-4 sm:p-5 space-y-4 max-h-[540px] overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Topic Mastery Check
              </h3>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                Quick WAEC/JAMB objective check on {topic.title}
              </p>
            </div>
            <button
              type="button"
              disabled={quizGenerating}
              onClick={handleGenerateAiQuiz}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border-strong)] hover:border-[#7C3AED] text-[11px] font-bold text-[var(--foreground)] shrink-0"
            >
              {quizGenerating ? (
                <Loader2 size={11} className="animate-spin text-[#4F46E5]" />
              ) : (
                <Sparkles size={11} className="text-[#6D28D9] dark:text-[#C4B5FD]" />
              )}
              {quizGenerating ? "Generating..." : "New AI Quiz"}
            </button>
          </div>

          {quizLoading ? (
            <p className="text-xs text-[var(--foreground-subtle)] py-6 text-center">
              Loading topic practice questions...
            </p>
          ) : (
            <div className="space-y-3.5">
              {quizQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
                      Question {idx + 1}
                    </span>
                    {q.examTag && (
                      <span className="font-semibold text-[var(--foreground-subtle)]">
                        {q.examTag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)] leading-relaxed">
                    {q.prompt}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const chosen = quizAnswers[q.id] === opt;
                      const isRight = opt === q.correctAnswer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] font-semibold transition ${
                            quizSubmitted
                              ? isRight
                                ? "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200"
                                : chosen
                                ? "bg-rose-500/15 border-rose-400 text-rose-700 dark:text-rose-200"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-subtle)]"
                              : chosen
                              ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[#7C3AED]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <p className="text-[11px] text-[var(--foreground-muted)] bg-[var(--surface)] rounded-lg p-2 border border-[var(--border)]">
                      <strong className="text-[var(--foreground)]">Explanation:</strong>{" "}
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {quizSubmitted ? (
            <div className="rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground)]">
                <span className="inline-flex items-center gap-1.5 text-[#4F46E5] dark:text-[#A5B4FC]">
                  <Award size={15} />
                  Score: {quizCorrectCount}/{quizQuestions.length} (
                  {Math.round(
                    (quizCorrectCount / Math.max(1, quizQuestions.length)) * 100
                  )}
                  %)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    setQuizSavedScore(null);
                  }}
                  className="text-xs font-bold text-[var(--foreground)] underline"
                >
                  Retry Quiz
                </button>
              </div>
              {quizSavedScore && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {quizSavedScore}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={quizQuestions.length === 0}
              onClick={handleSubmitTopicQuiz}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition disabled:opacity-50"
            >
              Check Topic Quiz Answers
            </button>
          )}
        </div>
      )}
    </div>
  );
}

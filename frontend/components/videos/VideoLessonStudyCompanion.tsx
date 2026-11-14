"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import {
  BookOpen,
  Check,
  CheckCircle2,
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
  title: string;
  description: string;
  weekLabel?: string;
}

interface NovaMsg {
  role: "user" | "assistant";
  content: string;
  savedToNotebook?: boolean;
}

type CompanionTab = "playlist" | "nova" | "materials";

interface Props {
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

  // Reset inline Nova lesson chat smoothly when switching videos
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Ask me anything about **${activeVideo.title}** (${subjectName} · ${topic.title}). I can summarize the concept, walk through formulas, or give WAEC/JAMB practice questions.`,
      },
    ]);
  }, [activeVideo.id, activeVideo.title, subjectName, topic.title]);

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

  const attachedMaterials = activeVideo.materials || [];
  const defaultSummaryHref = `/api/lms/videos/materials/download?videoId=${encodeURIComponent(
    activeVideo.id
  )}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
      {/* Companion Mode Switcher */}
      <div className="p-2 bg-[#F7F8FA] border-b border-slate-200 grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => onChangeTab("playlist")}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "playlist"
              ? "bg-white text-[#0B1F3A] shadow-2xs"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          Playlist ({topicVideos.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("nova")}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === "nova"
              ? "bg-[#0B1F3A] text-white"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          <Sparkles size={12} className={activeTab === "nova" ? "text-[#F59E0B]" : "text-[#0D9488]"} />
          Nova AI
        </button>
        <button
          type="button"
          onClick={() => onChangeTab("materials")}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === "materials"
              ? "bg-[#0D9488] text-white"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          <Download size={12} />
          Materials ({attachedMaterials.length + 1})
        </button>
      </div>

      {activeTab === "playlist" ? (
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F3A]">
              Lessons in This Topic ({topicVideos.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
                      ? "bg-teal-50/70 border-[#0D9488]"
                      : "bg-[#F7F8FA] border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-[#0D9488] text-white"
                        : "bg-white border border-slate-200 text-[#0B1F3A]"
                    }`}
                  >
                    {vid.sourceType === "YOUTUBE" ? (
                      <PlayCircle size={15} />
                    ) : (
                      <Play size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0B1F3A] line-clamp-2">
                      {idx + 1}. {vid.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
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
                          <span className="text-[#0D9488] font-semibold">Watched</span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {canSwitchTopic && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={!canPrevTopic}
                onClick={onPrevTopic}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous Topic
              </button>
              <button
                type="button"
                disabled={!canNextTopic}
                onClick={onNextTopic}
                className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#143258] disabled:opacity-40"
              >
                Next Topic
              </button>
            </div>
          )}
        </div>
      ) : activeTab === "nova" ? (
        <div className="flex flex-col h-[520px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0B1F3A] truncate">
                Nova Classroom Tutor
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Focused on {subjectName} · {topic.title}
              </p>
            </div>
            <Link
              href={`/nova?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(
                topic.title
              )}`}
              className="text-[11px] font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Full Workspace <ExternalLink size={11} />
            </Link>
          </div>

          {/* Quick Prompt Starters */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex flex-wrap gap-1.5 bg-[#F7F8FA]">
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
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#0D9488] text-[11px] font-semibold text-[#0B1F3A] transition"
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
                    ? "bg-[#0B1F3A] text-white ml-6"
                    : "bg-[#F7F8FA] border border-slate-200 text-[#0F1F38] mr-2"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose prose-xs max-w-none prose-headings:text-[#0B1F3A] prose-headings:font-bold prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}

                {m.role === "assistant" && idx > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleSaveAiReplyToNotebook(idx, m.content)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D9488] hover:underline"
                    >
                      {m.savedToNotebook ? (
                        <>
                          <Check size={12} /> Saved to Notebook
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
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                <Loader2 size={14} className="animate-spin text-[#0D9488]" />
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
            className="p-3 border-t border-slate-200 bg-white flex gap-2"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={asking}
              placeholder="Ask Nova about this video..."
              className="flex-1 rounded-xl border border-slate-200 bg-[#F7F8FA] px-3 py-2 text-xs text-[#0F1F38] outline-none focus:border-[#0D9488] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || asking}
              aria-label="Send question to Nova AI"
              className="px-3 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : (
        /* MATERIALS TAB */
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F3A]">
              Downloadable Lesson Materials
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Study guides, worksheets, and notes for offline revision.
            </p>
          </div>

          <div className="space-y-2.5">
            {attachedMaterials.map((mat) => (
              <div
                key={mat.id}
                className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0B1F3A] line-clamp-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#0D9488] shrink-0" />
                    <span>{mat.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#143258] text-white text-[11px] font-bold shrink-0 whitespace-nowrap"
                >
                  <Download size={12} /> Download
                </a>
              </div>
            ))}

            {/* Always-available generated topic summary PDF */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#0B1F3A] shrink-0" />
                  <span>{topic.title} — Lesson Summary Sheet</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Printable PDF · Topic objectives &amp; checklist
                </p>
              </div>
              <a
                href={defaultSummaryHref}
                download
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-teal-700 text-white text-[11px] font-bold shrink-0 whitespace-nowrap"
              >
                <Download size={12} /> PDF
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#0D9488]" />
              Offline-ready study handouts
            </span>
            <Link href="/notebook" className="font-bold text-[#0B1F3A] hover:underline">
              Open Notebook
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

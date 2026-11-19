"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  MessageSquare,
  PhoneCall,
  Globe,
  Zap,
  Brain,
  Scale,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  PlaySquare,
  NotebookPen,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ChatMessage, { type GroundingSource } from "./ChatMessage";
import ChatInput, { type AttachedImagePayload } from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";
import NovaLiveVoicePanel from "./NovaLiveVoicePanel";
import type { NovaChatMode, NovaPersona } from "@backend/ai/geminiClient";
import { saveNoteToNotebook } from "@frontend/lib/notebookStorage";

type Message = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  modeLabel?: string;
  sources?: GroundingSource[];
};

interface ClassroomThread {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  persona: NovaPersona;
  messages: Message[];
  updatedAt: string;
}

const THREADS_STORAGE_KEY = "learnova_nova_classroom_threads_v1";

const SUBJECT_OPTIONS = [
  "All Subjects",
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Further Mathematics",
];

const LEVEL_OPTIONS = [
  "SS3 (WAEC / JAMB)",
  "SS2",
  "SS1",
  "JSS3 (BECE)",
  "JSS2",
  "JSS1",
  "Teacher Lesson Prep",
];

const MODES: Array<{
  id: NovaChatMode;
  label: string;
  hint: string;
  icon: typeof Zap;
}> = [
  { id: "general", label: "Balanced", hint: "Gemini 4 Hydrogen", icon: Scale },
  { id: "fast", label: "Fast", hint: "Gemini 3.1 Flash Lite", icon: Zap },
  {
    id: "deep",
    label: "Deep Reasoning",
    hint: "Gemini 4 Hydrogen · Extended Thinking",
    icon: Brain,
  },
  {
    id: "search",
    label: "Web Search",
    hint: "Gemini 4 Hydrogen + Google Search",
    icon: Globe,
  },
];

const PERSONAS: Array<{ id: NovaPersona; label: string }> = [
  { id: "tutor", label: "Classroom Tutor" },
  { id: "stem_coach", label: "STEM Derivation Coach" },
  { id: "essay_marker", label: "Essay & Literature Examiner" },
  { id: "quiz_master", label: "Practice Quiz Master" },
];

function createEmptyThread(
  subject = "All Subjects",
  classLevel = "SS2",
  persona: NovaPersona = "tutor"
): ClassroomThread {
  return {
    id: `thr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: subject === "All Subjects" ? "New Classroom Session" : `${subject} Session`,
    subject,
    classLevel,
    persona,
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export default function NovaChat() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<NovaChatMode>("general");
  const [threads, setThreads] = useState<ClassroomThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    remainingToday: number;
    dailyLimit: number;
    tierLabel: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    fetch("/api/nova/quota", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.quota) setQuotaInfo(data.quota);
      })
      .catch(() => {});
  }, []);

  // Hydrate persisted threads & handle deep-link query params (?subject=...&topic=...)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const qSubject = searchParams.get("subject") || "";
    const qTopic = searchParams.get("topic") || "";

    let stored: ClassroomThread[] = [];
    try {
      const raw = localStorage.getItem(THREADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) stored = parsed;
      }
    } catch {
      // ignore storage errors
    }

    if (qSubject || qTopic) {
      const matchedSubject =
        SUBJECT_OPTIONS.find((s) =>
          s.toLowerCase().includes(qSubject.toLowerCase())
        ) || (qSubject || "All Subjects");
      const deepLinkedThread = createEmptyThread(matchedSubject, "SS2", "tutor");
      if (qTopic) {
        deepLinkedThread.title = `${matchedSubject}: ${qTopic}`;
        deepLinkedThread.messages = [
          {
            role: "assistant",
            content: `Welcome to **Nova Classroom** focused on **${qTopic}** (${matchedSubject}).\n\nAsk any question from your video lesson, request worked examples, or click a quick action below to generate study notes you can save directly to your Notebook.`,
          },
        ];
      }
      const next = [deepLinkedThread, ...stored].slice(0, 20);
      setThreads(next);
      setActiveThreadId(deepLinkedThread.id);
      return;
    }

    if (stored.length > 0) {
      setThreads(stored);
      setActiveThreadId(stored[0].id);
    } else {
      const fresh = createEmptyThread();
      setThreads([fresh]);
      setActiveThreadId(fresh.id);
    }
  }, [searchParams]);

  // Persist threads
  useEffect(() => {
    if (threads.length === 0) return;
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads.slice(0, 20)));
    } catch {
      // ignore quota error
    }
  }, [threads]);

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length, loading]);

  const updateActiveThread = (
    updater: (prev: ClassroomThread) => ClassroomThread
  ) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread?.id ? updater(t) : t))
    );
  };

  const handleNewThread = () => {
    const fresh = createEmptyThread(
      activeThread?.subject || "All Subjects",
      activeThread?.classLevel || "SS2",
      activeThread?.persona || "tutor"
    );
    setThreads((prev) => [fresh, ...prev].slice(0, 20));
    setActiveThreadId(fresh.id);
    setActiveTab("chat");
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const fresh = createEmptyThread();
        setActiveThreadId(fresh.id);
        return [fresh];
      }
      if (activeThreadId === id) {
        setActiveThreadId(filtered[0].id);
      }
      return filtered;
    });
  };

  async function sendMessage(
    text: string,
    overrideMode?: NovaChatMode,
    overridePersona?: NovaPersona,
    image?: AttachedImagePayload
  ) {
    const trimmed = text.trim();
    if ((!trimmed && !image) || loading || !activeThread) return;

    const effectiveMode = overrideMode || mode;
    if (overrideMode && overrideMode !== mode) setMode(overrideMode);

    const effectivePersona = overridePersona || activeThread.persona;
    if (overridePersona && overridePersona !== activeThread.persona) {
      updateActiveThread((t) => ({ ...t, persona: overridePersona }));
    }

    const displayPrompt =
      trimmed || "Please inspect this attached homework photo and solve step-by-step.";

    const userMessage: Message = {
      role: "user",
      content: displayPrompt,
      imageUrl: image?.previewUrl,
    };
    const priorHistory = activeThread.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const isFirstUserMsg = !activeThread.messages.some((m) => m.role === "user");
    const derivedTitle = isFirstUserMsg
      ? displayPrompt.slice(0, 44) + (displayPrompt.length > 44 ? "..." : "")
      : activeThread.title;

    updateActiveThread((t) => ({
      ...t,
      title: derivedTitle,
      messages: [...t.messages, userMessage],
      updatedAt: new Date().toISOString(),
    }));
    setLoading(true);

    const subjectHint = [
      activeThread.classLevel,
      activeThread.subject !== "All Subjects" ? activeThread.subject : "",
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: displayPrompt,
          imageBase64: image?.base64,
          imageMimeType: image?.mimeType,
          history: priorHistory,
          mode: effectiveMode,
          persona: effectivePersona,
          subjectHint,
        }),
      });

      const data = await res.json();
      if (data?.quota) {
        setQuotaInfo(data.quota);
      }

      const contentText =
        res.status === 401
          ? "Please sign in to your Learnova account to chat with Nova AI."
          : res.status === 429
          ? data.error || "You have reached your daily Nova AI quota. Visit Subscriptions to upgrade."
          : data.response || data.error || "Sorry, I couldn't generate a response.";

      const assistantMessage: Message = {
        role: "assistant",
        content: contentText,
        modeLabel: data.modeLabel,
        sources: Array.isArray(data.sources) ? data.sources : [],
      };

      updateActiveThread((t) => ({
        ...t,
        messages: [...t.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      }));
    } catch {
      updateActiveThread((t) => ({
        ...t,
        messages: [
          ...t.messages,
          {
            role: "assistant",
            content:
              "Something went wrong while reaching Nova Classroom AI. Please try again.",
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.fullName?.split(" ")[0] || "Learner";
  const hasConversation = (activeThread?.messages.length || 0) > 0;

  return (
    <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex min-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-128px)] shadow-[0_12px_36px_rgba(11,18,48,0.06)]">
      {/* Left Classroom Studio Rail */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-40 md:static w-72 shrink-0 border-r border-[var(--border)] bg-[var(--surface-lavender)] flex flex-col shadow-xl md:shadow-none">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--surface)]/85">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(79,70,229,0.28)]">
                <Sparkles size={15} />
              </div>
              <div className="min-w-0">
                <p className="landing-display text-xs font-extrabold text-[var(--foreground)] truncate">
                  Nova for Classrooms
                </p>
                <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium truncate">
                  Learnova Study Studio
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Collapse classroom sidebar"
              className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <div className="p-3.5 space-y-4 flex-1 overflow-y-auto sidebar-scroll">
            <button
              type="button"
              onClick={handleNewThread}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-[0_6px_16px_rgba(79,70,229,0.25)] whitespace-nowrap"
            >
              <Plus size={15} />
              New Study Session
            </button>

            {/* Classroom Context Selectors */}
            {activeThread && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Class Context
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                    Subject
                  </label>
                  <select
                    value={activeThread.subject}
                    onChange={(e) =>
                      updateActiveThread((t) => ({ ...t, subject: e.target.value }))
                    }
                    className="learnova-input w-full px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                      Class
                    </label>
                    <select
                      value={activeThread.classLevel}
                      onChange={(e) =>
                        updateActiveThread((t) => ({
                          ...t,
                          classLevel: e.target.value,
                        }))
                      }
                      className="learnova-input w-full px-2 py-1.5 text-xs font-semibold"
                    >
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                      Assistant Role
                    </label>
                    <select
                      value={activeThread.persona}
                      onChange={(e) =>
                        updateActiveThread((t) => ({
                          ...t,
                          persona: e.target.value as NovaPersona,
                        }))
                      }
                      className="learnova-input w-full px-2 py-1.5 text-xs font-semibold"
                    >
                      {PERSONAS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Study Sessions */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] px-1">
                Recent Sessions
              </p>
              <div className="space-y-1">
                {threads.map((thr) => {
                  const isCurrent = thr.id === activeThread?.id;
                  return (
                    <div
                      key={thr.id}
                      className={`group flex items-center justify-between gap-1.5 rounded-xl px-2.5 py-2 text-xs transition ${
                        isCurrent
                          ? "bg-[var(--surface)] border border-violet-400/70 dark:border-violet-500/60 text-[var(--foreground)] font-bold shadow-2xs"
                          : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]/80 hover:text-[var(--foreground)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveThreadId(thr.id);
                          setActiveTab("chat");
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="truncate">{thr.title}</p>
                        <p className="text-[10px] font-medium text-[var(--foreground-subtle)] truncate mt-0.5 tabular-nums">
                          {thr.subject} · {thr.messages.length} msgs
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteThread(thr.id)}
                        title="Delete session"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--foreground-subtle)] hover:text-rose-600 dark:hover:text-rose-400 transition shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connected Learnova Classroom Shortcuts */}
          <div className="p-3 border-t border-[var(--border)] space-y-1.5 bg-[var(--surface)]/85">
            <Link
              href="/videos"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-violet-600 dark:hover:text-violet-400 transition"
            >
              <PlaySquare size={14} className="text-cyan-600 dark:text-cyan-400" />
              Video Lessons Library
            </Link>
            <Link
              href="/notebook"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-violet-600 dark:hover:text-violet-400 transition"
            >
              <NotebookPen size={14} className="text-indigo-600 dark:text-indigo-400" />
              Study Notebook
            </Link>
          </div>
        </aside>
      )}

      {/* Main Classroom Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)]">
        {/* Clean Top Capability & Mode Strip */}
        <header className="px-4 sm:px-6 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-lavender)]/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Open classroom sidebar"
                className="p-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-lavender)] transition shrink-0"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}

            {/* Mode Switcher */}
            <div className="inline-flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-x-auto max-w-full">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id && activeTab === "chat";
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={m.hint}
                    onClick={() => {
                      setMode(m.id);
                      setActiveTab("chat");
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-violet-50 text-indigo-600 border border-violet-200 dark:bg-violet-950/60 dark:text-indigo-300 dark:border-violet-800/60"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={
                        active
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-[var(--foreground-subtle)]"
                      }
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quotaInfo && (
              <span
                title={`Tier: ${quotaInfo.tierLabel.replace(/_/g, " ")}`}
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap tabular-nums ${
                  quotaInfo.remainingToday <= 1
                    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
                    : "bg-violet-50 text-indigo-600 border-violet-200 dark:bg-violet-950/50 dark:text-indigo-300 dark:border-violet-800/60"
                }`}
              >
                {quotaInfo.remainingToday}/{quotaInfo.dailyLimit} queries left today
              </span>
            )}
            {activeThread && (
              <span className="hidden xl:inline text-xs font-medium text-[var(--foreground-muted)] whitespace-nowrap">
                {activeThread.classLevel} · {activeThread.subject}
              </span>
            )}

            <div className="inline-flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <MessageSquare size={13} /> Classroom Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "voice"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <PhoneCall size={13} /> Live Voice Tutor
              </button>
            </div>
          </div>
        </header>

        {activeTab === "voice" ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <NovaLiveVoicePanel />
          </div>
        ) : (
          <>
            {/* Conversation Area or Centered Classroom Welcome */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
              {!hasConversation ? (
                <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center space-y-7 py-6">
                  <div className="space-y-2.5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
                      <Sparkles size={15} />
                      <span>
                        Learnova Classroom Companion ·{" "}
                        {activeThread?.subject || "All Subjects"}
                      </span>
                    </div>
                    <h1 className="landing-display text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight text-balance">
                      Hello, {firstName}. What are we studying today?
                    </h1>
                    <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-xl mx-auto">
                      Ask questions, derive formulas step-by-step, check WAEC essays, or
                      generate revision guides to save into your Notebook.
                    </p>
                  </div>

                  <SuggestedPrompts
                    subjectFocus={activeThread?.subject}
                    onSelect={sendMessage}
                  />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {activeThread?.messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      role={message.role}
                      content={message.content}
                      imageUrl={message.imageUrl}
                      modeLabel={message.modeLabel}
                      sources={message.sources}
                      onSaveToNotebook={(textContent) => {
                        saveNoteToNotebook({
                          title: `${activeThread.subject === "All Subjects" ? "Nova" : activeThread.subject}: ${activeThread.title}`,
                          folder:
                            activeThread.subject === "All Subjects"
                              ? "General"
                              : activeThread.subject,
                          content: textContent,
                          sourceLabel: "Nova Classroom AI",
                        });
                      }}
                    />
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2.5 text-[var(--foreground-muted)] text-xs pt-1">
                      <Loader2
                        size={15}
                        className="animate-spin text-violet-600 dark:text-violet-400 shrink-0"
                      />
                      <span className="font-medium">
                        {mode === "search"
                          ? "Searching the web with Google Search grounding..."
                          : mode === "deep"
                          ? "Thinking through step-by-step derivations..."
                          : "Nova Classroom AI is writing your explanation..."}
                      </span>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Docked Bottom Composer */}
            <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 sm:px-8 py-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  disabled={loading}
                  subjectLabel={
                    activeThread?.subject !== "All Subjects"
                      ? activeThread?.subject
                      : undefined
                  }
                  onSend={(txt, img) => sendMessage(txt, undefined, undefined, img)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

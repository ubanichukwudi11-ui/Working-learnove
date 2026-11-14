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
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";
import NovaLiveVoicePanel from "./NovaLiveVoicePanel";
import type { NovaChatMode, NovaPersona } from "@backend/ai/geminiClient";
import { saveNoteToNotebook } from "@frontend/lib/notebookStorage";

type Message = {
  role: "user" | "assistant";
  content: string;
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

  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

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
    overridePersona?: NovaPersona
  ) {
    const trimmed = text.trim();
    if (!trimmed || loading || !activeThread) return;

    const effectiveMode = overrideMode || mode;
    if (overrideMode && overrideMode !== mode) setMode(overrideMode);

    const effectivePersona = overridePersona || activeThread.persona;
    if (overridePersona && overridePersona !== activeThread.persona) {
      updateActiveThread((t) => ({ ...t, persona: overridePersona }));
    }

    const userMessage: Message = { role: "user", content: trimmed };
    const priorHistory = activeThread.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const isFirstUserMsg = !activeThread.messages.some((m) => m.role === "user");
    const derivedTitle = isFirstUserMsg
      ? trimmed.slice(0, 44) + (trimmed.length > 44 ? "..." : "")
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
          message: trimmed,
          history: priorHistory,
          mode: effectiveMode,
          persona: effectivePersona,
          subjectHint,
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.response || data.error || "Sorry, I couldn't generate a response.",
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
    <div className="relative rounded-3xl border border-slate-200 bg-white overflow-hidden flex min-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-128px)]">
      {/* Left Gemini-for-Classrooms Studio Rail */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-40 md:static w-72 shrink-0 border-r border-slate-200 bg-[#F7F8FA] flex flex-col shadow-xl md:shadow-none">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-[#F59E0B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#0B1F3A] truncate">
                  Nova for Classrooms
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Gemini Study Studio
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Collapse classroom sidebar"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <div className="p-3.5 space-y-4 flex-1 overflow-y-auto sidebar-scroll">
            <button
              type="button"
              onClick={handleNewThread}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={15} />
              New Study Session
            </button>

            {/* Classroom Context Selectors */}
            {activeThread && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Class Context
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Subject
                  </label>
                  <select
                    value={activeThread.subject}
                    onChange={(e) =>
                      updateActiveThread((t) => ({ ...t, subject: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-[#F7F8FA] px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A]"
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
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
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
                      className="w-full rounded-lg border border-slate-200 bg-[#F7F8FA] px-2 py-1.5 text-xs font-semibold text-[#0B1F3A]"
                    >
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
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
                      className="w-full rounded-lg border border-slate-200 bg-[#F7F8FA] px-2 py-1.5 text-xs font-semibold text-[#0B1F3A]"
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
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
                          ? "bg-white border border-slate-200 text-[#0B1F3A] font-bold"
                          : "text-slate-600 hover:bg-white/70"
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
                        <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                          {thr.subject} · {thr.messages.length} msgs
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteThread(thr.id)}
                        title="Delete session"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 transition"
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
          <div className="p-3 border-t border-slate-200 space-y-1.5 bg-white/70">
            <Link
              href="/videos"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:text-[#0B1F3A] transition"
            >
              <PlaySquare size={14} className="text-[#0D9488]" />
              Video Lessons Library
            </Link>
            <Link
              href="/notebook"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:text-[#0B1F3A] transition"
            >
              <NotebookPen size={14} className="text-[#0B1F3A]" />
              Study Notebook
            </Link>
          </div>
        </aside>
      )}

      {/* Main Gemini-Style Classroom Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Clean Top Capability & Mode Strip */}
        <header className="px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Open classroom sidebar"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}

            {/* Mode Switcher */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#F7F8FA] border border-slate-200 rounded-xl">
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? "bg-white text-[#0B1F3A] shadow-2xs"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={active ? "text-[#0D9488]" : "text-slate-400"}
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeThread && (
              <span className="hidden xl:inline text-xs text-slate-500 whitespace-nowrap">
                {activeThread.classLevel} · {activeThread.subject}
              </span>
            )}

            <div className="inline-flex rounded-xl bg-[#F7F8FA] border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "chat"
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                <MessageSquare size={13} /> Classroom Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "voice"
                    ? "bg-[#0D9488] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
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
            {/* Conversation Area or Centered Gemini Classroom Welcome */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
              {!hasConversation ? (
                <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center space-y-7 py-6">
                  <div className="space-y-2.5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                      <Sparkles size={15} />
                      <span>
                        Learnova Classroom Companion ·{" "}
                        {activeThread?.subject || "All Subjects"}
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight text-balance">
                      Hello, {firstName}. What are we studying today?
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
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
                    <div className="flex items-center gap-2.5 text-slate-600 text-xs pt-1">
                      <Loader2
                        size={15}
                        className="animate-spin text-[#0D9488] shrink-0"
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
            <div className="border-t border-slate-100 bg-white px-4 sm:px-8 py-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  disabled={loading}
                  subjectLabel={
                    activeThread?.subject !== "All Subjects"
                      ? activeThread?.subject
                      : undefined
                  }
                  onSend={(txt) => sendMessage(txt)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

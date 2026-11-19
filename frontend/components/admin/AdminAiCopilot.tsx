"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CalendarDays,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  ArrowRight,
  Clock,
  Users,
} from "lucide-react";

export interface AiTimetableSuggestion {
  tempId: string;
  classLevelId: string;
  classLevelCode: string;
  subjectId: string;
  subjectName: string;
  assignedTeacherIds: string[];
  teacherNames: string[];
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string;
  endTime: string;
  mode: "ONLINE" | "PHYSICAL" | "HYBRID";
  maxCapacityPerRoom: number;
  eligibleStudentCount: number;
  rationale: string;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface AdminAiCopilotProps {
  defaultTab?: "timetable" | "copilot";
  compact?: boolean;
  onLoadSuggestionIntoForm?: (suggestion: AiTimetableSuggestion) => void;
  onTimetablePublished?: () => Promise<void> | void;
}

const TIMETABLE_PRESETS = [
  "Generate a conflict-free morning timetable (08:00–13:00 WAT) for all subjects with approved teachers.",
  "Prioritize WAEC/SS1–SS3 Core & Science subjects across Monday to Friday.",
  "Check where approved teachers are available and fill open weekly timetable gaps.",
];

const COPILOT_PRESETS = [
  "Summarize today's operational priorities, pending teacher approvals, and bank transfers.",
  "Audit our timetable readiness and tell me which subjects need more approved teachers.",
  "Draft a professional Second Term fee & live-class resumption notice for Nigerian parents.",
  "Explain any student capacity shortfalls and how to resolve them cleanly.",
];

export default function AdminAiCopilot({
  defaultTab = "timetable",
  compact = false,
  onLoadSuggestionIntoForm,
  onTimetablePublished,
}: AdminAiCopilotProps) {
  const [activeTab, setActiveTab] = useState<"timetable" | "copilot">(defaultTab);
  const [snapshot, setSnapshot] = useState<any>(null);

  // Timetable AI state
  const [goal, setGoal] = useState(TIMETABLE_PRESETS[0]);
  const [targetClassLevelId, setTargetClassLevelId] = useState("");
  const [planning, setPlanning] = useState(false);
  const [planSummary, setPlanSummary] = useState("");
  const [suggestions, setSuggestions] = useState<AiTimetableSuggestion[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Operations chat state
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; text: string }>
  >([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello Admin. I am connected to Learnova's live academic, approval, payment, and timetable records. Ask me to audit pending tasks, resolve timetable shortfalls, or draft official school notices.",
    },
  ]);

  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/admin-ai", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setSnapshot(json.snapshot || null);
    } catch {
      // ignore initial error
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleGenerateTimetable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPlanning(true);
    setAiFeedback(null);
    setPublishedIds([]);
    try {
      const res = await fetch("/api/lms/admin-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUGGEST_TIMETABLE",
          goal,
          targetClassLevelId: targetClassLevelId || undefined,
          maxCapacityPerRoom: snapshot?.defaultRoomCapacity || 50,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate timetable suggestions.");
      setPlanSummary(json.summary || "");
      setSuggestions(json.suggestions || []);
    } catch (err: any) {
      setAiFeedback({
        type: "err",
        text: err?.message || "Could not generate AI timetable suggestions.",
      });
    } finally {
      setPlanning(false);
    }
  };

  const handlePublishSuggestion = async (s: AiTimetableSuggestion) => {
    setPublishingId(s.tempId);
    setAiFeedback(null);
    try {
      const res = await fetch("/api/lms/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TIMETABLE_ENTRY",
          classLevelId: s.classLevelId,
          subjectId: s.subjectId,
          assignedTeacherIds: s.assignedTeacherIds,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          mode: s.mode,
          maxCapacityPerRoom: s.maxCapacityPerRoom,
          publicationStatus: "PUBLISHED",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish suggested slot.");
      setPublishedIds((prev) => [...prev, s.tempId]);
      setAiFeedback({
        type: "ok",
        text: `Published ${s.classLevelCode} ${s.subjectName} (${s.dayOfWeek} ${s.startTime}–${s.endTime} WAT) and allocated groups.`,
      });
      await loadSnapshot();
      if (onTimetablePublished) await onTimetablePublished();
    } catch (err: any) {
      setAiFeedback({
        type: "err",
        text: err?.message || "Unable to publish slot.",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleSendChat = async (promptText?: string) => {
    const text = (promptText ?? chatInput).trim();
    if (!text || chatting) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!promptText) setChatInput("");
    setChatting(true);

    try {
      const res = await fetch("/api/lms/admin-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASK_COPILOT",
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Admin Copilot request failed.");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: json.reply || "No response received.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: `Error: ${err?.message || "Failed to reach Admin AI Copilot."}`,
        },
      ]);
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="learnova-card overflow-hidden">
      {/* Header & Mode Switcher */}
      <div className="bg-[var(--surface-lavender)] border-b border-[var(--border)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-[var(--foreground)]">
              Learnova Admin AI Copilot
            </h2>
            <p className="text-xs text-[var(--foreground-subtle)]">
              {snapshot
                ? `${snapshot.counts?.approvedTeacherPairs || 0} approved teacher slots · ${snapshot.counts?.pendingTeacherApplications || 0} pending approvals · ${snapshot.counts?.pendingBankTransfers || 0} pending transfers`
                : "Grounded in live school approvals, timetables, and enrolments"}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("timetable")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "timetable"
                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <CalendarDays size={14} /> Timetable Planner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "copilot"
                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <MessageSquare size={14} /> Operations Assistant
          </button>
        </div>
      </div>

      {aiFeedback && (
        <div
          className={`mx-6 mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border ${
            aiFeedback.type === "ok"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
          }`}
        >
          {aiFeedback.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{aiFeedback.text}</span>
        </div>
      )}

      {/* TAB 1: AI TIMETABLE PLANNER */}
      {activeTab === "timetable" && (
        <div className="p-6 space-y-5">
          <form onSubmit={handleGenerateTimetable} className="space-y-3">
            <div className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Scheduling Goal or Constraint
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Build a conflict-free SS1–SS3 morning timetable (WAT)..."
                  className="learnova-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Class Level Scope
                </label>
                <select
                  value={targetClassLevelId}
                  onChange={(e) => setTargetClassLevelId(e.target.value)}
                  className="learnova-input text-sm"
                >
                  <option value="">All Class Levels</option>
                  {(snapshot?.activeClassLevels || []).map((lvl: any) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TIMETABLE_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGoal(preset)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border-strong)] hover:border-indigo-500 text-[var(--foreground-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition whitespace-nowrap"
                  >
                    {i === 0 ? "Morning Core" : i === 1 ? "WAEC SS1–SS3" : "Fill Weekly Gaps"}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={planning}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold disabled:opacity-50 transition shadow-xs whitespace-nowrap"
              >
                {planning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating Proposals...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-[#22D3EE]" /> Generate AI Timetable Draft
                  </>
                )}
              </button>
            </div>
          </form>

          {planSummary && (
            <div className="rounded-xl bg-[var(--surface-lavender)] border border-[var(--border)] p-4 text-xs sm:text-sm text-[var(--foreground-muted)]">
              <span className="font-extrabold text-[var(--foreground)]">AI Assessment: </span>
              {planSummary}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-3.5">
              {suggestions.map((s) => {
                const isPublished = publishedIds.includes(s.tempId);
                return (
                  <div
                    key={s.tempId}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      s.validation.valid
                        ? "border-[var(--border)] bg-[var(--surface)]"
                        : "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-[var(--foreground)]">
                          {s.classLevelCode} · {s.subjectName}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5 flex items-center gap-2 tabular-nums">
                          <Clock size={12} className="text-indigo-600 dark:text-indigo-400" />
                          {s.dayOfWeek} · {s.startTime}–{s.endTime} WAT ({s.mode})
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          isPublished || s.validation.valid
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {isPublished
                          ? "Published"
                          : s.validation.valid
                          ? "Conflict-Free"
                          : "Needs Adjustment"}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--foreground-muted)] space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Users size={12} className="text-[var(--foreground-subtle)]" />
                        <span>
                          <strong className="text-[var(--foreground)]">Teachers:</strong>{" "}
                          {s.teacherNames.length > 0 ? s.teacherNames.join(", ") : "None assigned"}
                        </span>
                      </p>
                      <p className="tabular-nums">
                        <strong className="text-[var(--foreground)]">Demand:</strong> {s.eligibleStudentCount} entitled student(s) · Max{" "}
                        {s.maxCapacityPerRoom}/room
                      </p>
                      {s.rationale && <p className="text-[var(--foreground-subtle)] italic">{s.rationale}</p>}
                    </div>

                    {!s.validation.valid && s.validation.errors.length > 0 && (
                      <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2 text-[11px] text-rose-700 dark:text-rose-300">
                        {s.validation.errors.join(" ")}
                      </div>
                    )}
                    {s.validation.warnings.length > 0 && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                        {s.validation.warnings.join(" ")}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {onLoadSuggestionIntoForm && (
                        <button
                          type="button"
                          onClick={() => onLoadSuggestionIntoForm(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] hover:bg-[var(--surface-lavender)] text-xs font-semibold text-[var(--foreground)] transition whitespace-nowrap"
                        >
                          <Plus size={12} /> Load into Form
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!s.validation.valid || publishingId === s.tempId || isPublished}
                        onClick={() => handlePublishSuggestion(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold disabled:opacity-50 transition whitespace-nowrap"
                      >
                        {publishingId === s.tempId
                          ? "Publishing..."
                          : isPublished
                          ? "Published"
                          : "Publish & Allocate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {suggestions.length === 0 && !planning && (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-lavender)] p-4 text-xs text-[var(--foreground-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Only subjects with <strong className="text-[var(--foreground)]">approved teachers</strong> in{" "}
                <Link href="/admin/teachers" className="text-indigo-600 dark:text-indigo-400 font-bold underline">
                  Teacher Approvals
                </Link>{" "}
                can be scheduled automatically.
              </span>
              {!compact && (
                <Link
                  href="/admin/timetable"
                  className="inline-flex items-center gap-1 font-bold text-[var(--foreground)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline shrink-0"
                >
                  Open Timetable Builder <ArrowRight size={13} />
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN OPERATIONS COPILOT */}
      {activeTab === "copilot" && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {COPILOT_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={chatting}
                onClick={() => handleSendChat(p)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border-strong)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--foreground-muted)] transition text-left"
              >
                {p}
              </button>
            ))}
          </div>

          <div
            className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 space-y-3 overflow-y-auto ${
              compact ? "max-h-72" : "h-96"
            }`}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatting && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 text-xs text-[var(--foreground-subtle)] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  Analyzing live school records...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about timetable gaps, teacher approvals, bank transfers, or draft a school notice..."
              className="flex-1 learnova-input text-sm"
            />
            <button
              type="submit"
              disabled={chatting || !chatInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shrink-0 shadow-xs whitespace-nowrap"
            >
              <Send size={15} /> Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

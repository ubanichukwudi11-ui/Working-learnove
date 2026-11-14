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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header & Mode Switcher */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F59E0B] flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
              Learnova Admin AI Copilot
            </h2>
            <p className="text-xs text-slate-500">
              {snapshot
                ? `${snapshot.counts?.approvedTeacherPairs || 0} approved teacher slots · ${snapshot.counts?.pendingTeacherApplications || 0} pending approvals · ${snapshot.counts?.pendingBankTransfers || 0} pending transfers`
                : "Grounded in live school approvals, timetables, and enrolments"}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("timetable")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "timetable"
                ? "bg-[#0D9488] text-white"
                : "text-slate-600 hover:text-[#0B1F3A]"
            }`}
          >
            <CalendarDays size={14} /> Timetable Planner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "copilot"
                ? "bg-[#0D9488] text-white"
                : "text-slate-600 hover:text-[#0B1F3A]"
            }`}
          >
            <MessageSquare size={14} /> Operations Assistant
          </button>
        </div>
      </div>

      {aiFeedback && (
        <div
          className={`mx-5 mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border ${
            aiFeedback.type === "ok"
              ? "bg-teal-50 text-[#0D9488] border-teal-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {aiFeedback.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{aiFeedback.text}</span>
        </div>
      )}

      {/* TAB 1: AI TIMETABLE PLANNER */}
      {activeTab === "timetable" && (
        <div className="p-5 space-y-5">
          <form onSubmit={handleGenerateTimetable} className="space-y-3">
            <div className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Scheduling Goal or Constraint
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Build a conflict-free SS1–SS3 morning timetable (WAT)..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Class Level Scope
                </label>
                <select
                  value={targetClassLevelId}
                  onChange={(e) => setTargetClassLevelId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
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
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {i === 0 ? "Morning Core" : i === 1 ? "WAEC SS1–SS3" : "Fill Weekly Gaps"}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={planning}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132c52] text-white text-xs sm:text-sm font-bold disabled:opacity-50 transition"
              >
                {planning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating Proposals...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-[#F59E0B]" /> Generate AI Timetable Draft
                  </>
                )}
              </button>
            </div>
          </form>

          {planSummary && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700">
              <span className="font-extrabold text-[#0B1F3A]">AI Assessment: </span>
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
                        ? "border-slate-200 bg-white"
                        : "border-amber-200 bg-amber-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-[#0B1F3A]">
                          {s.classLevelCode} · {s.subjectName}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 tabular-nums">
                          <Clock size={12} className="text-[#0D9488]" />
                          {s.dayOfWeek} · {s.startTime}–{s.endTime} WAT ({s.mode})
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isPublished
                            ? "bg-teal-100 text-[#0D9488]"
                            : s.validation.valid
                            ? "bg-teal-50 text-[#0D9488]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {isPublished
                          ? "Published"
                          : s.validation.valid
                          ? "Conflict-Free"
                          : "Needs Adjustment"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span>
                          <strong>Teachers:</strong>{" "}
                          {s.teacherNames.length > 0 ? s.teacherNames.join(", ") : "None assigned"}
                        </span>
                      </p>
                      <p>
                        <strong>Demand:</strong> {s.eligibleStudentCount} entitled student(s) · Max{" "}
                        {s.maxCapacityPerRoom}/room
                      </p>
                      {s.rationale && <p className="text-slate-500 italic">{s.rationale}</p>}
                    </div>

                    {!s.validation.valid && s.validation.errors.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
                        {s.validation.errors.join(" ")}
                      </div>
                    )}
                    {s.validation.warnings.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
                        {s.validation.warnings.join(" ")}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {onLoadSuggestionIntoForm && (
                        <button
                          type="button"
                          onClick={() => onLoadSuggestionIntoForm(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A]"
                        >
                          <Plus size={12} /> Load into Form
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!s.validation.valid || publishingId === s.tempId || isPublished}
                        onClick={() => handlePublishSuggestion(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-teal-600 text-white text-xs font-semibold disabled:opacity-50"
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
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Only subjects with <strong>approved teachers</strong> in{" "}
                <Link href="/admin/teachers" className="text-[#0D9488] font-bold underline">
                  Teacher Approvals
                </Link>{" "}
                can be scheduled automatically.
              </span>
              {!compact && (
                <Link
                  href="/admin/timetable"
                  className="inline-flex items-center gap-1 font-bold text-[#0B1F3A] hover:underline shrink-0"
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
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {COPILOT_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={chatting}
                onClick={() => handleSendChat(p)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-[#0D9488] text-slate-700 transition text-left"
              >
                {p}
              </button>
            ))}
          </div>

          <div
            className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 overflow-y-auto ${
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
                      ? "bg-[#0B1F3A] text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatting && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#0D9488]" />
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
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0D9488]"
            />
            <button
              type="submit"
              disabled={chatting || !chatInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 transition shrink-0"
            >
              <Send size={15} /> Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

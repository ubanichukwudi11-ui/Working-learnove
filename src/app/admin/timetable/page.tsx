"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import AdminAiCopilot, { type AiTimetableSuggestion } from "@/components/admin/AdminAiCopilot";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  RefreshCw,
  Ban,
  Send,
  Sparkles,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export default function AdminTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [entries, setEntries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<any[]>([]);

  // Form
  const [classLevelId, setClassLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<(typeof DAYS)[number]>("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [mode, setMode] = useState<"ONLINE" | "PHYSICAL" | "HYBRID">("ONLINE");
  const [maxCapacity, setMaxCapacity] = useState("50");
  const [publishOnSave, setPublishOnSave] = useState(true);

  const loadTimetable = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/timetable", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setEntries(json.entries || []);
      setGroups(json.groups || []);
      setClassLevels(json.classLevels || []);
      setSubjects(json.subjects || []);
      setApprovedTeachers(json.approvedTeachers || []);
      if (!classLevelId && (json.classLevels || []).length > 0) {
        setClassLevelId(json.classLevels[0].id);
      }
      if (!subjectId && (json.subjects || []).length > 0) {
        setSubjectId(json.subjects[0].id);
      }
      if (json.defaultCapacity) {
        setMaxCapacity(String(json.defaultCapacity));
      }
    } finally {
      setLoading(false);
    }
  }, [classLevelId, subjectId]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  // Approved teachers strictly for the selected classLevelId + subjectId
  const eligibleTeachers = approvedTeachers.filter(
    (ap) => ap.classLevelId === classLevelId && ap.subjectId === subjectId
  );

  // Filter subjects linked to selected class level
  const levelSubjects = subjects.filter(
    (s) => !classLevelId || (s.classLevelIds || []).includes(classLevelId)
  );

  const toggleTeacher = (tid: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]
    );
  };

  const postAction = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Timetable operation failed.");
      const warnText =
        Array.isArray(json.warnings) && json.warnings.length > 0
          ? ` Note: ${json.warnings.join(" ")}`
          : "";
      setFeedback({ type: "ok", text: okMessage + warnText });
      await loadTimetable();
      return true;
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to save timetable." });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await postAction(
      {
        action: "CREATE_TIMETABLE_ENTRY",
        classLevelId,
        subjectId,
        assignedTeacherIds: selectedTeacherIds,
        dayOfWeek,
        startTime,
        endTime,
        mode,
        maxCapacityPerRoom: Number(maxCapacity),
        publicationStatus: publishOnSave ? "PUBLISHED" : "DRAFT",
      },
      publishOnSave
        ? "Timetable published and student groups allocated automatically."
        : "Timetable draft saved."
    );
    if (ok) {
      setSelectedTeacherIds([]);
    }
  };

  const lvlLabel = (id: string) => classLevels.find((c) => c.id === id)?.code || id;
  const subLabel = (id: string) => subjects.find((s) => s.id === id)?.name || id;

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Official WAT Timetable &amp; Automatic Group Allocation
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Official Timetable Builder
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Only School Administrators publish official timetables. The system blocks teacher
                or cohort scheduling overlaps, restricts assignments strictly to approved
                teachers, and automatically splits large classes into capacity-bounded groups.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiPlanner((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shadow-xs"
              >
                <Sparkles size={15} />
                {showAiPlanner ? "Hide AI Assistant" : "AI Timetable Assistant"}
              </button>
              <Link
                href="/admin/classrooms"
                className="px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition"
              >
                Classroom Control Centre
              </Link>
            </div>
          </div>

          {showAiPlanner && (
            <AdminAiCopilot
              defaultTab="timetable"
              compact
              onTimetablePublished={loadTimetable}
              onLoadSuggestionIntoForm={(s: AiTimetableSuggestion) => {
                setClassLevelId(s.classLevelId);
                setSubjectId(s.subjectId);
                setSelectedTeacherIds(s.assignedTeacherIds);
                setDayOfWeek(s.dayOfWeek);
                setStartTime(s.startTime);
                setEndTime(s.endTime);
                setMode(s.mode);
                setMaxCapacity(String(s.maxCapacityPerRoom));
                setFeedback({
                  type: "ok",
                  text: `Loaded AI proposal (${s.classLevelCode} ${s.subjectName} · ${s.dayOfWeek} ${s.startTime} WAT) into the form below. Review and click Publish & Allocate.`,
                });
              }}
            />
          )}

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading official timetable...
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Creation Form */}
              <form
                onSubmit={handleCreate}
                className="learnova-card p-5 space-y-4 h-fit"
              >
                <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                  <Plus size={16} className="text-[#4F46E5]" />
                  Schedule Official Lesson
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Class Level
                    </label>
                    <select
                      value={classLevelId}
                      onChange={(e) => {
                        setClassLevelId(e.target.value);
                        setSelectedTeacherIds([]);
                      }}
                      className="learnova-input text-sm"
                    >
                      {classLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setSelectedTeacherIds([]);
                      }}
                      className="learnova-input text-sm"
                    >
                      {levelSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Day
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as any)}
                      className="learnova-input text-xs px-2 py-2"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Start (WAT)
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="learnova-input text-xs px-2 py-2 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      End (WAT)
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="learnova-input text-xs px-2 py-2 tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Teaching Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="learnova-input text-sm"
                    >
                      <option value="ONLINE">ONLINE (Live Room)</option>
                      <option value="HYBRID">HYBRID</option>
                      <option value="PHYSICAL">PHYSICAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Room Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="learnova-input text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Strict Approved Teachers Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#43466E]">
                    Assign Approved Teacher(s) for {lvlLabel(classLevelId)} {subLabel(subjectId)}
                  </label>
                  {eligibleTeachers.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                      No teachers are currently approved for {subLabel(subjectId)} ({lvlLabel(classLevelId)}).{" "}
                      <Link href="/admin/teachers" className="font-bold underline">
                        Approve a teacher first →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#E4E1F5] bg-[#FAF8FF] rounded-xl p-2">
                      {eligibleTeachers.map((ap) => {
                        const checked = selectedTeacherIds.includes(ap.teacherUserId);
                        return (
                          <label
                            key={ap.id}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                              checked
                                ? "bg-[#EEF2FF] text-[#4F46E5]"
                                : "text-[#0B1230] hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTeacher(ap.teacherUserId)}
                              className="accent-[#4F46E5]"
                            />
                            <span>{ap.teacherName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#43466E]">
                  <input
                    type="checkbox"
                    checked={publishOnSave}
                    onChange={(e) => setPublishOnSave(e.target.checked)}
                    className="accent-[#4F46E5]"
                  />
                  Publish immediately &amp; allocate parallel student groups
                </label>

                <button
                  disabled={saving || selectedTeacherIds.length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-xs"
                >
                  {saving ? "Validating & Allocating..." : publishOnSave ? "Publish & Allocate" : "Save Draft"}
                </button>
              </form>

              {/* Official Timetable & Group Allocation Cards */}
              <div className="lg:col-span-2 space-y-4">
                {entries.length === 0 ? (
                  <div className="learnova-card border-dashed p-12 text-center space-y-2">
                    <CalendarDays size={32} className="mx-auto text-[#6B6F94]" />
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Official Timetable is Empty
                    </h2>
                    <p className="text-xs text-[#6B6F94] max-w-md mx-auto">
                      Schedule your first class slot on the left. Once published, entitled
                      students will be automatically divided into capacity-bounded classrooms.
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => {
                    const entryGroups = groups.filter((g) => g.timetableEntryId === entry.id);
                    return (
                      <div
                        key={entry.id}
                        className="learnova-card p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-[#0B1230]">
                                {lvlLabel(entry.classLevelId)} · {subLabel(entry.subjectId)}
                              </span>
                              <span aria-hidden="true" className="text-[#6B6F94]">·</span>
                              <span
                                className={`text-xs font-bold ${
                                  entry.publicationStatus === "PUBLISHED"
                                    ? "text-emerald-700"
                                    : entry.publicationStatus === "CANCELLED"
                                    ? "text-rose-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {entry.publicationStatus}
                              </span>
                              {entry.allocationStatus === "SHORTFALL" && (
                                <>
                                  <span aria-hidden="true" className="text-[#6B6F94]">·</span>
                                  <span className="text-xs font-bold text-rose-700">
                                    SHORTFALL: {entry.shortfallCount} students need another teacher
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                              {entry.dayOfWeek} · {entry.startTime}–{entry.endTime} WAT ({entry.durationMinutes} mins) · {entry.mode} · Max {entry.maxCapacityPerRoom}/room ·{" "}
                              <strong className="text-[#0B1230]">{entry.eligibleStudentCount}</strong> entitled student(s)
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 shrink-0">
                            {entry.publicationStatus === "DRAFT" && (
                              <button
                                disabled={saving}
                                onClick={() =>
                                  postAction(
                                    { action: "PUBLISH_TIMETABLE_ENTRY", id: entry.id },
                                    "Timetable lesson published and groups allocated."
                                  )
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold"
                              >
                                <Send size={12} /> Publish
                              </button>
                            )}
                            {entry.publicationStatus === "PUBLISHED" && (
                              <button
                                disabled={saving}
                                onClick={() =>
                                  postAction(
                                    { action: "RECALCULATE_ALLOCATIONS", id: entry.id },
                                    "Student group allocations recalculated."
                                  )
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                              >
                                <RefreshCw size={12} /> Sync Groups
                              </button>
                            )}
                            {entry.publicationStatus !== "CANCELLED" && (
                              <button
                                disabled={saving}
                                onClick={() =>
                                  postAction(
                                    { action: "CANCEL_TIMETABLE_ENTRY", id: entry.id },
                                    "Timetable lesson cancelled and participants notified."
                                  )
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition"
                              >
                                <Ban size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Allocated Parallel Classroom Groups */}
                        <div className="border-t border-[#E4E1F5] pt-3">
                          <p className="text-xs font-bold text-[#43466E] mb-2 flex items-center gap-1.5">
                            <Users size={13} className="text-[#4F46E5]" />
                            Allocated Classroom Groups ({entryGroups.length})
                          </p>
                          {entryGroups.length === 0 ? (
                            <p className="text-xs text-[#6B6F94]">
                              No classroom groups created yet.
                            </p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-2.5">
                              {entryGroups.map((grp) => (
                                <div
                                  key={grp.id}
                                  className="rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] px-3 py-2.5 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-[#0B1230]">{grp.groupName}</p>
                                    <p className="text-[#6B6F94]">{grp.teacherName}</p>
                                  </div>
                                  <span className="font-extrabold text-[#4F46E5] tabular-nums">
                                    {grp.studentUserIds?.length || 0} / {grp.maxCapacity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
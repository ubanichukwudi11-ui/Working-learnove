"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  RefreshCw,
  Ban,
  Send,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export default function AdminTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                Official WAT Timetable & Automatic Group Allocation
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Official Timetable Builder
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Only School Administrators publish official timetables. The system blocks teacher
                or cohort scheduling overlaps, restricts assignments strictly to approved
                teachers, and automatically splits large classes into capacity-bounded groups.
              </p>
            </div>
            <Link
              href="/admin/classrooms"
              className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold transition shrink-0"
            >
              Classroom Control Centre
            </Link>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-teal-50 text-[#0D9488] border-teal-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading official timetable...
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Creation Form */}
              <form
                onSubmit={handleCreate}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit"
              >
                <h2 className="text-base font-bold text-[#0F1F38] flex items-center gap-2">
                  <Plus size={16} className="text-[#0D9488]" />
                  Schedule Official Lesson
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Class Level
                    </label>
                    <select
                      value={classLevelId}
                      onChange={(e) => {
                        setClassLevelId(e.target.value);
                        setSelectedTeacherIds([]);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    >
                      {classLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setSelectedTeacherIds([]);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Day
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs bg-white"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Start (WAT)
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      End (WAT)
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Teaching Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    >
                      <option value="ONLINE">ONLINE (Live Room)</option>
                      <option value="HYBRID">HYBRID</option>
                      <option value="PHYSICAL">PHYSICAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Room Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Strict Approved Teachers Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
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
                    <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2">
                      {eligibleTeachers.map((ap) => {
                        const checked = selectedTeacherIds.includes(ap.teacherUserId);
                        return (
                          <label
                            key={ap.id}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              checked ? "bg-teal-50 text-[#0D9488]" : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTeacher(ap.teacherUserId)}
                            />
                            <span>{ap.teacherName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={publishOnSave}
                    onChange={(e) => setPublishOnSave(e.target.checked)}
                  />
                  Publish immediately & allocate parallel student groups
                </label>

                <button
                  disabled={saving || selectedTeacherIds.length === 0}
                  className="w-full py-2.5 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#132c52] disabled:opacity-50"
                >
                  {saving ? "Validating & Allocating..." : publishOnSave ? "Publish & Allocate" : "Save Draft"}
                </button>
              </form>

              {/* Official Timetable & Group Allocation Cards */}
              <div className="lg:col-span-2 space-y-4">
                {entries.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-2">
                    <CalendarDays size={32} className="mx-auto text-slate-400" />
                    <h2 className="text-base font-bold text-[#0F1F38]">
                      Official Timetable is Empty
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
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
                        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-[#0B1F3A]">
                                {lvlLabel(entry.classLevelId)} · {subLabel(entry.subjectId)}
                              </span>
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                                  entry.publicationStatus === "PUBLISHED"
                                    ? "bg-teal-50 text-[#0D9488]"
                                    : entry.publicationStatus === "CANCELLED"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {entry.publicationStatus}
                              </span>
                              {entry.allocationStatus === "SHORTFALL" && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700">
                                  SHORTFALL: {entry.shortfallCount} students need another teacher
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 tabular-nums">
                              {entry.dayOfWeek} · {entry.startTime}–{entry.endTime} WAT ({entry.durationMinutes} mins) · {entry.mode} · Max {entry.maxCapacityPerRoom}/room ·{" "}
                              <strong>{entry.eligibleStudentCount}</strong> entitled student(s)
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-semibold"
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                              >
                                <Ban size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Allocated Parallel Classroom Groups */}
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                            <Users size={13} className="text-[#0D9488]" />
                            Allocated Classroom Groups ({entryGroups.length})
                          </p>
                          {entryGroups.length === 0 ? (
                            <p className="text-xs text-slate-400">
                              No classroom groups created yet.
                            </p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-2.5">
                              {entryGroups.map((grp) => (
                                <div
                                  key={grp.id}
                                  className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-[#0B1F3A]">{grp.groupName}</p>
                                    <p className="text-slate-600">{grp.teacherName}</p>
                                  </div>
                                  <span className="font-extrabold text-[#0D9488] tabular-nums">
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
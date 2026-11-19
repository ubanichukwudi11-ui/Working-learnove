"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import {
  Video,
  Users,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Play,
  Square,
} from "lucide-react";

export default function TeacherClassesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [prepareRoom, setPrepareRoom] = useState<any | null>(null);

  // Preparation modal fields
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonObjectives, setLessonObjectives] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [assignmentsText, setAssignmentsText] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/classrooms", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setClassrooms(json.classrooms || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const openPrepModal = (rm: any) => {
    setPrepareRoom(rm);
    setLessonTitle(rm.lessonTitle || `${rm.subjectName} Lesson`);
    setLessonDescription(rm.lessonDescription || "");
    setLessonObjectives(rm.lessonObjectives || "");
    setLessonNotes(rm.lessonNotes || "");
    setAssignmentsText(rm.assignmentsText || "");
    setMaterialTitle("");
    setMaterialUrl("");
  };

  const handleSavePrep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prepareRoom) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PREPARE_CLASSROOM",
          classroomId: prepareRoom.id,
          lessonTitle,
          lessonDescription,
          lessonObjectives,
          lessonNotes,
          assignmentsText,
          addMaterial: materialTitle.trim()
            ? { title: materialTitle.trim(), type: "PDF", url: materialUrl.trim() || undefined }
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to prepare classroom.");
      setFeedback({
        type: "ok",
        text: `${prepareRoom.groupName} marked PREPARED. Students can see objectives while waiting for you to start live.`,
      });
      setPrepareRoom(null);
      await loadClasses();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Preparation failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleStartLive = async (roomId: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_LIVE_CLASSROOM", classroomId: roomId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not start classroom.");
      router.push(`/teacher/live-class/${roomId}`);
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Start live failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleEndLive = async (roomId: string) => {
    setSaving(true);
    try {
      await fetch("/api/lms/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_LIVE_CLASSROOM", classroomId: roomId }),
      });
      await loadClasses();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            eyebrow="Classroom Lifecycle & Official Teaching Schedule"
            title="My Assigned Classrooms & Timetable"
            description="Step 1: Prepare your classroom (notes, objectives, materials) without starting the stream. Step 2: Click Start Live Lesson when ready to admit allocated students."
          />

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <CardSkeleton lines={6} />
          ) : classrooms.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Scheduled Classrooms Assigned"
              description="Teachers do not self-assign timetables. Ensure your subject applications are approved so School Admin can schedule your classroom groups."
              action={{ label: "View My Subject Applications", href: "/teacher/applications" }}
            />
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {classrooms.map((cls) => (
                  <div
                    key={cls.id}
                    className="learnova-card p-6 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {cls.subjectName} · {cls.groupName}
                        </span>
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            cls.status === "LIVE"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : cls.status === "PREPARED"
                              ? "text-indigo-600 dark:text-indigo-400"
                              : cls.status === "CANCELLED"
                              ? "text-rose-700 dark:text-rose-300"
                              : "text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </div>
                      <h2 className="landing-display text-lg font-bold text-[var(--foreground)] mt-1">
                        {cls.classLevelName}
                      </h2>
                      <p className="text-xs text-[var(--foreground-subtle)] mt-1 flex items-center gap-1 tabular-nums">
                        <Clock size={13} className="text-cyan-600 dark:text-cyan-400" />
                        {cls.dayOfWeek} · {cls.startTime}–{cls.endTime} WAT · {cls.mode}
                      </p>
                      <p className="text-sm text-[var(--foreground-muted)] mt-3 font-medium">
                        {cls.lessonTitle}
                      </p>
                      <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                        {cls.materials?.length || 0} material(s) attached
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
                      <div className="flex justify-between text-xs text-[var(--foreground-muted)] tabular-nums">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Users size={14} className="text-indigo-600 dark:text-indigo-400" />{" "}
                          {cls.studentUserIds?.length || 0} / {cls.maxCapacity} Allocated Students
                        </span>
                      </div>

                      {cls.status !== "CANCELLED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPrepModal(cls)}
                            className="flex-1 py-2 rounded-xl border border-[var(--border-strong)] text-[var(--foreground)] text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-[var(--surface-lavender)] transition whitespace-nowrap"
                          >
                            <SlidersHorizontal size={13} />
                            Prepare
                          </button>

                          {cls.status === "LIVE" ? (
                            <>
                              <Link
                                href={`/teacher/live-class/${cls.id}`}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition whitespace-nowrap"
                              >
                                <Video size={13} /> Studio
                              </Link>
                              <button
                                disabled={saving}
                                onClick={() => handleEndLive(cls.id)}
                                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                title="End Lesson"
                              >
                                <Square size={12} />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={saving}
                              onClick={() => handleStartLive(cls.id)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition shadow-sm whitespace-nowrap"
                            >
                              <Play size={13} />
                              Start Live
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Official Weekly Schedule Table */}
              <div className="learnova-card p-6">
                <h2 className="landing-display text-base font-bold text-[var(--foreground)] mb-4">
                  Weekly Teaching Timetable (Africa/Lagos WAT)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface-lavender)] text-[var(--foreground-muted)] text-xs uppercase border-b border-[var(--border)]">
                      <tr>
                        <th className="text-left px-5 py-3.5">Day</th>
                        <th className="text-left px-5 py-3.5">Time (WAT)</th>
                        <th className="text-left px-5 py-3.5">Subject &amp; Group</th>
                        <th className="text-left px-5 py-3.5">Status</th>
                        <th className="text-left px-5 py-3.5">Studio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {classrooms.map((cls) => (
                        <tr key={cls.id} className="hover:bg-[var(--surface-lavender)]/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">{cls.dayOfWeek}</td>
                          <td className="px-5 py-3.5 text-[var(--foreground-muted)] tabular-nums">
                            {cls.startTime} – {cls.endTime} WAT
                          </td>
                          <td className="px-5 py-3.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                            {cls.classLevelName} · {cls.subjectName} ({cls.groupName})
                          </td>
                          <td className="px-5 py-3.5 text-xs font-bold text-[var(--foreground)]">{cls.status}</td>
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/teacher/live-class/${cls.id}`}
                              className="text-xs font-bold text-[var(--foreground)] hover:text-indigo-600 dark:hover:text-indigo-400 underline whitespace-nowrap"
                            >
                              Open Control Room
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Step 1: Prepare Classroom Modal */}
          {prepareRoom && (
            <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSavePrep}
                className="learnova-card rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                    Step 1: Prepare Classroom (Remains PREPARED, Not Live)
                  </p>
                  <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                    {prepareRoom.classLevelName} · {prepareRoom.subjectName} ({prepareRoom.groupName})
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Lesson Topic / Title
                  </label>
                  <input
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Learning Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={lessonObjectives}
                    onChange={(e) => setLessonObjectives(e.target.value)}
                    placeholder="What students will master in this session..."
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Lesson Description &amp; Pre-class Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Shared Lesson Notes
                  </label>
                  <textarea
                    rows={3}
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Classwork / Assignment Prompt
                  </label>
                  <input
                    value={assignmentsText}
                    onChange={(e) => setAssignmentsText(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Attach Material Title (Optional)
                    </label>
                    <input
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder="e.g. Quadratic Worksheet"
                      className="learnova-input w-full px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Resource URL (Optional)
                    </label>
                    <input
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      placeholder="https://..."
                      className="learnova-input w-full px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPrepareRoom(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-strong)] text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                  >
                    {saving ? "Saving Preparation..." : "Save Preparation"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

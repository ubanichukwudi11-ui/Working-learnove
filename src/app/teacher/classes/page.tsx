"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
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
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Classroom Lifecycle & Official Teaching Schedule
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              My Assigned Classrooms &amp; Timetable
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Step 1: Prepare your classroom (notes, objectives, materials) without starting the
              stream. Step 2: Click Start Live Lesson when ready to admit allocated students.
            </p>
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
              Loading your assigned classrooms...
            </div>
          ) : classrooms.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-2">
              <BookOpen size={30} className="mx-auto text-slate-400" />
              <p className="font-bold text-[#0F1F38]">No Scheduled Classrooms Assigned</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Teachers do not self-assign timetables. Ensure your subject applications are
                approved so School Admin can schedule your classroom groups.
              </p>
              <Link
                href="/teacher/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold"
              >
                View My Subject Applications
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {classrooms.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0D9488] uppercase">
                          {cls.subjectName} · {cls.groupName}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                            cls.status === "LIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : cls.status === "PREPARED"
                              ? "bg-teal-50 text-[#0D9488]"
                              : cls.status === "CANCELLED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#0B1F3A] mt-1">
                        {cls.classLevelName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 tabular-nums">
                        <Clock size={13} />
                        {cls.dayOfWeek} · {cls.startTime}–{cls.endTime} WAT · {cls.mode}
                      </p>
                      <p className="text-sm text-slate-700 mt-3 font-medium">
                        {cls.lessonTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {cls.materials?.length || 0} material(s) attached
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      <div className="flex justify-between text-xs text-slate-600 tabular-nums">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Users size={14} className="text-[#0D9488]" />{" "}
                          {cls.studentUserIds?.length || 0} / {cls.maxCapacity} Allocated Students
                        </span>
                      </div>

                      {cls.status !== "CANCELLED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPrepModal(cls)}
                            className="flex-1 py-2 rounded-xl border border-slate-200 text-[#0B1F3A] text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-slate-50"
                          >
                            <SlidersHorizontal size={13} />
                            Prepare
                          </button>

                          {cls.status === "LIVE" ? (
                            <>
                              <Link
                                href={`/teacher/live-class/${cls.id}`}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                              >
                                <Video size={13} /> Studio
                              </Link>
                              <button
                                disabled={saving}
                                onClick={() => handleEndLive(cls.id)}
                                className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold inline-flex items-center justify-center"
                                title="End Lesson"
                              >
                                <Square size={12} />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={saving}
                              onClick={() => handleStartLive(cls.id)}
                              className="flex-1 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-bold text-[#0B1F3A] mb-4">
                  Weekly Teaching Timetable (Africa/Lagos WAT)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Day</th>
                        <th className="text-left px-4 py-3">Time (WAT)</th>
                        <th className="text-left px-4 py-3">Subject & Group</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Studio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classrooms.map((cls) => (
                        <tr key={cls.id}>
                          <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{cls.dayOfWeek}</td>
                          <td className="px-4 py-3 text-slate-600 tabular-nums">
                            {cls.startTime} – {cls.endTime} WAT
                          </td>
                          <td className="px-4 py-3 text-[#0D9488] font-semibold">
                            {cls.classLevelName} · {cls.subjectName} ({cls.groupName})
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">{cls.status}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/teacher/live-class/${cls.id}`}
                              className="text-xs font-bold text-[#0B1F3A] hover:text-[#0D9488] underline"
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
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSavePrep}
                className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-[#0D9488]">
                    Step 1: Prepare Classroom (Remains PREPARED, Not Live)
                  </p>
                  <h2 className="text-lg font-extrabold text-[#0B1F3A]">
                    {prepareRoom.classLevelName} · {prepareRoom.subjectName} ({prepareRoom.groupName})
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lesson Topic / Title
                  </label>
                  <input
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Learning Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={lessonObjectives}
                    onChange={(e) => setLessonObjectives(e.target.value)}
                    placeholder="What students will master in this session..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lesson Description & Pre-class Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Shared Lesson Notes
                  </label>
                  <textarea
                    rows={3}
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Classwork / Assignment Prompt
                  </label>
                  <input
                    value={assignmentsText}
                    onChange={(e) => setAssignmentsText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Attach Material Title (Optional)
                    </label>
                    <input
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder="e.g. Quadratic Worksheet"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Resource URL (Optional)
                    </label>
                    <input
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPrepareRoom(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700"
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

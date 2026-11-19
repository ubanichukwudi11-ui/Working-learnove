"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import { Check, CalendarCheck, AlertCircle, Users } from "lucide-react";

type AttStatus = "PRESENT" | "LATE" | "ABSENT";

export default function TeacherAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AttStatus>>({});

  const loadAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/classrooms", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const rooms = json.classrooms || [];
      setClassrooms(rooms);
      setStudentsMap(json.studentsMap || {});
      setAttendanceRecords(json.attendanceRecords || []);
      if (!selectedRoomId && rooms.length > 0) {
        setSelectedRoomId(rooms[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const activeRoom = classrooms.find((c) => c.id === selectedRoomId) || null;

  useEffect(() => {
    if (!activeRoom) return;
    const init: Record<string, AttStatus> = {};
    for (const sid of activeRoom.studentUserIds || []) {
      const existing = attendanceRecords.find(
        (a) => a.classroomId === activeRoom.id && a.studentUserId === sid
      );
      init[sid] = (existing?.status as AttStatus) || "PRESENT";
    }
    setStatuses(init);
  }, [selectedRoomId, activeRoom, attendanceRecords]);

  const handleSave = async () => {
    if (!activeRoom) return;
    setSaving(true);
    setSavedMsg("");
    setError("");
    try {
      const entries = (activeRoom.studentUserIds || []).map((sid: string) => ({
        studentUserId: sid,
        status: statuses[sid] || "PRESENT",
      }));
      const res = await fetch("/api/lms/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_ATTENDANCE",
          classroomId: activeRoom.id,
          entries,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save register.");
      setSavedMsg("Attendance register saved to database.");
      await loadAttendance();
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const studentIds: string[] = activeRoom?.studentUserIds || [];
  const presentCount = Object.values(statuses).filter((v) => v === "PRESENT").length;

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            eyebrow="Official Classroom Register"
            title="Class Attendance Register"
            description="Record daily student presence, lateness, and absences per allocated classroom group."
            actions={
              activeRoom && studentIds.length > 0 ? (
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-[#22D3EE] tabular-nums">
                    {presentCount}/{studentIds.length} Present
                  </span>
                  <button
                    disabled={saving}
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {savedMsg ? <Check size={15} /> : <CalendarCheck size={15} />}
                    {saving ? "Saving..." : "Save Attendance"}
                  </button>
                </div>
              ) : undefined
            }
          />

          {savedMsg && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {savedMsg}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading ? (
            <CardSkeleton lines={5} />
          ) : classrooms.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No classrooms assigned yet"
              description="Attendance registers will appear once School Admin schedules your classroom groups."
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-bold text-[var(--foreground-muted)]">
                  Select Classroom Group:
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="learnova-input w-full sm:w-auto min-w-[260px] px-3.5 py-2 text-sm font-semibold"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classLevelName} · {c.subjectName} ({c.groupName})
                    </option>
                  ))}
                </select>
              </div>

              {studentIds.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students allocated to this group"
                  description="No entitled students are allocated to this classroom group yet."
                />
              ) : (
                <div className="learnova-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--surface-lavender)] text-[var(--foreground-muted)] text-xs uppercase border-b border-[var(--border)]">
                        <tr>
                          <th className="text-left px-6 py-3">Student</th>
                          <th className="text-left px-6 py-3">Group</th>
                          <th className="text-left px-6 py-3">Mark Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {studentIds.map((sid) => {
                          const st = studentsMap[sid];
                          return (
                            <tr key={sid} className="hover:bg-[var(--surface-lavender)]/60 transition">
                              <td className="px-6 py-4">
                                <p className="font-bold text-[var(--foreground)]">
                                  {st?.fullName || sid}
                                </p>
                                <p className="text-xs text-[var(--foreground-subtle)]">{st?.email || ""}</p>
                              </td>
                              <td className="px-6 py-4 text-[var(--foreground-muted)] font-semibold">
                                {activeRoom.groupName}
                              </td>
                              <td className="px-6 py-4">
                                <div className="inline-flex gap-1.5">
                                  {(["PRESENT", "LATE", "ABSENT"] as AttStatus[]).map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() =>
                                        setStatuses((prev) => ({ ...prev, [sid]: opt }))
                                      }
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                        statuses[sid] === opt
                                          ? opt === "PRESENT"
                                            ? "bg-emerald-600 text-white"
                                            : opt === "LATE"
                                            ? "bg-amber-600 text-white"
                                            : "bg-rose-600 text-white"
                                          : "bg-[var(--surface-lavender)] border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-subtle)]"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

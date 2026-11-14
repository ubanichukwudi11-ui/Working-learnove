"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { Check, CalendarCheck, AlertCircle } from "lucide-react";

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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Official Classroom Register
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Class Attendance Register
              </h1>
            </div>

            {activeRoom && studentIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#0B1F3A] tabular-nums">
                  {presentCount}/{studentIds.length} Present
                </span>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {savedMsg ? <Check size={15} /> : <CalendarCheck size={15} />}
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            )}
          </div>

          {savedMsg && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-semibold text-[#0D9488]">
              {savedMsg}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading classroom rosters...
            </div>
          ) : classrooms.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-sm text-slate-500">
              No classrooms assigned yet. Attendance registers will appear once School Admin
              schedules your classroom groups.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600">Select Classroom Group:</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white font-semibold"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classLevelName} · {c.subjectName} ({c.groupName})
                    </option>
                  ))}
                </select>
              </div>

              {studentIds.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-xs text-slate-500">
                  No entitled students are allocated to this group yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                        <tr>
                          <th className="text-left px-6 py-3">Student</th>
                          <th className="text-left px-6 py-3">Group</th>
                          <th className="text-left px-6 py-3">Mark Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentIds.map((sid) => {
                          const st = studentsMap[sid];
                          return (
                            <tr key={sid}>
                              <td className="px-6 py-4">
                                <p className="font-bold text-[#0B1F3A]">
                                  {st?.fullName || sid}
                                </p>
                                <p className="text-xs text-slate-500">{st?.email || ""}</p>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-semibold">
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
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        statuses[sid] === opt
                                          ? opt === "PRESENT"
                                            ? "bg-[#0D9488] text-white"
                                            : opt === "LATE"
                                            ? "bg-[#D97706] text-white"
                                            : "bg-red-600 text-white"
                                          : "bg-[#F7F8FA] text-slate-600 hover:bg-slate-200"
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

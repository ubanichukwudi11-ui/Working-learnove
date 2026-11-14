"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  MonitorCheck,
  Users,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  Ban,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminClassroomsControlPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Operational modal actions
  const [moveStudentId, setMoveStudentId] = useState("");
  const [moveTargetRoomId, setMoveTargetRoomId] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newCapacity, setNewCapacity] = useState("50");

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/classrooms", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setClassrooms(json.classrooms || []);
      setAttendanceRecords(json.attendanceRecords || []);
      setApprovedTeachers(json.approvedTeachers || []);
      setStudents(json.students || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    const t = setInterval(loadRooms, 15000);
    return () => clearInterval(t);
  }, [loadRooms]);

  const selectedRoom = classrooms.find((c) => c.id === selectedRoomId) || null;

  useEffect(() => {
    if (selectedRoom) {
      setNewCapacity(String(selectedRoom.maxCapacity || 50));
      setNewTeacherId(selectedRoom.teacherUserId || "");
      setMoveStudentId(selectedRoom.studentUserIds?.[0] || "");
      const sibling = classrooms.find(
        (c) =>
          c.timetableEntryId === selectedRoom.timetableEntryId && c.id !== selectedRoom.id
      );
      setMoveTargetRoomId(sibling?.id || "");
    }
  }, [selectedRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const postAction = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed.");
      setFeedback({ type: "ok", text: okMessage });
      await loadRooms();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to update classroom." });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PREPARED":
        return "bg-teal-50 text-[#0D9488] border-teal-200";
      case "ENDED":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  const liveCount = classrooms.filter((c) => c.status === "LIVE").length;
  const preparedCount = classrooms.filter((c) => c.status === "PREPARED").length;
  const scheduledCount = classrooms.filter((c) => c.status === "SCHEDULED").length;

  const eligibleTeachersForSelected = selectedRoom
    ? approvedTeachers.filter(
        (a) =>
          a.subjectId === selectedRoom.subjectId &&
          a.classLevelId === selectedRoom.classLevelId
      )
    : [];

  const siblingRooms = selectedRoom
    ? classrooms.filter(
        (c) =>
          c.timetableEntryId === selectedRoom.timetableEntryId &&
          c.id !== selectedRoom.id &&
          c.status !== "CANCELLED"
      )
    : [];

  const studentName = (uid: string) =>
    students.find((s) => s.id === uid)?.fullName || uid;

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                Operational Monitoring & Group Allocation
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Classroom Control Centre
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Monitor classroom preparation, live status, room capacities, attendance counts,
                and rebalance students or approved teachers across parallel groups. Private live
                teacher/student audio & video streams are restricted from admin intrusion.
              </p>
            </div>
            <Link
              href="/admin/timetable"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold transition shrink-0"
            >
              Manage Official Timetable
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

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold">Total Allocated Rooms</p>
              <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums">
                {classrooms.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Radio size={13} className="text-emerald-600" /> Live Now
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                {liveCount}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold">Prepared by Teacher</p>
              <p className="text-2xl font-extrabold text-[#0D9488] mt-1 tabular-nums">
                {preparedCount}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold">Scheduled / Waiting</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">
                {scheduledCount}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading allocated classrooms...
            </div>
          ) : classrooms.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <MonitorCheck size={32} className="mx-auto text-slate-400" />
              <h2 className="text-base font-bold text-[#0F1F38]">
                No Classrooms Allocated Yet
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Publish a lesson in the Official Timetable Builder to automatically divide
                enrolled students into capacity-bounded groups and generate isolated classrooms.
              </p>
              <Link
                href="/admin/timetable"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold"
              >
                Go to Timetable Builder
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Classroom List */}
              <div className="lg:col-span-2 space-y-3">
                {classrooms.map((rm) => {
                  const roomAtt = attendanceRecords.filter((a) => a.classroomId === rm.id);
                  const presentCount = roomAtt.filter((a) => a.status === "PRESENT").length;
                  return (
                    <div
                      key={rm.id}
                      onClick={() => setSelectedRoomId(rm.id)}
                      className={`bg-white border rounded-2xl p-5 cursor-pointer transition ${
                        selectedRoomId === rm.id
                          ? "border-[#0D9488] ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#0B1F3A]">
                              {rm.classLevelName} · {rm.subjectName}
                            </h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0B1F3A]">
                              {rm.groupName}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded border ${statusBadge(
                                rm.status
                              )}`}
                            >
                              {rm.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Teacher: <strong className="text-slate-700">{rm.teacherName}</strong> ·{" "}
                            {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT · {rm.mode}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-sm font-extrabold text-[#0F1F38] tabular-nums">
                            {rm.studentUserIds?.length || 0} / {rm.maxCapacity} students
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            Attendance recorded: {presentCount} present
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inspector & Operational Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 h-fit space-y-5">
                {!selectedRoom ? (
                  <div className="text-center py-10 text-sm text-slate-500">
                    Select any allocated classroom group to inspect its roster, balance students,
                    reassign its approved teacher, or adjust capacity.
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0D9488]">
                        {selectedRoom.groupName} Operational Controls
                      </p>
                      <h3 className="text-lg font-extrabold text-[#0B1F3A] mt-0.5">
                        {selectedRoom.classLevelName} · {selectedRoom.subjectName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Title: {selectedRoom.lessonTitle}
                      </p>
                    </div>

                    {/* Roster */}
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                        <Users size={14} className="text-[#0D9488]" />
                        Allocated Students ({selectedRoom.studentUserIds?.length || 0})
                      </p>
                      {(selectedRoom.studentUserIds || []).length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No entitled students currently placed in this group.
                        </p>
                      ) : (
                        <ul className="max-h-36 overflow-y-auto space-y-1 text-xs text-slate-700">
                          {selectedRoom.studentUserIds.map((uid: string) => (
                            <li
                              key={uid}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 flex items-center justify-between"
                            >
                              <span>{studentName(uid)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Reassign Student Between Parallel Groups */}
                    {siblingRooms.length > 0 && selectedRoom.studentUserIds?.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ArrowLeftRight size={14} className="text-[#0D9488]" />
                          Move Student to Another Group
                        </p>
                        <select
                          value={moveStudentId}
                          onChange={(e) => setMoveStudentId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                        >
                          {selectedRoom.studentUserIds.map((uid: string) => (
                            <option key={uid} value={uid}>
                              {studentName(uid)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={moveTargetRoomId}
                          onChange={(e) => setMoveTargetRoomId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                        >
                          {siblingRooms.map((sib) => (
                            <option key={sib.id} value={sib.id}>
                              {sib.groupName} ({sib.teacherName} · {sib.studentUserIds.length}/
                              {sib.maxCapacity})
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={saving || !moveStudentId || !moveTargetRoomId}
                          onClick={() =>
                            postAction(
                              {
                                action: "REASSIGN_STUDENT",
                                studentUserId: moveStudentId,
                                fromClassroomId: selectedRoom.id,
                                toClassroomId: moveTargetRoomId,
                              },
                              "Student moved to new classroom group."
                            )
                          }
                          className="w-full py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#132c52]"
                        >
                          Reassign Student
                        </button>
                      </div>
                    )}

                    {/* Reassign Approved Teacher */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        Reassign Approved Teacher
                      </p>
                      <select
                        value={newTeacherId}
                        onChange={(e) => setNewTeacherId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                      >
                        {eligibleTeachersForSelected.map((ap) => (
                          <option key={ap.teacherUserId} value={ap.teacherUserId}>
                            {ap.teacherName} (Approved)
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={saving || !newTeacherId}
                        onClick={() =>
                          postAction(
                            {
                              action: "REASSIGN_GROUP_TEACHER",
                              classroomId: selectedRoom.id,
                              newTeacherUserId: newTeacherId,
                            },
                            "Approved teacher assigned to group."
                          )
                        }
                        className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                      >
                        Update Teacher
                      </button>
                    </div>

                    {/* Adjust Capacity & Cancel */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} className="text-slate-500" />
                        <input
                          type="number"
                          min={1}
                          value={newCapacity}
                          onChange={(e) => setNewCapacity(e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs tabular-nums"
                        />
                        <button
                          disabled={saving}
                          onClick={() =>
                            postAction(
                              {
                                action: "UPDATE_CAPACITY",
                                classroomId: selectedRoom.id,
                                maxCapacity: Number(newCapacity),
                              },
                              "Room capacity updated."
                            )
                          }
                          className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                        >
                          Save Capacity
                        </button>
                      </div>

                      {selectedRoom.status !== "CANCELLED" && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            postAction(
                              {
                                action: "CANCEL_CLASSROOM",
                                classroomId: selectedRoom.id,
                                reason: "Cancelled from Classroom Control Centre",
                              },
                              `${selectedRoom.groupName} marked cancelled and participants notified.`
                            )
                          }
                          className="w-full py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 flex items-center justify-center gap-1.5"
                        >
                          <Ban size={13} />
                          Cancel Classroom Session
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

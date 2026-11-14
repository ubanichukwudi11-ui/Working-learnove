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

  const statusTextClass = (status: string) => {
    switch (status) {
      case "LIVE":
        return "text-emerald-700";
      case "PREPARED":
        return "text-[#4F46E5]";
      case "ENDED":
        return "text-[#6B6F94]";
      case "CANCELLED":
        return "text-rose-700";
      default:
        return "text-amber-700";
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
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Operational Monitoring &amp; Group Allocation
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Classroom Control Centre
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Monitor classroom preparation, live status, room capacities, attendance counts,
                and rebalance students or approved teachers across parallel groups. Private live
                teacher/student audio &amp; video streams are restricted from admin intrusion.
              </p>
            </div>
            <Link
              href="/admin/timetable"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shrink-0 shadow-xs"
            >
              Manage Official Timetable
            </Link>
          </div>

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

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="learnova-card p-4">
              <p className="text-xs text-[#6B6F94] font-semibold">Total Allocated Rooms</p>
              <p className="text-2xl font-extrabold text-[#0B1230] mt-1 tabular-nums">
                {classrooms.length}
              </p>
            </div>
            <div className="learnova-card p-4">
              <p className="text-xs text-[#6B6F94] font-semibold flex items-center gap-1">
                <Radio size={13} className="text-emerald-600" /> Live Now
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                {liveCount}
              </p>
            </div>
            <div className="learnova-card p-4">
              <p className="text-xs text-[#6B6F94] font-semibold">Prepared by Teacher</p>
              <p className="text-2xl font-extrabold text-[#4F46E5] mt-1 tabular-nums">
                {preparedCount}
              </p>
            </div>
            <div className="learnova-card p-4">
              <p className="text-xs text-[#6B6F94] font-semibold">Scheduled / Waiting</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">
                {scheduledCount}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading allocated classrooms...
            </div>
          ) : classrooms.length === 0 ? (
            <div className="learnova-card border-dashed p-12 text-center space-y-3">
              <MonitorCheck size={32} className="mx-auto text-[#6B6F94]" />
              <h2 className="text-base font-bold text-[#0B1230]">
                No Classrooms Allocated Yet
              </h2>
              <p className="text-sm text-[#6B6F94] max-w-md mx-auto">
                Publish a lesson in the Official Timetable Builder to automatically divide
                enrolled students into capacity-bounded groups and generate isolated classrooms.
              </p>
              <Link
                href="/admin/timetable"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-sm font-bold"
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
                      className={`learnova-card p-5 cursor-pointer transition ${
                        selectedRoomId === rm.id
                          ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/15"
                          : "hover:border-[#DCD7F5]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#0B1230]">
                              {rm.classLevelName} · {rm.subjectName}
                            </h3>
                            <span className="text-xs font-bold text-[#4F46E5]">
                              {rm.groupName}
                            </span>
                            <span aria-hidden="true" className="text-[#6B6F94]">·</span>
                            <span className={`text-xs font-bold ${statusTextClass(rm.status)}`}>
                              {rm.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6F94] mt-1">
                            Teacher: <strong className="text-[#0B1230]">{rm.teacherName}</strong> ·{" "}
                            {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT · {rm.mode}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-sm font-extrabold text-[#0B1230] tabular-nums">
                            {rm.studentUserIds?.length || 0} / {rm.maxCapacity} students
                          </p>
                          <p className="text-xs text-[#6B6F94] tabular-nums">
                            Attendance recorded: {presentCount} present
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inspector & Operational Actions */}
              <div className="learnova-card p-5 h-fit space-y-5">
                {!selectedRoom ? (
                  <div className="text-center py-10 text-sm text-[#6B6F94]">
                    Select any allocated classroom group to inspect its roster, balance students,
                    reassign its approved teacher, or adjust capacity.
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase text-[#4F46E5]">
                        {selectedRoom.groupName} Operational Controls
                      </p>
                      <h3 className="text-lg font-extrabold text-[#0B1230] mt-0.5">
                        {selectedRoom.classLevelName} · {selectedRoom.subjectName}
                      </h3>
                      <p className="text-xs text-[#6B6F94] mt-1">
                        Title: {selectedRoom.lessonTitle}
                      </p>
                    </div>

                    {/* Roster */}
                    <div className="border-t border-[#E4E1F5] pt-4">
                      <p className="text-xs font-bold text-[#43466E] flex items-center gap-1.5 mb-2">
                        <Users size={14} className="text-[#4F46E5]" />
                        Allocated Students ({selectedRoom.studentUserIds?.length || 0})
                      </p>
                      {(selectedRoom.studentUserIds || []).length === 0 ? (
                        <p className="text-xs text-[#6B6F94]">
                          No entitled students currently placed in this group.
                        </p>
                      ) : (
                        <ul className="max-h-36 overflow-y-auto space-y-1 text-xs text-[#0B1230]">
                          {selectedRoom.studentUserIds.map((uid: string) => (
                            <li
                              key={uid}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] border border-[#E4E1F5] flex items-center justify-between"
                            >
                              <span>{studentName(uid)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Reassign Student Between Parallel Groups */}
                    {siblingRooms.length > 0 && selectedRoom.studentUserIds?.length > 0 && (
                      <div className="border-t border-[#E4E1F5] pt-4 space-y-2">
                        <p className="text-xs font-bold text-[#43466E] flex items-center gap-1.5">
                          <ArrowLeftRight size={14} className="text-[#4F46E5]" />
                          Move Student to Another Group
                        </p>
                        <select
                          value={moveStudentId}
                          onChange={(e) => setMoveStudentId(e.target.value)}
                          className="learnova-input text-xs py-2"
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
                          className="learnova-input text-xs py-2"
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
                          className="w-full py-2 rounded-xl bg-[#0B1230] hover:bg-[#151A44] text-white text-xs font-semibold transition"
                        >
                          Reassign Student
                        </button>
                      </div>
                    )}

                    {/* Reassign Approved Teacher */}
                    <div className="border-t border-[#E4E1F5] pt-4 space-y-2">
                      <p className="text-xs font-bold text-[#43466E]">
                        Reassign Approved Teacher
                      </p>
                      <select
                        value={newTeacherId}
                        onChange={(e) => setNewTeacherId(e.target.value)}
                        className="learnova-input text-xs py-2"
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
                        className="w-full py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                      >
                        Update Teacher
                      </button>
                    </div>

                    {/* Adjust Capacity & Cancel */}
                    <div className="border-t border-[#E4E1F5] pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} className="text-[#6B6F94]" />
                        <input
                          type="number"
                          min={1}
                          value={newCapacity}
                          onChange={(e) => setNewCapacity(e.target.value)}
                          className="w-24 learnova-input text-xs py-1.5 tabular-nums"
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
                          className="flex-1 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
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
                          className="w-full py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 flex items-center justify-center gap-1.5 transition"
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

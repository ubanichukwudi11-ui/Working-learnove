"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  FileBadge2,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  Clock,
  Award,
  Users,
  PlaySquare,
} from "lucide-react";

export default function TeacherDashboard() {
  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <TeacherWorkspace />
    </ProtectedRoute>
  );
}

function TeacherWorkspace() {
  const { user } = useAuth();
  const displayName = user?.fullName || "Educator";

  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);

  const loadWorkspace = useCallback(async () => {
    try {
      const [roomRes, appRes] = await Promise.all([
        fetch("/api/lms/classrooms", { cache: "no-store" }),
        fetch("/api/lms/teacher-applications", { cache: "no-store" }),
      ]);
      const roomJson = roomRes.ok ? await roomRes.json() : {};
      const appJson = appRes.ok ? await appRes.json() : {};

      setClassrooms(roomJson.classrooms || []);
      setAttendanceCount((roomJson.attendanceRecords || []).length);
      setApplications(appJson.applications || []);
      setApprovals((appJson.approvals || []).filter((a: any) => a.status === "APPROVED"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const totalStudents = classrooms.reduce(
    (sum, c) => sum + (c.studentUserIds?.length || 0),
    0
  );
  const liveRooms = classrooms.filter((c) => c.status === "LIVE");
  const pendingApps = applications.filter(
    (a) => a.status === "PENDING_REVIEW" || a.status === "RESUBMISSION_REQUIRED"
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              Educator Workspace · Africa/Lagos (WAT)
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Good day, {displayName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Manage your subject authorizations, prepare allocated classroom groups before
              going live, upload topic video lessons, and save official attendance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
            >
              <Video size={15} />
              My Classrooms ({classrooms.length})
            </Link>
            <Link
              href="/teacher/videos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
            >
              <PlaySquare size={15} />
              Video Lessons
            </Link>
            <Link
              href="/teacher/applications"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
            >
              <FileBadge2 size={15} />
              Subject Applications
            </Link>
          </div>
        </div>

        {/* Pending Approval Banner */}
        {pendingApps.length > 0 && approvals.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Application Pending School Admin Review
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                You have {pendingApps.length} subject application(s) under review. Once approved,
                School Admin can allocate you to official timetable classrooms.
              </p>
            </div>
            <Link
              href="/teacher/applications"
              className="text-xs font-bold text-amber-900 underline shrink-0"
            >
              Inspect Status →
            </Link>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
            Loading your teaching workspace...
          </div>
        ) : (
          <>
            {/* Real KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Approved Subjects</span>
                  <Award size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {approvals.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Subject-level authorizations</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Assigned Classrooms</span>
                  <BookOpen size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {classrooms.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {liveRooms.length} live now
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Allocated Students</span>
                  <Users size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {totalStudents}
                </p>
                <p className="text-xs text-slate-500 mt-1">Across assigned groups</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Attendance Entries</span>
                  <CalendarCheck size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {attendanceCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">Recorded session logs</p>
              </div>
            </div>

            {/* Assigned Classroom Groups */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Your Assigned Classroom Groups
                </h2>
                <Link
                  href="/teacher/classes"
                  className="text-xs font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                >
                  Prepare & Launch
                  <ArrowRight size={13} />
                </Link>
              </div>

              {classrooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
                  <BookOpen size={28} className="mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-[#0F1F38]">
                    No Assigned Classrooms Yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {approvals.length === 0
                      ? "Submit a subject teaching application so School Admin can approve you and place you on the official timetable."
                      : "You are approved! Once School Admin schedules and publishes your lessons on the official timetable, your classroom groups will appear here."}
                  </p>
                  <Link
                    href="/teacher/applications"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold"
                  >
                    Manage Subject Applications
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {classrooms.map((rm) => (
                    <div
                      key={rm.id}
                      className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0D9488]">
                            {rm.classLevelName} · {rm.subjectName}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0B1F3A]">
                            {rm.groupName} · {rm.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#0B1F3A] mt-1">
                          {rm.lessonTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 tabular-nums">
                          <Clock size={12} />
                          {rm.dayOfWeek} · {rm.startTime}–{rm.endTime} WAT ·{" "}
                          {rm.studentUserIds?.length || 0}/{rm.maxCapacity} students
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/classes?prepare=${rm.id}`}
                          className="flex-1 py-2 rounded-xl border border-slate-300 bg-white text-[#0B1F3A] text-xs font-bold text-center hover:bg-slate-50"
                        >
                          Prepare Room
                        </Link>
                        <Link
                          href={`/teacher/live-class/${rm.id}`}
                          className="flex-1 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                        >
                          <Video size={13} />
                          Open Classroom
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { DashboardSkeleton, EmptyState, PageHeader, StatCard } from "@/components/ui";
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
  FileText,
  ClipboardList,
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
        <PageHeader
          kicker="Educator Workspace · Africa/Lagos (WAT)"
          title={`Good day, ${displayName}`}
          description="Manage your subject authorizations, prepare allocated classroom groups, publish topic video lessons, and record official attendance."
          actions={
            <>
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition shadow-sm whitespace-nowrap"
              >
                <Video size={15} />
                My Classrooms ({classrooms.length})
              </Link>
              <Link
                href="/teacher/videos"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
              >
                <PlaySquare size={15} />
                Video Lessons
              </Link>
              <Link
                href="/teacher/applications"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
              >
                <FileBadge2 size={15} />
                Applications
              </Link>
            </>
          }
        />

        {/* Pending Approval Banner */}
        {pendingApps.length > 0 && approvals.length === 0 && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Application Pending School Admin Review
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/80 mt-0.5">
                You have {pendingApps.length} subject application(s) under review. Once approved,
                School Admin can allocate you to official timetable classrooms.
              </p>
            </div>
            <Link
              href="/teacher/applications"
              className="text-xs font-bold text-amber-900 dark:text-amber-200 underline shrink-0"
            >
              Inspect Status →
            </Link>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Coordinated KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Approved Subjects"
                value={approvals.length}
                sublabel="Subject authorizations"
                icon={Award}
                tone="learning"
                href="/teacher/applications"
              />
              <StatCard
                label="Assigned Classrooms"
                value={classrooms.length}
                sublabel={`${liveRooms.length} live right now`}
                icon={BookOpen}
                tone="timetable"
                href="/teacher/classes"
              />
              <StatCard
                label="Allocated Students"
                value={totalStudents}
                sublabel="Across your cohorts"
                icon={Users}
                tone="assignments"
                href="/teacher/students"
              />
              <StatCard
                label="Attendance Logs"
                value={attendanceCount}
                sublabel="Recorded WAT sessions"
                icon={CalendarCheck}
                tone="attendance"
                href="/teacher/attendance"
              />
            </div>

            {/* Quick Teaching Studio Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/teacher/notes"
                className="learnova-card p-4 hover:border-[var(--border-strong)] transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center shrink-0">
                  <FileText size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">Lesson Studio</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] truncate">Draft &amp; publish notes</p>
                </div>
              </Link>
              <Link
                href="/teacher/videos"
                className="learnova-card p-4 hover:border-[var(--border-strong)] transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/12 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center shrink-0">
                  <PlaySquare size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">Video Lessons</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] truncate">Upload topic clips</p>
                </div>
              </Link>
              <Link
                href="/teacher/assignments"
                className="learnova-card p-4 hover:border-[var(--border-strong)] transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/12 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <ClipboardList size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">Assignments</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] truncate">Create tasks &amp; tasks</p>
                </div>
              </Link>
              <Link
                href="/teacher/attendance"
                className="learnova-card p-4 hover:border-[var(--border-strong)] transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CalendarCheck size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">Attendance</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] truncate">Log class roll call</p>
                </div>
              </Link>
            </div>

            {/* Assigned Classroom Groups */}
            <div className="learnova-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                  Your Assigned Classroom Groups
                </h2>
                <Link
                  href="/teacher/classes"
                  className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline inline-flex items-center gap-1"
                >
                  Prepare &amp; Launch
                  <ArrowRight size={13} />
                </Link>
              </div>

              {classrooms.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Assigned Classrooms Yet"
                  description={
                    approvals.length === 0
                      ? "Submit a subject teaching application so School Admin can approve you and place you on the official timetable."
                      : "You are approved! Once School Admin schedules and publishes your lessons on the official timetable, your classroom groups will appear here."
                  }
                  action={
                    <Link
                      href="/teacher/applications"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-semibold transition shadow-sm"
                    >
                      Manage Subject Applications
                    </Link>
                  }
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {classrooms.map((rm) => (
                    <div
                      key={rm.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
                            {rm.classLevelName} · {rm.subjectName}
                          </span>
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            {rm.groupName} · {rm.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--foreground)] mt-1">
                          {rm.lessonTitle}
                        </h3>
                        <p className="text-xs text-[var(--foreground-subtle)] mt-1 flex items-center gap-1 tabular-nums">
                          <Clock size={12} />
                          {rm.dayOfWeek} · {rm.startTime}–{rm.endTime} WAT ·{" "}
                          {rm.studentUserIds?.length || 0}/{rm.maxCapacity} students
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/classes?prepare=${rm.id}`}
                          className="flex-1 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-bold text-center hover:bg-[var(--surface-subtle)] transition"
                        >
                          Prepare Room
                        </Link>
                        <Link
                          href={`/teacher/live-class/${rm.id}`}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 transition shadow-sm"
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
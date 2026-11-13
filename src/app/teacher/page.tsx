"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  CURRENT_ACADEMIC_TERM,
  TEACHER_CLASSES,
  TEACHER_STUDENTS,
  WEEKLY_TIMETABLE,
} from "@/lib/nigerianCurriculum";
import {
  Video,
  ClipboardList,
  FileText,
  CalendarCheck,
  Users,
  BookOpen,
  ArrowRight,
  Clock,
  AlertCircle,
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

  const metrics = [
    { label: "Assigned Cohorts", value: "3", detail: "117 total students", icon: BookOpen },
    { label: "Pending Scripts", value: "19", detail: "Needs grading", icon: ClipboardList },
    { label: "Weekly Attendance", value: "94%", detail: "Across SSS 2 & 3", icon: CalendarCheck },
    { label: "Students Flagged", value: "2", detail: "Below 80% attendance", icon: AlertCircle },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header + Primary Classroom Launch Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM} · Educator Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Good day, {displayName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your cohorts, launch live classes, mark scripts, and monitor student attendance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/teacher/live-class/math-001"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
            >
              <Video size={15} />
              Launch Live Classroom
            </Link>
            <Link
              href="/teacher/assignments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap"
            >
              <ClipboardList size={15} />
              Grade Submissions
            </Link>
          </div>
        </div>

        {/* Key Teaching KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{m.label}</span>
                  <Icon size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {m.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{m.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Operational Task Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/teacher/live-class/math-001"
            className="rounded-2xl border border-slate-200 bg-[#0B1F3A] text-white p-4 hover:bg-[#143258] transition"
          >
            <Video size={18} className="text-[#F59E0B] mb-2" />
            <p className="text-sm font-bold">Start Live Class</p>
            <p className="text-xs text-slate-300 mt-0.5">Open Teacher Control Room</p>
          </Link>

          <Link
            href="/teacher/notes"
            className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#0D9488] transition"
          >
            <FileText size={18} className="text-[#0D9488] mb-2" />
            <p className="text-sm font-bold text-[#0B1F3A]">Publish Lesson Notes</p>
            <p className="text-xs text-slate-500 mt-0.5">Share term guides &amp; PDFs</p>
          </Link>

          <Link
            href="/teacher/assignments"
            className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#0D9488] transition"
          >
            <ClipboardList size={18} className="text-[#D97706] mb-2" />
            <p className="text-sm font-bold text-[#0B1F3A]">Create Assignment</p>
            <p className="text-xs text-slate-500 mt-0.5">Set homework or CBT drill</p>
          </Link>

          <Link
            href="/teacher/attendance"
            className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#0D9488] transition"
          >
            <CalendarCheck size={18} className="text-[#0B1F3A] mb-2" />
            <p className="text-sm font-bold text-[#0B1F3A]">Take Attendance</p>
            <p className="text-xs text-slate-500 mt-0.5">Update Term 2 register</p>
          </Link>
        </div>

        {/* Two-column Classroom Management Workspace */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          {/* Assigned Classes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1F3A]">Your Active Classes</h2>
              <Link
                href="/teacher/classes"
                className="text-xs font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                All cohorts
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {TEACHER_CLASSES.map((cls) => (
                <div
                  key={cls.id}
                  className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                      <span>{cls.subject}</span>
                      <span>·</span>
                      <span className="tabular-nums">{cls.studentsCount} students</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0B1F3A] mt-0.5">
                      {cls.className}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Next Topic: {cls.nextTopic}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 tabular-nums">
                      <Clock size={12} />
                      {cls.schedule} · {cls.pendingSubmissions} ungraded
                    </p>
                  </div>

                  <Link
                    href={`/teacher/live-class/${cls.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap shrink-0"
                  >
                    <Video size={13} />
                    Open Control Room
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Teaching Timetable & Student Attention */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-[#0B1F3A]">Teaching Timetable (WAT)</h2>
              {WEEKLY_TIMETABLE.slice(0, 4).map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#0B1F3A]">{slot.subject}</p>
                    <p className="text-slate-500">{slot.day} · {slot.classLevel}</p>
                  </div>
                  <span className="font-semibold text-[#0D9488] tabular-nums">
                    {slot.timeWat}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                  <Users size={16} className="text-[#D97706]" />
                  Student Progress Snapshot
                </h2>
                <Link href="/teacher/students" className="text-xs font-bold text-[#0D9488] hover:underline">
                  Roster
                </Link>
              </div>
              {TEACHER_STUDENTS.slice(0, 4).map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-bold text-[#0B1F3A]">{st.name}</p>
                    <p className="text-slate-500">{st.classLevel}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-bold text-[#0B1F3A]">{st.avgScore}</p>
                    <p
                      className={
                        st.status === "Needs Attention"
                          ? "text-[#D97706] font-semibold"
                          : "text-[#0D9488] font-semibold"
                      }
                    >
                      {st.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
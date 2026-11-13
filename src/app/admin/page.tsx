"use client";

import { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { CURRENT_ACADEMIC_TERM } from "@/lib/nigerianCurriculum";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
  Video,
} from "lucide-react";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}

interface PendingTeacherItem {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  status: "Pending" | "Approved" | "Rejected";
}

function AdminContent() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacherItem[]>([
    {
      id: "t-james-okafor",
      name: "Mr. Chinedu Emeka",
      subject: "Physics (SSS 1 – SSS 3)",
      qualification: "B.Sc Physics Ed., TRCN Certified",
      status: "Pending",
    },
    {
      id: "t-sarah-adewale",
      name: "Mrs. Funke Adewale",
      subject: "Mathematics & Further Maths",
      qualification: "M.Ed Mathematics, 9 yrs WAEC Examiner",
      status: "Pending",
    },
    {
      id: "t-ibrahim-bello",
      name: "Dr. Ibrahim Bello",
      subject: "Chemistry (SSS 2 – SSS 3)",
      qualification: "Ph.D Industrial Chemistry",
      status: "Pending",
    },
  ]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDecision = (id: string, nextStatus: "Approved" | "Rejected") => {
    const teacher = pendingTeachers.find((t) => t.id === id);
    setPendingTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    if (teacher) {
      setNotice(`${teacher.name} marked as ${nextStatus}.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const pendingCount = pendingTeachers.filter((t) => t.status === "Pending").length;

  const stats = [
    { label: "Enrolled Students", value: "2,451", detail: "JSS 1 – SSS 3 active", icon: Users },
    { label: "Verified Teachers", value: "56", detail: "Across 18 NERDC subjects", icon: GraduationCap },
    { label: "Active Subjects", value: "18", detail: "WAEC, NECO & JAMB tracks", icon: BookOpen },
    { label: "Classes Today (WAT)", value: "12", detail: "3 broadcasting live", icon: CalendarDays },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM} · School Administration
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Academic Operations Console
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review educator credentials, oversee student cohorts, and manage school timetables.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/timetable"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition whitespace-nowrap"
            >
              <Plus size={15} />
              Update Timetable
            </Link>
            <Link
              href="/live-classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap"
            >
              <Video size={15} />
              Monitor Live Rooms
            </Link>
          </div>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            {notice}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                  <Icon size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{s.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions — Real Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/timetable"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0D9488] transition flex flex-col justify-between gap-2"
          >
            <CalendarDays size={20} className="text-[#0D9488]" />
            <div>
              <p className="text-sm font-bold text-[#0B1F3A]">Manage Timetable</p>
              <p className="text-xs text-slate-500 mt-0.5">Edit WAT class slots</p>
            </div>
          </Link>

          <Link
            href="/admin/students"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0D9488] transition flex flex-col justify-between gap-2"
          >
            <Users size={20} className="text-[#0B1F3A]" />
            <div>
              <p className="text-sm font-bold text-[#0B1F3A]">Manage Students</p>
              <p className="text-xs text-slate-500 mt-0.5">Enrollment &amp; status</p>
            </div>
          </Link>

          <Link
            href="/admin/teachers"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0D9488] transition flex flex-col justify-between gap-2"
          >
            <GraduationCap size={20} className="text-[#D97706]" />
            <div>
              <p className="text-sm font-bold text-[#0B1F3A]">Review Teachers</p>
              <p className="text-xs text-slate-500 mt-0.5">TRCN &amp; credentials</p>
            </div>
          </Link>

          <Link
            href="/subjects"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0D9488] transition flex flex-col justify-between gap-2"
          >
            <BookOpen size={20} className="text-[#0D9488]" />
            <div>
              <p className="text-sm font-bold text-[#0B1F3A]">Curriculum Subjects</p>
              <p className="text-xs text-slate-500 mt-0.5">Inspect NERDC modules</p>
            </div>
          </Link>
        </div>

        {/* Two-column queue & recent logs */}
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
          {/* Pending Teachers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Teacher Verification Queue
              </h2>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                {pendingCount} pending review
              </span>
            </div>

            <div className="space-y-3">
              {pendingTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-[#F7F8FA]"
                >
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F3A]">{teacher.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {teacher.subject} · {teacher.qualification}
                    </p>
                    <p
                      className={`text-[11px] font-bold mt-1 ${
                        teacher.status === "Approved"
                          ? "text-emerald-700"
                          : teacher.status === "Rejected"
                          ? "text-rose-700"
                          : "text-amber-700"
                      }`}
                    >
                      Status: {teacher.status}
                    </p>
                  </div>

                  {teacher.status === "Pending" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDecision(teacher.id, "Approved")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition whitespace-nowrap"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(teacher.id, "Rejected")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition whitespace-nowrap"
                      >
                        <XCircle size={14} />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/admin/teachers"
                      className="text-xs font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      View Directory
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operational Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0B1F3A]">
              Recent School Activity
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <Clock size={15} className="text-[#0D9488] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#0B1F3A]">
                    SSS 2 Mathematics Live Class broadcasting
                  </p>
                  <p className="text-slate-500 mt-0.5">24 students joined · 08:30 AM WAT</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <Clock size={15} className="text-[#D97706] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#0B1F3A]">
                    Second Term Science timetable published
                  </p>
                  <p className="text-slate-500 mt-0.5">Synced to JSS &amp; SSS cohorts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={15} className="text-[#0B1F3A] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#0B1F3A]">
                    3 TRCN educator verification packets queued
                  </p>
                  <p className="text-slate-500 mt-0.5">Awaiting Admin sign-off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
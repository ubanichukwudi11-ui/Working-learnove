"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CalendarDays,
  CreditCard,
  MonitorCheck,
  BookOpenCheck,
  AlertTriangle,
  ArrowRight,
  Radio,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    studentsCount: 0,
    activePaidCount: 0,
    pendingPaymentsCount: 0,
    teachersCount: 0,
    pendingAppsCount: 0,
    approvedPairsCount: 0,
    publishedLessonsCount: 0,
    shortfallLessonsCount: 0,
    liveRoomsCount: 0,
    totalRoomsCount: 0,
    subjectsCount: 0,
    levelsCount: 0,
    pendingApps: [] as any[],
    shortfallEntries: [] as any[],
    pendingPayments: [] as any[],
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [appRes, subRes, ttRes, acadRes] = await Promise.all([
        fetch("/api/lms/teacher-applications", { cache: "no-store" }),
        fetch("/api/lms/subscriptions", { cache: "no-store" }),
        fetch("/api/lms/timetable", { cache: "no-store" }),
        fetch("/api/lms/academics", { cache: "no-store" }),
      ]);

      const appJson = appRes.ok ? await appRes.json() : {};
      const subJson = subRes.ok ? await subRes.json() : {};
      const ttJson = ttRes.ok ? await ttRes.json() : {};
      const acadJson = acadRes.ok ? await acadRes.json() : {};

      const apps = appJson.applications || [];
      const pendingApps = apps.filter(
        (a: any) => a.status === "PENDING_REVIEW" || a.status === "RESUBMISSION_REQUIRED"
      );
      const approvals = (appJson.approvals || []).filter((a: any) => a.status === "APPROVED");

      const entitlements = subJson.entitlements || [];
      const activePaidCount = entitlements.filter(
        (e: any) =>
          e.accessStatus === "ACTIVE_PAID" || e.accessStatus === "SCHOLARSHIP_GRANTED"
      ).length;
      const pendingPayments = (subJson.payments || []).filter(
        (p: any) => p.status === "AWAITING_CONFIRMATION"
      );

      const entries = ttJson.entries || [];
      const classrooms = ttJson.classrooms || [];
      const shortfallEntries = entries.filter((e: any) => e.allocationStatus === "SHORTFALL");

      setSummary({
        studentsCount: (subJson.students || []).length,
        activePaidCount,
        pendingPaymentsCount: pendingPayments.length,
        teachersCount: (appJson.teachers || []).length,
        pendingAppsCount: pendingApps.length,
        approvedPairsCount: approvals.length,
        publishedLessonsCount: entries.filter((e: any) => e.publicationStatus === "PUBLISHED")
          .length,
        shortfallLessonsCount: shortfallEntries.length,
        liveRoomsCount: classrooms.filter((c: any) => c.status === "LIVE").length,
        totalRoomsCount: classrooms.length,
        subjectsCount: (acadJson.subjects || []).length,
        levelsCount: (acadJson.classLevels || []).length,
        pendingApps: pendingApps.slice(0, 5),
        shortfallEntries: shortfallEntries.slice(0, 5),
        pendingPayments: pendingPayments.slice(0, 5),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="learnova-banner-dark learnova-ambient-stage-soft bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                School Operations &amp; Governance
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                School Administration Overview
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Coordinate Nigerian academic terms, approve qualified educators per subject &amp;
                class level, verify student subscriptions, publish conflict-free timetables, and
                supervise parallel classroom allocations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/admin/ai-assistant"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition shadow-xs"
              >
                <Sparkles size={15} /> Admin AI Copilot
              </Link>
              <Link
                href="/admin/teachers"
                className="px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 transition"
              >
                Review Teachers
              </Link>
              <Link
                href="/admin/videos"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition"
              >
                Video Lessons
              </Link>
              <Link
                href="/admin/timetable"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition"
              >
                Timetable Builder
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading school administration records...
            </div>
          ) : (
            <>
              {/* Real KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/students"
                  className="learnova-card p-5 hover:border-[#4F46E5] transition"
                >
                  <div className="flex items-center justify-between text-[#6B6F94]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Students</span>
                    <Users size={17} className="text-[#4F46E5]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {summary.studentsCount}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">
                    {summary.activePaidCount} with active access
                  </p>
                </Link>

                <Link
                  href="/admin/teachers"
                  className="learnova-card p-5 hover:border-[#4F46E5] transition"
                >
                  <div className="flex items-center justify-between text-[#6B6F94]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Educators</span>
                    <GraduationCap size={17} className="text-[#7C3AED]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {summary.teachersCount}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">
                    {summary.pendingAppsCount} pending review · {summary.approvedPairsCount} approved slots
                  </p>
                </Link>

                <Link
                  href="/admin/timetable"
                  className="learnova-card p-5 hover:border-[#4F46E5] transition"
                >
                  <div className="flex items-center justify-between text-[#6B6F94]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Published Lessons</span>
                    <CalendarDays size={17} className="text-[#0891B2]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {summary.publishedLessonsCount}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">
                    Across {summary.levelsCount} class levels &amp; {summary.subjectsCount} subjects
                  </p>
                </Link>

                <Link
                  href="/admin/classrooms"
                  className="learnova-card p-5 hover:border-[#4F46E5] transition"
                >
                  <div className="flex items-center justify-between text-[#6B6F94]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Live Classrooms</span>
                    <Radio size={17} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {summary.liveRoomsCount}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">
                    {summary.totalRoomsCount} total allocated group rooms
                  </p>
                </Link>
              </div>

              {/* Operational Queues */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Pending Teacher Approvals */}
                <div className="learnova-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                        <GraduationCap size={16} className="text-[#4F46E5]" />
                        Teacher Approval Queue
                      </h2>
                      <span className="text-xs font-bold text-amber-700 tabular-nums">
                        {summary.pendingAppsCount}
                      </span>
                    </div>
                    {summary.pendingApps.length === 0 ? (
                      <p className="text-xs text-[#6B6F94] py-6 text-center">
                        No pending teacher subject applications right now.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#E4E1F5]">
                        {summary.pendingApps.map((app) => (
                          <li key={app.id} className="py-2.5">
                            <p className="text-sm font-semibold text-[#0B1230]">
                              {app.teacherName}
                            </p>
                            <p className="text-xs text-[#6B6F94]">
                              {app.subjectName} · {app.status.replace(/_/g, " ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href="/admin/teachers"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline"
                  >
                    Open Teacher Approval Centre <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Pending Payment Verifications */}
                <div className="learnova-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                        <CreditCard size={16} className="text-[#4F46E5]" />
                        Pending Payment Checks
                      </h2>
                      <span className="text-xs font-bold text-amber-700 tabular-nums">
                        {summary.pendingPaymentsCount}
                      </span>
                    </div>
                    {summary.pendingPayments.length === 0 ? (
                      <p className="text-xs text-[#6B6F94] py-6 text-center">
                        No bank transfers awaiting confirmation.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#E4E1F5]">
                        {summary.pendingPayments.map((pay) => (
                          <li key={pay.id} className="py-2.5">
                            <p className="text-sm font-semibold text-[#0B1230] tabular-nums">
                              {pay.studentName} · ₦{Number(pay.amountNgn).toLocaleString()}
                            </p>
                            <p className="text-xs text-[#6B6F94]">
                              Ref: {pay.reference}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href="/admin/payments"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline"
                  >
                    Open Payments &amp; Access <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Capacity Shortfalls & Shortcuts */}
                <div className="learnova-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        Allocation Shortfalls
                      </h2>
                      <span className="text-xs font-bold text-rose-700 tabular-nums">
                        {summary.shortfallLessonsCount}
                      </span>
                    </div>
                    {summary.shortfallEntries.length === 0 ? (
                      <p className="text-xs text-[#6B6F94] py-6 text-center">
                        All scheduled classes have sufficient approved teachers for enrolled students.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#E4E1F5]">
                        {summary.shortfallEntries.map((entry) => (
                          <li key={entry.id} className="py-2.5">
                            <p className="text-sm font-semibold text-rose-700">
                              Shortfall: {entry.shortfallCount} unplaced students
                            </p>
                            <p className="text-xs text-[#6B6F94]">
                              {entry.dayOfWeek} {entry.startTime} WAT · Assign another approved teacher
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E4E1F5] flex flex-wrap gap-3">
                    <Link
                      href="/admin/academics"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1230] hover:text-[#4F46E5] hover:underline"
                    >
                      <BookOpenCheck size={13} /> Academics
                    </Link>
                    <Link
                      href="/admin/classrooms"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
                    >
                      <MonitorCheck size={13} /> Classroom Control
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { DashboardSkeleton, PageHeader, StatCard } from "@/components/ui";
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
          <PageHeader
            kicker="School Operations & Governance"
            title="School Administration Overview"
            description="Coordinate academic terms, approve qualified educators per subject & class level, verify student subscriptions, publish conflict-free timetables, and supervise classroom allocations."
            actions={
              <>
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
              </>
            }
          />

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Coordinated KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Students"
                  value={summary.studentsCount}
                  sublabel={`${summary.activePaidCount} with active access`}
                  icon={Users}
                  tone="learning"
                  href="/admin/students"
                />
                <StatCard
                  label="Educators"
                  value={summary.teachersCount}
                  sublabel={`${summary.pendingAppsCount} pending · ${summary.approvedPairsCount} slots`}
                  icon={GraduationCap}
                  tone="assignments"
                  href="/admin/teachers"
                />
                <StatCard
                  label="Published Lessons"
                  value={summary.publishedLessonsCount}
                  sublabel={`${summary.levelsCount} levels · ${summary.subjectsCount} subjects`}
                  icon={CalendarDays}
                  tone="timetable"
                  href="/admin/timetable"
                />
                <StatCard
                  label="Live Classrooms"
                  value={summary.liveRoomsCount}
                  sublabel={`${summary.totalRoomsCount} total allocated rooms`}
                  icon={Radio}
                  tone="attendance"
                  href="/admin/classrooms"
                />
              </div>

              {/* Operational Queues */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Pending Teacher Approvals */}
                <div className="learnova-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <GraduationCap size={16} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                        Teacher Approval Queue
                      </h2>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {summary.pendingAppsCount}
                      </span>
                    </div>
                    {summary.pendingApps.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)] py-6 text-center">
                        No pending teacher subject applications right now.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)]">
                        {summary.pendingApps.map((app) => (
                          <li key={app.id} className="py-2.5">
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {app.teacherName}
                            </p>
                            <p className="text-xs text-[var(--foreground-subtle)]">
                              {app.subjectName} · {app.status.replace(/_/g, " ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href="/admin/teachers"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                  >
                    Open Teacher Approval Centre <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Pending Payment Verifications */}
                <div className="learnova-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <CreditCard size={16} className="text-teal-600 dark:text-teal-400" />
                        Pending Payment Checks
                      </h2>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {summary.pendingPaymentsCount}
                      </span>
                    </div>
                    {summary.pendingPayments.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)] py-6 text-center">
                        No bank transfers awaiting confirmation.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)]">
                        {summary.pendingPayments.map((pay) => (
                          <li key={pay.id} className="py-2.5">
                            <p className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
                              {pay.studentName} · ₦{Number(pay.amountNgn).toLocaleString()}
                            </p>
                            <p className="text-xs text-[var(--foreground-subtle)]">
                              Ref: {pay.reference}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href="/admin/payments"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                  >
                    Open Payments &amp; Access <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Capacity Shortfalls & Shortcuts */}
                <div className="learnova-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                        Allocation Shortfalls
                      </h2>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {summary.shortfallLessonsCount}
                      </span>
                    </div>
                    {summary.shortfallEntries.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)] py-6 text-center">
                        All scheduled classes have sufficient approved teachers for enrolled students.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)]">
                        {summary.shortfallEntries.map((entry) => (
                          <li key={entry.id} className="py-2.5">
                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                              Shortfall: {entry.shortfallCount} unplaced students
                            </p>
                            <p className="text-xs text-[var(--foreground-subtle)]">
                              {entry.dayOfWeek} {entry.startTime} WAT · Assign another approved teacher
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-3">
                    <Link
                      href="/admin/academics"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--foreground)] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:underline"
                    >
                      <BookOpenCheck size={13} /> Academics
                    </Link>
                    <Link
                      href="/admin/classrooms"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
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
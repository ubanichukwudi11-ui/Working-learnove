"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ProgressChart from "@/components/charts/ProgressChart";
import SubjectStrengthChart from "@/components/charts/SubjectStrengthChart";
import { DashboardSkeleton, PageHeader, StatCard } from "@/components/ui";
import {
  Download,
  Award,
  PlaySquare,
  ClipboardCheck,
  TrendingUp,
  CalendarCheck,
  BookOpen,
} from "lucide-react";

interface AnalyticsData {
  studentName: string;
  classLevelName: string;
  termName: string;
  sessionName: string;
  overallAverage: number;
  overallWaecGrade: string;
  overallRemark: string;
  attendanceRate: number;
  attendancePresentCount: number;
  attendanceTotalCount: number;
  quizzesCompletedCount: number;
  cbtAveragePercentage: number;
  syllabusCoveredPercent: number;
  weeklyTrend: Array<{ week: string; score: number }>;
  subjectRows: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    department: string;
    caScore: number;
    examEstimate: number;
    totalPercentage: number;
    waecGrade: string;
    remark: string;
    quizzesCompleted: number;
    topicsTotal: number;
    videosPublished: number;
  }>;
  recentAttempts: Array<{
    id: string;
    title: string;
    subjectName: string;
    quizType: string;
    score: number;
    total: number;
    percentage: number;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lms/analytics", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.analytics) setAnalytics(data.analytics);
      })
      .finally(() => setLoading(false));
  }, []);

  const subjectChartData =
    analytics?.subjectRows.map((s) => ({
      subject: s.subjectCode || s.subjectName.slice(0, 6),
      score: s.totalPercentage,
    })) || undefined;

  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            kicker={
              analytics
                ? `${analytics.sessionName} · ${analytics.termName} · ${analytics.classLevelName}`
                : "Academic Term Analytics"
            }
            title="Achievements & Exam Readiness"
            description="Track live class attendance, WAEC grade projections, CBT drills, and download your official term report card."
            breadcrumbs={[{ label: "Achievements" }]}
            actions={
              <>
                <Link
                  href="/assignments?tab=cbt"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition whitespace-nowrap"
                >
                  <ClipboardCheck size={15} className="text-[#22D3EE]" />
                  Take Timed CBT Drill
                </Link>
                <a
                  href="/api/lms/report-card/download"
                  download
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
                >
                  <Download size={15} />
                  Download Report Card (PDF)
                </a>
              </>
            }
          />

          {loading ? (
            <DashboardSkeleton />
          ) : analytics ? (
            <>
              {/* Live KPI Row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Overall Term Average"
                  value={`${analytics.overallAverage}%`}
                  sublabel={`WAEC Grade ${analytics.overallWaecGrade} (${analytics.overallRemark})`}
                  icon={TrendingUp}
                  tone="learning"
                />
                <StatCard
                  label="Live Class Attendance"
                  value={`${analytics.attendanceRate}%`}
                  sublabel={`${analytics.attendancePresentCount} of ${analytics.attendanceTotalCount} sessions`}
                  icon={CalendarCheck}
                  tone="attendance"
                />
                <StatCard
                  label="Quizzes & CBT Done"
                  value={analytics.quizzesCompletedCount}
                  sublabel={`Avg score: ${analytics.cbtAveragePercentage}%`}
                  icon={Award}
                  tone="exams"
                />
                <StatCard
                  label="Syllabus Covered"
                  value={`${analytics.syllabusCoveredPercent}%`}
                  sublabel="Video topics & checks"
                  icon={BookOpen}
                  tone="timetable"
                />
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <ProgressChart data={analytics.weeklyTrend} />
                <SubjectStrengthChart data={subjectChartData} />
              </div>

              {/* Subject Breakdown Table (WAEC Grading Scale A1-F9) */}
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Subject Continuous Assessment &amp; WAEC Projection
                  </h2>
                  <span className="text-xs text-[var(--foreground-subtle)] tabular-nums">
                    Scale: A1 (75+) · B2 (70+) · B3 (65+) · C4–C6 (50–64)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface-lavender)] text-[var(--foreground-muted)] text-xs uppercase">
                      <tr>
                        <th className="text-left px-6 py-3">Subject</th>
                        <th className="text-left px-6 py-3">Dept</th>
                        <th className="text-left px-6 py-3">CA / 30</th>
                        <th className="text-left px-6 py-3">Exam / 70</th>
                        <th className="text-left px-6 py-3">Total %</th>
                        <th className="text-left px-6 py-3">Grade</th>
                        <th className="text-left px-6 py-3">Study</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {analytics.subjectRows.map((s) => (
                        <tr
                          key={s.subjectId}
                          className="hover:bg-[var(--surface-lavender)] transition-colors"
                        >
                          <td className="px-6 py-3.5 font-semibold text-[var(--foreground)]">
                            {s.subjectName}
                          </td>
                          <td className="px-6 py-3.5 text-[var(--foreground-subtle)] text-xs">
                            {s.department}
                          </td>
                          <td className="px-6 py-3.5 text-[var(--foreground-muted)] tabular-nums">
                            {s.caScore}
                          </td>
                          <td className="px-6 py-3.5 text-[var(--foreground-muted)] tabular-nums">
                            {s.examEstimate}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[var(--foreground)] tabular-nums">
                            {s.totalPercentage}%
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#4F46E5] dark:text-[#A5B4FC] tabular-nums">
                            {s.waecGrade} · {s.remark}
                          </td>
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/videos?subjectId=${encodeURIComponent(s.subjectId)}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--foreground)] hover:text-[#6D28D9] dark:hover:text-[#C4B5FD]"
                            >
                              <PlaySquare size={13} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                              {s.videosPublished} Videos
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Recorded CBT & Topic Quiz Attempts */}
              <div className="learnova-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Award size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                    Recorded Quiz &amp; Timed CBT Attempts
                  </h2>
                  <Link
                    href="/videos"
                    className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline whitespace-nowrap"
                  >
                    Open Video Topic Quizzes →
                  </Link>
                </div>

                {analytics.recentAttempts.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    No quiz or CBT attempts recorded yet. Complete any Video Lesson Quiz or Timed CBT Drill to record scores here and in your PDF Report Card.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {analytics.recentAttempts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                            {a.subjectName} ·{" "}
                            {a.quizType === "TIMED_CBT" ? "Timed CBT" : "Topic Quiz"}
                          </p>
                          <p className="text-sm font-bold text-[var(--foreground)] truncate mt-0.5">
                            {a.title}
                          </p>
                          <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                            {new Date(a.createdAt).toLocaleString("en-NG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <p className="text-lg font-extrabold text-[var(--foreground)]">
                            {a.percentage}%
                          </p>
                          <p className="text-[11px] font-semibold text-[var(--foreground-subtle)]">
                            {a.score}/{a.total}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ProgressChart from "@/components/charts/ProgressChart";
import SubjectStrengthChart from "@/components/charts/SubjectStrengthChart";
import { Download, Award, PlaySquare, ClipboardCheck } from "lucide-react";

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
          {/* Header & Official PDF Report Card Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                {analytics
                  ? `${analytics.sessionName} · ${analytics.termName} · ${analytics.classLevelName}`
                  : "Academic Term Analytics"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Academic Progress &amp; Exam Readiness
              </h1>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/assignments?tab=cbt"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold transition whitespace-nowrap"
              >
                <ClipboardCheck size={15} className="text-[#0D9488]" />
                Take Timed CBT Drill
              </Link>
              <a
                href="/api/lms/report-card/download"
                download
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
              >
                <Download size={15} />
                Download Report Card (PDF)
              </a>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Computing live attendance, quiz scores, and WAEC grade projections...
            </div>
          ) : analytics ? (
            <>
              {/* Live KPI Row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">
                    Overall Term Average
                  </p>
                  <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                    {analytics.overallAverage}%
                  </p>
                  <p className="text-xs text-[#0D9488] font-semibold mt-1">
                    WAEC Grade {analytics.overallWaecGrade} ({analytics.overallRemark})
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">
                    Live Class Attendance
                  </p>
                  <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                    {analytics.attendanceRate}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {analytics.attendancePresentCount} of{" "}
                    {analytics.attendanceTotalCount} recorded sessions
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">
                    Quizzes &amp; CBT Completed
                  </p>
                  <p className="text-3xl font-extrabold text-[#0D9488] mt-2 tabular-nums">
                    {analytics.quizzesCompletedCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    Avg score: {analytics.cbtAveragePercentage}%
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">
                    WAEC Syllabus Covered
                  </p>
                  <p className="text-3xl font-extrabold text-[#D97706] mt-2 tabular-nums">
                    {analytics.syllabusCoveredPercent}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Topic videos &amp; mastery checks
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <ProgressChart data={analytics.weeklyTrend} />
                <SubjectStrengthChart data={subjectChartData} />
              </div>

              {/* Subject Breakdown Table (WAEC Grading Scale A1-F9) */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Subject Continuous Assessment &amp; WAEC Projection
                  </h2>
                  <span className="text-xs text-slate-500">
                    Scale: A1 (75+) · B2 (70+) · B3 (65+) · C4–C6 (50–64)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
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
                    <tbody className="divide-y divide-slate-100">
                      {analytics.subjectRows.map((s) => (
                        <tr key={s.subjectId} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-semibold text-[#0B1F3A]">
                            {s.subjectName}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 text-xs">
                            {s.department}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 tabular-nums">
                            {s.caScore}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 tabular-nums">
                            {s.examEstimate}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#0B1F3A] tabular-nums">
                            {s.totalPercentage}%
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#0D9488] tabular-nums">
                            {s.waecGrade} · {s.remark}
                          </td>
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/videos?subjectId=${encodeURIComponent(s.subjectId)}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#0D9488]"
                            >
                              <PlaySquare size={13} />
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                    <Award size={17} className="text-[#0D9488]" />
                    Recorded Quiz &amp; Timed CBT Attempts
                  </h2>
                  <Link
                    href="/videos"
                    className="text-xs font-bold text-[#0D9488] hover:underline"
                  >
                    Open Video Topic Quizzes →
                  </Link>
                </div>

                {analytics.recentAttempts.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No quiz or CBT attempts recorded yet. Complete any Video Lesson Quiz or Timed CBT Drill to record scores here and in your PDF Report Card.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {analytics.recentAttempts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0D9488]">
                            {a.subjectName} ·{" "}
                            {a.quizType === "TIMED_CBT" ? "Timed CBT" : "Topic Quiz"}
                          </p>
                          <p className="text-sm font-bold text-[#0B1F3A] truncate mt-0.5">
                            {a.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(a.createdAt).toLocaleString("en-NG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <p className="text-lg font-extrabold text-[#0B1F3A]">
                            {a.percentage}%
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500">
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

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
          <div className="learnova-banner-dark learnova-ambient-stage-soft bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                {analytics
                  ? `${analytics.sessionName} · ${analytics.termName} · ${analytics.classLevelName}`
                  : "Academic Term Analytics"}
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight">
                Academic Progress &amp; Exam Readiness
              </h1>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
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
            </div>
          </div>

          {loading ? (
            <div className="learnova-card p-12 text-center text-sm text-[#6B6F94]">
              Computing live attendance, quiz scores, and WAEC grade projections...
            </div>
          ) : analytics ? (
            <>
              {/* Live KPI Row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="learnova-card p-5 min-w-0">
                  <p className="text-xs font-semibold text-[#6B6F94]">
                    Overall Term Average
                  </p>
                  <p className="text-3xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {analytics.overallAverage}%
                  </p>
                  <p className="text-xs text-[#4F46E5] font-semibold mt-1">
                    WAEC Grade {analytics.overallWaecGrade} ({analytics.overallRemark})
                  </p>
                </div>

                <div className="learnova-card p-5 min-w-0">
                  <p className="text-xs font-semibold text-[#6B6F94]">
                    Live Class Attendance
                  </p>
                  <p className="text-3xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {analytics.attendanceRate}%
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                    {analytics.attendancePresentCount} of{" "}
                    {analytics.attendanceTotalCount} recorded sessions
                  </p>
                </div>

                <div className="learnova-card p-5 min-w-0">
                  <p className="text-xs font-semibold text-[#6B6F94]">
                    Quizzes &amp; CBT Completed
                  </p>
                  <p className="text-3xl font-extrabold text-[#6D28D9] mt-2 tabular-nums">
                    {analytics.quizzesCompletedCount}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                    Avg score: {analytics.cbtAveragePercentage}%
                  </p>
                </div>

                <div className="learnova-card p-5 min-w-0">
                  <p className="text-xs font-semibold text-[#6B6F94]">
                    WAEC Syllabus Covered
                  </p>
                  <p className="text-3xl font-extrabold text-[#0891B2] mt-2 tabular-nums">
                    {analytics.syllabusCoveredPercent}%
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">
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
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E4E1F5] flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[#0B1230]">
                    Subject Continuous Assessment &amp; WAEC Projection
                  </h2>
                  <span className="text-xs text-[#6B6F94] tabular-nums">
                    Scale: A1 (75+) · B2 (70+) · B3 (65+) · C4–C6 (50–64)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF8FF] text-[#43466E] text-xs uppercase">
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
                    <tbody className="divide-y divide-[#E4E1F5]">
                      {analytics.subjectRows.map((s) => (
                        <tr key={s.subjectId} className="hover:bg-[#FAF8FF]/70 transition-colors">
                          <td className="px-6 py-3.5 font-semibold text-[#0B1230]">
                            {s.subjectName}
                          </td>
                          <td className="px-6 py-3.5 text-[#6B6F94] text-xs">
                            {s.department}
                          </td>
                          <td className="px-6 py-3.5 text-[#43466E] tabular-nums">
                            {s.caScore}
                          </td>
                          <td className="px-6 py-3.5 text-[#43466E] tabular-nums">
                            {s.examEstimate}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#0B1230] tabular-nums">
                            {s.totalPercentage}%
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#4F46E5] tabular-nums">
                            {s.waecGrade} · {s.remark}
                          </td>
                          <td className="px-6 py-3.5">
                            <Link
                              href={`/videos?subjectId=${encodeURIComponent(s.subjectId)}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1230] hover:text-[#6D28D9]"
                            >
                              <PlaySquare size={13} className="text-[#4F46E5]" />
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
                  <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                    <Award size={17} className="text-[#4F46E5]" />
                    Recorded Quiz &amp; Timed CBT Attempts
                  </h2>
                  <Link
                    href="/videos"
                    className="text-xs font-bold text-[#4F46E5] hover:text-[#6D28D9] hover:underline whitespace-nowrap"
                  >
                    Open Video Topic Quizzes →
                  </Link>
                </div>

                {analytics.recentAttempts.length === 0 ? (
                  <p className="text-xs text-[#6B6F94]">
                    No quiz or CBT attempts recorded yet. Complete any Video Lesson Quiz or Timed CBT Drill to record scores here and in your PDF Report Card.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {analytics.recentAttempts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#6D28D9]">
                            {a.subjectName} ·{" "}
                            {a.quizType === "TIMED_CBT" ? "Timed CBT" : "Topic Quiz"}
                          </p>
                          <p className="text-sm font-bold text-[#0B1230] truncate mt-0.5">
                            {a.title}
                          </p>
                          <p className="text-[11px] text-[#6B6F94] mt-0.5">
                            {new Date(a.createdAt).toLocaleString("en-NG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <p className="text-lg font-extrabold text-[#0B1230]">
                            {a.percentage}%
                          </p>
                          <p className="text-[11px] font-semibold text-[#6B6F94]">
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

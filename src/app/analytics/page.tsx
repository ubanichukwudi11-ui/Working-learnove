"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ProgressChart from "@/components/charts/ProgressChart";
import SubjectStrengthChart from "@/components/charts/SubjectStrengthChart";
import { NIGERIAN_SUBJECTS, CURRENT_ACADEMIC_TERM } from "@/lib/nigerianCurriculum";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Academic Progress &amp; Exam Readiness
            </h1>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">Overall Term Average</p>
              <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">81.4%</p>
              <p className="text-xs text-[#0D9488] font-semibold mt-1">Distinction Grade (A2)</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">Live Class Attendance</p>
              <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">96%</p>
              <p className="text-xs text-slate-500 mt-1">23 of 24 sessions attended</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">WAEC Syllabus Covered</p>
              <p className="text-3xl font-extrabold text-[#D97706] mt-2 tabular-nums">67%</p>
              <p className="text-xs text-slate-500 mt-1">On pace for Week 12 exams</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ProgressChart />
            <SubjectStrengthChart />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-[#0B1F3A]">Subject Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Subject</th>
                    <th className="text-left px-6 py-3">Teacher</th>
                    <th className="text-left px-6 py-3">Exam Track</th>
                    <th className="text-left px-6 py-3">Lessons</th>
                    <th className="text-left px-6 py-3">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {NIGERIAN_SUBJECTS.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-semibold text-[#0B1F3A]">{s.name}</td>
                      <td className="px-6 py-3.5 text-slate-600">{s.teacher}</td>
                      <td className="px-6 py-3.5 text-slate-600">{s.examTrack}</td>
                      <td className="px-6 py-3.5 text-slate-600 tabular-nums">
                        {s.completedLessons}/{s.lessons}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-[#0D9488] tabular-nums">
                        {s.progress}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

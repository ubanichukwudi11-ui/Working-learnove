"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { TEACHER_STUDENTS } from "@/lib/nigerianCurriculum";
import { Search } from "lucide-react";

export default function TeacherStudentsPage() {
  const [query, setQuery] = useState("");

  const filtered = TEACHER_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.classLevel.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Student Performance
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Student Roster &amp; Progress
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 sm:w-64">
              <Search size={15} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student..."
                className="bg-transparent outline-none text-xs text-[#0F1F38] w-full"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Student Name</th>
                    <th className="text-left px-6 py-3">Class</th>
                    <th className="text-left px-6 py-3">Attendance</th>
                    <th className="text-left px-6 py-3">CA Average</th>
                    <th className="text-left px-6 py-3">Assignments</th>
                    <th className="text-left px-6 py-3">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-[#0B1F3A]">{s.name}</td>
                      <td className="px-6 py-4 text-slate-600">{s.classLevel}</td>
                      <td className="px-6 py-4 text-slate-600 tabular-nums">{s.attendance}</td>
                      <td className="px-6 py-4 font-bold text-[#0B1F3A] tabular-nums">{s.avgScore}</td>
                      <td className="px-6 py-4 text-slate-600 tabular-nums">{s.assignmentsDone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold ${
                            s.status === "Needs Attention"
                              ? "text-[#D97706]"
                              : "text-[#0D9488]"
                          }`}
                        >
                          {s.status}
                        </span>
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

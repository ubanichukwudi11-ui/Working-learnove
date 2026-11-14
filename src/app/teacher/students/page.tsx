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
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Student Performance
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Student Roster &amp; Progress
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 sm:w-72">
              <Search size={15} className="text-[#C4B5FD] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student or class..."
                className="bg-transparent outline-none text-xs text-white placeholder:text-[#C4B5FD]/75 w-full"
              />
            </div>
          </div>

          <div className="learnova-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8FF] text-[#6B6F94] text-xs uppercase border-b border-[#E4E1F5]">
                  <tr>
                    <th className="text-left px-6 py-3.5 font-semibold">Student Name</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Class</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Attendance</th>
                    <th className="text-left px-6 py-3.5 font-semibold">CA Average</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Assignments</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1F5]">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF8FF]/70 transition">
                      <td className="px-6 py-4 font-bold text-[#0B1230]">{s.name}</td>
                      <td className="px-6 py-4 text-[#43466E]">{s.classLevel}</td>
                      <td className="px-6 py-4 text-[#43466E] tabular-nums">{s.attendance}</td>
                      <td className="px-6 py-4 font-bold text-[#0B1230] tabular-nums">{s.avgScore}</td>
                      <td className="px-6 py-4 text-[#43466E] tabular-nums">{s.assignmentsDone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold ${
                            s.status === "Needs Attention"
                              ? "text-amber-700"
                              : "text-emerald-700"
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

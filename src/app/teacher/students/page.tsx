"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, EmptyState } from "@/components/ui";
import { TEACHER_STUDENTS } from "@/lib/nigerianCurriculum";
import { Search, Users } from "lucide-react";

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
        <div className="space-y-7">
          <PageHeader
            eyebrow="Student Performance"
            title="Student Roster & Progress"
            description="Review student attendance, continuous assessment averages, and academic standing across your assigned classes."
            actions={
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 sm:w-72">
                <Search size={15} className="text-[#C4B5FD] shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student or class..."
                  className="bg-transparent outline-none text-xs text-white placeholder:text-[#C4B5FD]/75 w-full"
                />
              </div>
            }
          />

          <div className="learnova-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Users}
                  title="No matching students"
                  description="Adjust your search query to locate students in your roster."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-lavender)] text-[var(--foreground-subtle)] text-xs uppercase border-b border-[var(--border)]">
                    <tr>
                      <th className="text-left px-6 py-3.5 font-semibold">Student Name</th>
                      <th className="text-left px-6 py-3.5 font-semibold">Class</th>
                      <th className="text-left px-6 py-3.5 font-semibold">Attendance</th>
                      <th className="text-left px-6 py-3.5 font-semibold">CA Average</th>
                      <th className="text-left px-6 py-3.5 font-semibold">Assignments</th>
                      <th className="text-left px-6 py-3.5 font-semibold">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--surface-lavender)]/60 transition">
                        <td className="px-6 py-4 font-bold text-[var(--foreground)]">{s.name}</td>
                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{s.classLevel}</td>
                        <td className="px-6 py-4 text-[var(--foreground-muted)] tabular-nums">{s.attendance}</td>
                        <td className="px-6 py-4 font-bold text-[var(--foreground)] tabular-nums">{s.avgScore}</td>
                        <td className="px-6 py-4 text-[var(--foreground-muted)] tabular-nums">{s.assignmentsDone}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-bold ${
                              s.status === "Needs Attention"
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-emerald-700 dark:text-emerald-300"
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
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

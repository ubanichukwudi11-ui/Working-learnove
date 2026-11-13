"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { TEACHER_STUDENTS } from "@/lib/nigerianCurriculum";
import { Check, CalendarCheck } from "lucide-react";

type Status = "Present" | "Late" | "Absent";

export default function TeacherAttendancePage() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(TEACHER_STUDENTS.map((s) => [s.id, "Present"]))
  );
  const [saved, setSaved] = useState(false);

  const presentCount = Object.values(statuses).filter((v) => v === "Present").length;

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Daily Register · SSS 2 Science
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Class Attendance Register
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#0B1F3A] tabular-nums">
                {presentCount}/{TEACHER_STUDENTS.length} Present
              </span>
              <button
                onClick={() => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition"
              >
                {saved ? <Check size={15} /> : <CalendarCheck size={15} />}
                {saved ? "Register Saved" : "Save Attendance"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-6 py-3">Student</th>
                    <th className="text-left px-6 py-3">Cohort</th>
                    <th className="text-left px-6 py-3">Term Attendance</th>
                    <th className="text-left px-6 py-3">Mark Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TEACHER_STUDENTS.map((st) => (
                    <tr key={st.id}>
                      <td className="px-6 py-4 font-bold text-[#0B1F3A]">{st.name}</td>
                      <td className="px-6 py-4 text-slate-600">{st.classLevel}</td>
                      <td className="px-6 py-4 text-slate-600 tabular-nums">{st.attendance}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex gap-1.5">
                          {(["Present", "Late", "Absent"] as Status[]).map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                setStatuses((prev) => ({ ...prev, [st.id]: opt }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                statuses[st.id] === opt
                                  ? opt === "Present"
                                    ? "bg-[#0D9488] text-white"
                                    : opt === "Late"
                                    ? "bg-[#D97706] text-white"
                                    : "bg-red-600 text-white"
                                  : "bg-[#F7F8FA] text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
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

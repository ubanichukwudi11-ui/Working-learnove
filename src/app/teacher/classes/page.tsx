"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { TEACHER_CLASSES, WEEKLY_TIMETABLE } from "@/lib/nigerianCurriculum";
import { Video, Users, CalendarCheck, Clock } from "lucide-react";

export default function TeacherClassesPage() {
  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Cohort Management
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              My Classes &amp; Teaching Schedule
            </h1>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TEACHER_CLASSES.map((cls) => (
              <div
                key={cls.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="text-xs font-bold text-[#0D9488] uppercase">
                    {cls.subject}
                  </span>
                  <h2 className="text-lg font-bold text-[#0B1F3A] mt-1">
                    {cls.className}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={13} />
                    {cls.schedule}
                  </p>
                  <p className="text-sm text-slate-600 mt-3">
                    Next lesson: <span className="font-semibold text-[#0B1F3A]">{cls.nextTopic}</span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-xs text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} /> {cls.studentsCount} Students
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#0D9488] font-bold">
                      <CalendarCheck size={14} /> {cls.attendanceRate}% Attendance
                    </span>
                  </div>

                  <Link
                    href={`/teacher/live-class/${cls.id}`}
                    className="w-full py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <Video size={14} />
                    Enter Teacher Control Room
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#0B1F3A] mb-4">
              Full Weekly Teaching Timetable (Africa/Lagos WAT)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Day</th>
                    <th className="text-left px-4 py-3">Time (WAT)</th>
                    <th className="text-left px-4 py-3">Subject</th>
                    <th className="text-left px-4 py-3">Class</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {WEEKLY_TIMETABLE.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{slot.day}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{slot.timeWat}</td>
                      <td className="px-4 py-3 text-[#0D9488] font-semibold">{slot.subject}</td>
                      <td className="px-4 py-3 text-slate-600">{slot.classLevel}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/teacher/live-class/${slot.roomOrClassId}`}
                          className="text-xs font-bold text-[#0B1F3A] hover:text-[#0D9488] underline"
                        >
                          Launch Studio
                        </Link>
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

"use client";

import { use } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import StudentLiveClassroom from "@/components/live-class/StudentLiveClassroom";
import { ArrowRight, MonitorCheck } from "lucide-react";

export default function LiveClassRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute roles={["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN", "PARENT"]}>
      <StudentClassroomGate classId={id} />
    </ProtectedRoute>
  );
}

function StudentClassroomGate({ classId }: { classId: string }) {
  const { user } = useAuth();

  if (user?.role === "TEACHER") {
    return (
      <div className="min-h-screen bg-[#070D24] bg-architectural-grid-dark text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/12 bg-[#0D1438] p-8 text-center space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <h1 className="landing-display text-xl font-extrabold">Teacher Account Detected</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your signed-in role is Educator. Open the dedicated Teacher Control Room for this
            classroom to prepare materials, start live broadcast, manage raised hands, and save attendance.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/teacher/live-class/${classId}`}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
            >
              Open Teacher Control Room
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/teacher/classes"
              className="w-full py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/5 transition"
            >
              Back to My Classrooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-[#070D24] bg-architectural-grid-dark text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/12 bg-[#0D1438] p-8 text-center space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <MonitorCheck size={34} className="mx-auto text-[#22D3EE]" />
          <h1 className="landing-display text-xl font-extrabold">Private Live Stream Restricted</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            School Administrators monitor classroom lifecycle status, rosters, capacity, and
            attendance inside the Classroom Control Centre without joining private teacher/student live streams.
          </p>
          <Link
            href="/admin/classrooms"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
          >
            Open Classroom Control Centre
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return <StudentLiveClassroom classId={classId} />;
}
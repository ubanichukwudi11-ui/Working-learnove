"use client";

import { use } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import StudentLiveClassroom from "@/components/live-class/StudentLiveClassroom";
import { ArrowRight } from "lucide-react";

export default function LiveClassRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN", "PARENT", "TEACHER"]}>
      <StudentClassroomGate classId={id} />
    </ProtectedRoute>
  );
}

function StudentClassroomGate({ classId }: { classId: string }) {
  const { user } = useAuth();

  if (user?.role === "TEACHER") {
    return (
      <div className="min-h-screen bg-[#0B1F3A] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/15 bg-[#10294B] p-8 text-center space-y-4">
          <h1 className="text-xl font-extrabold">Teacher Account Detected</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your signed-in role is Educator. Open the dedicated Teacher Control Room for this classroom to manage video broadcast, raised-hand approvals, polls, and attendance.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/teacher/live-class/${classId}`}
              className="w-full py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              Open Teacher Control Room
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/live-classes"
              className="w-full py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              Back to Live Classes Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <StudentLiveClassroom classId={classId} />;
}
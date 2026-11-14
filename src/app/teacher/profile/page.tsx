"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { TIMEZONE_LABEL, CURRENT_ACADEMIC_TERM } from "@/lib/nigerianCurriculum";
import { GraduationCap } from "lucide-react";

export default function TeacherProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Educator Profile &amp; Teaching Allocation
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0B1F3A] text-[#F59E0B] flex items-center justify-center shrink-0">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                {user?.fullName || "Educator"}
              </h2>
              <p className="text-sm text-slate-600">{user?.email}</p>
              <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                Senior Secondary Mathematics &amp; Physics · {TIMEZONE_LABEL}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3 text-sm">
            <h3 className="font-bold text-[#0B1F3A]">Allocated Cohorts</h3>
            <p className="text-slate-600">• SSS 2 Science Cohort A — Mathematics (MTH 201)</p>
            <p className="text-slate-600">• SSS 2 Science Cohort B — Physics (PHY 202)</p>
            <p className="text-slate-600">• SSS 3 WAEC &amp; JAMB Intensive — Further Mathematics</p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

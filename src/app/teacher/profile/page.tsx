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
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Educator Profile &amp; Teaching Allocation
            </h1>
          </div>

          <div className="learnova-card p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap size={26} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#0B1230] truncate">
                {user?.fullName || "Educator"}
              </h2>
              <p className="text-sm text-[#43466E] truncate">{user?.email}</p>
              <p className="text-xs font-semibold text-[#4F46E5] mt-0.5">
                Senior Secondary Mathematics &amp; Physics · {TIMEZONE_LABEL}
              </p>
            </div>
          </div>

          <div className="learnova-card p-6 space-y-3 text-sm">
            <h3 className="font-bold text-[#0B1230]">Allocated Cohorts</h3>
            <div className="space-y-2">
              <p className="rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] px-4 py-2.5 text-[#43466E]">
                <strong className="text-[#0B1230]">SSS 2 Science Cohort A</strong> · Mathematics (MTH 201)
              </p>
              <p className="rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] px-4 py-2.5 text-[#43466E]">
                <strong className="text-[#0B1230]">SSS 2 Science Cohort B</strong> · Physics (PHY 202)
              </p>
              <p className="rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] px-4 py-2.5 text-[#43466E]">
                <strong className="text-[#0B1230]">SSS 3 WAEC &amp; JAMB Intensive</strong> · Further Mathematics
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import AdminAiCopilot from "@/components/admin/AdminAiCopilot";
import Link from "next/link";
import { CalendarDays, GraduationCap, CreditCard } from "lucide-react";

export default function AdminAiAssistantPage() {
  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Intelligent School Operations &amp; Scheduling
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Admin AI Copilot
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Draft conflict-free WAT timetables from approved educators, diagnose capacity
                shortfalls, triage pending teacher and payment queues, and compose official
                school communications.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/admin/timetable"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition shadow-xs"
              >
                <CalendarDays size={15} /> Timetable Builder
              </Link>
              <Link
                href="/admin/teachers"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 transition"
              >
                <GraduationCap size={15} /> Teacher Approvals
              </Link>
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 transition"
              >
                <CreditCard size={15} /> Payments
              </Link>
            </div>
          </div>

          <AdminAiCopilot defaultTab="copilot" />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

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
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                Intelligent School Operations & Scheduling
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Admin AI Copilot
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Draft conflict-free WAT timetables from approved educators, diagnose capacity
                shortfalls, triage pending teacher and payment queues, and compose official
                school communications.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/admin/timetable"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-xs sm:text-sm font-semibold transition"
              >
                <CalendarDays size={15} /> Timetable Builder
              </Link>
              <Link
                href="/admin/teachers"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition"
              >
                <GraduationCap size={15} /> Teacher Approvals
              </Link>
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition"
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

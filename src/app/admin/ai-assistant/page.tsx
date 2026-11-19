"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui";
import AdminAiCopilot from "@frontend/components/admin/AdminAiCopilot";
import Link from "next/link";
import { CalendarDays, GraduationCap, CreditCard } from "lucide-react";

export default function AdminAiAssistantPage() {
  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            eyebrow="Intelligent School Operations & Scheduling"
            title="Admin AI Copilot"
            description="Draft conflict-free WAT timetables from approved educators, diagnose capacity shortfalls, triage pending teacher and payment queues, and compose official school communications."
            actions={
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link
                  href="/admin/timetable"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition shadow-xs whitespace-nowrap"
                >
                  <CalendarDays size={15} /> Timetable Builder
                </Link>
                <Link
                  href="/admin/teachers"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 transition whitespace-nowrap"
                >
                  <GraduationCap size={15} /> Teacher Approvals
                </Link>
                <Link
                  href="/admin/payments"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 transition whitespace-nowrap"
                >
                  <CreditCard size={15} /> Payments
                </Link>
              </div>
            }
          />

          <AdminAiCopilot defaultTab="copilot" />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

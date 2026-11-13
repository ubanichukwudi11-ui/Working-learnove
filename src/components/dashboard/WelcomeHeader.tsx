"use client";

import Link from "next/link";
import { Video, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_ACADEMIC_TERM, formatLagosDate } from "@/lib/nigerianCurriculum";

export default function WelcomeHeader() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "Student";

  return (
    <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
          {CURRENT_ACADEMIC_TERM} · {formatLagosDate()}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          SSS 2 Science · WAEC & JAMB Track — pick up where you left off or join today&apos;s live session.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          href="/live-classes/math-001"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
        >
          <Video size={15} />
          Join Live Maths Class
        </Link>
        <Link
          href="/assignments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold transition whitespace-nowrap"
        >
          <ClipboardList size={15} className="text-[#D97706]" />
          2 Pending Assignments
        </Link>
      </div>
    </div>
  );
}
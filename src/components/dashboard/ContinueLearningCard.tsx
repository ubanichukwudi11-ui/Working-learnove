"use client";

import Link from "next/link";
import { Play, Clock, User } from "lucide-react";

export default function ContinueLearningCard() {
  return (
    <div className="rounded-2xl bg-[#0B1F3A] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
      <div className="space-y-3 max-w-xl">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-300">
          <span>Active Course</span>
          <span>·</span>
          <span>MTH 201 · SSS 2 Mathematics</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Quadratic Equations &amp; Parabola Vertex
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <User size={14} className="text-teal-300" />
            Mrs. Funke Adewale
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock size={14} className="text-[#F59E0B]" />
            23 of 32 lessons completed (72%)
          </span>
        </div>

        <div className="w-full max-w-md h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full bg-[#0D9488] rounded-full" style={{ width: "72%" }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 shrink-0">
        <Link
          href="/subjects/mathematics"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition whitespace-nowrap"
        >
          <Play size={15} fill="white" />
          Resume Lesson
        </Link>
        <Link
          href="/live-classes/math-001"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition whitespace-nowrap"
        >
          Live Session
        </Link>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { Play, Clock, User } from "lucide-react";

export default function ContinueLearningCard() {
  return (
    <div className="learnova-banner-dark bg-architectural-grid-dark rounded-2xl text-white p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
      <div className="space-y-3 max-w-xl min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#22D3EE]">
          <span>Active Course</span>
          <span>·</span>
          <span>MTH 201 · SSS 2 Mathematics</span>
        </div>

        <h2 className="landing-display text-xl sm:text-2xl font-bold text-white">
          Quadratic Equations &amp; Parabola Vertex
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-100/80">
          <span className="inline-flex items-center gap-1.5">
            <User size={14} className="text-[#22D3EE]" />
            Mrs. Funke Adewale
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock size={14} className="text-[#C4B5FD]" />
            23 of 32 lessons completed (72%)
          </span>
        </div>

        <div className="w-full max-w-md h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] rounded-full" style={{ width: "72%" }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 shrink-0">
        <Link
          href="/subjects/mathematics"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
        >
          <Play size={15} fill="white" />
          Resume Lesson
        </Link>
        <Link
          href="/live-classes/math-001"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition whitespace-nowrap"
        >
          Live Session
        </Link>
      </div>
    </div>
  );
}
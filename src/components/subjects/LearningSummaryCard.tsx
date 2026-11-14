"use client";

import {
ArrowRight,
BookOpen,
Target,
Flame,
} from "lucide-react";


export default function LearningSummaryCard() {
  return (
    <div className="learnova-banner-dark bg-architectural-grid-dark relative overflow-hidden rounded-2xl p-6 mb-8 text-white border border-white/10 shadow-sm">
      <div className="relative z-10">
        <h2 className="landing-display text-xl font-bold">
          Your Learning Progress
        </h2>
        <p className="text-indigo-100/80 text-sm mt-1">
          Track your growth and continue improving.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
            <BookOpen className="text-[#22D3EE]" size={20} />
            <p className="mt-3 text-2xl font-extrabold tabular-nums">5</p>
            <p className="text-indigo-100/80 text-sm">Active Subjects</p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
            <Flame className="text-[#C4B5FD]" size={20} />
            <p className="mt-3 text-2xl font-extrabold tabular-nums">42</p>
            <p className="text-indigo-100/80 text-sm">Lessons Completed</p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
            <Target className="text-[#22D3EE]" size={20} />
            <p className="mt-3 text-2xl font-extrabold tabular-nums">78%</p>
            <p className="text-indigo-100/80 text-sm">Weekly Goal</p>
          </div>
        </div>

        <button className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white px-5 py-3 rounded-xl text-sm font-semibold transition shadow-xs">
          Continue Learning
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
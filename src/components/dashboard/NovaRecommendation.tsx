"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NovaRecommendation() {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-[#FAF8F3] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D97706]">
          <Sparkles size={15} />
          Nova AI Study Focus
        </div>
        <h3 className="text-lg font-bold text-[#0B1F3A]">
          Strengthen Organic Chemistry Hydrocarbons before Friday&apos;s CBT Mock
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your Chemistry score averaged 65% in recent drills. Run a 10-minute guided practice session with Nova AI on Alkane &amp; Alkene naming rules.
        </p>
      </div>

      <Link
        href="/nova"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap shrink-0"
      >
        Open Nova AI Tutor
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
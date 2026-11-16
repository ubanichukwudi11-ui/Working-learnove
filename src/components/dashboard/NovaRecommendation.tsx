"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NovaRecommendation() {
  return (
    <div className="mt-8 rounded-2xl border border-[#DCD7F5] bg-[#FAF8FF] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
          <Sparkles size={15} />
          Nova AI Study Focus
        </div>
        <h3 className="text-lg font-bold text-[#0B1230]">
          Strengthen Organic Chemistry Hydrocarbons before Friday&apos;s CBT Mock
        </h3>
        <p className="text-sm text-[#43466E] leading-relaxed">
          Your Chemistry score averaged 65% in recent drills. Run a 10-minute guided practice session with Nova AI on Alkane &amp; Alkene naming rules.
        </p>
      </div>

      <Link
        href="/nova"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap shrink-0 shadow-xs"
      >
        Open Nova AI Tutor
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
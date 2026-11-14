"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#07162B] text-white py-20 px-4 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#0D9488]/15 blur-[100px]"
      />

      <div className="relative mx-auto max-w-6xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#2DD4BF]">
            Begin This Term
          </p>
          <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-white leading-tight">
            Ready for the Second Term on Learnova?
          </h2>
          <p className="mt-3 text-slate-300 text-base leading-relaxed">
            Join as a student, teacher, parent, or school administrator and step
            into a calmer, sharper digital classroom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#07162B] px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap"
          >
            Create Free Account
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
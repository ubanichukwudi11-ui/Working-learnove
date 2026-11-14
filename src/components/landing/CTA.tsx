"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#070D24] via-[#131946] to-[#281A5E] text-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 92% 50%, rgba(124, 58, 237, 0.28), transparent 45%), radial-gradient(circle at 8% 85%, rgba(6, 182, 212, 0.16), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl rounded-3xl border border-indigo-400/25 bg-[#0A1030]/75 p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl shadow-black/35">
        <div className="max-w-2xl space-y-3">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#22D3EE]">
            Join The Learnova Campus
          </p>
          <h2 className="landing-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white leading-tight">
            Step into a sharper, calmer way to learn and teach
          </h2>
          <p className="text-indigo-100/80 text-base leading-relaxed">
            Create your free student, teacher, or parent account in minutes—or
            sign in to continue where you left off this term.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 shrink-0">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-[#7C3AED]/30 transition-all whitespace-nowrap min-h-[46px]"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/8 hover:bg-white/15 text-white px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap min-h-[46px]"
          >
            Log In
          </Link>
        </div>
      </div>
    </section>
  );
}
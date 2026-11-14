"use client";

import Logo from "@/components/branding/Logo";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  "Live interactive classes with moderated raised-hand stage",
  "WAEC, NECO & JAMB aligned JSS & SSS subjects",
  "Teacher-graded assignments, attendance & lesson notes",
  "Nova AI study tutor & low-bandwidth audio classroom mode",
];

export default function BrandingPanel() {
  return (
    <div className="relative hidden lg:flex flex-1 bg-[#070D24] bg-architectural-grid-dark text-white p-12 flex-col justify-between overflow-hidden border-r border-white/10">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-[#06B6D4]/15 blur-3xl" />

      <div className="relative z-10">
        <Logo dark variant="learnova" />

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-[#22D3EE]">
          Nigerian Digital Campus
        </p>

        <h1 className="landing-display mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white">
          Learn with clarity.
          <br />
          <span className="bg-gradient-to-r from-[#C4B5FD] to-[#22D3EE] bg-clip-text text-transparent">
            Teach with structure.
          </span>
        </h1>

        <p className="mt-4 text-indigo-100/80 text-base max-w-md leading-relaxed">
          Nigeria&apos;s structured digital learning environment for JSS &amp; SSS students, subject teachers, parents, and school administrators.
        </p>
      </div>

      <div className="relative z-10 space-y-3.5 rounded-2xl border border-white/10 bg-[#0D1438]/75 p-6">
        {highlights.map((text) => (
          <div key={text} className="flex items-center gap-3 text-sm text-indigo-100/90">
            <CheckCircle2 size={17} className="text-[#22D3EE] shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 text-xs text-indigo-200/60">
        © {new Date().getFullYear()} Learnova · Africa/Lagos (WAT)
      </div>
    </div>
  );
}
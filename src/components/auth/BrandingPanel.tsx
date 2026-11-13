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
    <div className="hidden lg:flex flex-1 bg-[#0B1F3A] text-white p-12 flex-col justify-between">
      <div>
        <Logo dark />

        <h1
          className="mt-12 text-4xl font-bold leading-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Learn with clarity.
          <br />
          Teach with structure.
        </h1>

        <p className="mt-4 text-slate-300 text-base max-w-md leading-relaxed">
          Nigeria&apos;s structured digital learning environment for JSS & SSS students, subject teachers, parents, and school administrators.
        </p>
      </div>

      <div className="space-y-3.5">
        {highlights.map((text) => (
          <div key={text} className="flex items-center gap-3 text-sm text-slate-200">
            <CheckCircle2 size={17} className="text-[#0D9488] shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400">
        © {new Date().getFullYear()} Learnova · Africa/Lagos (WAT)
      </div>
    </div>
  );
}
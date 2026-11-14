"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Logo({
  dark = false,
  href = "/",
}: {
  dark?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 shrink-0">
      <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] border border-white/15 flex items-center justify-center text-[#F59E0B] shadow-xs">
        <GraduationCap size={20} />
      </div>
      <div className="leading-none">
        <span
          className={`text-lg font-extrabold tracking-tight ${
            dark ? "text-white" : "text-[#0B1F3A]"
          }`}
        >
          Learnova
        </span>
        <span
          className={`block text-[10px] font-semibold tracking-wide mt-0.5 ${
            dark ? "text-teal-300" : "text-[#0D9488]"
          }`}
        >
          Nigeria EdTech
        </span>
      </div>
    </Link>
  );
}
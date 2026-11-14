"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Logo({
  dark = false,
  href = "/",
  variant = "learnova",
}: {
  dark?: boolean;
  href?: string;
  variant?: "default" | "learnova";
}) {
  const subtitle =
    variant === "learnova" ? "Digital Learning Campus" : "Nigeria Digital School";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 shrink-0 group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/20 text-white shadow-md shadow-[#4F46E5]/25 transition-transform duration-200 group-hover:scale-[1.03]">
        <GraduationCap size={20} />
      </div>
      <div className="leading-none">
        <span
          className={`landing-display text-lg font-extrabold tracking-tight ${
            dark ? "text-white" : "text-[#0B1230]"
          }`}
        >
          Learnova
        </span>
        <span
          className={`block text-[10px] font-semibold tracking-wide mt-0.5 ${
            dark ? "text-[#22D3EE]" : "text-[#6D28D9]"
          }`}
        >
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
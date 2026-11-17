"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function QuickLoginDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070D24] bg-architectural-grid-dark px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1438] p-8 text-center shadow-2xl shadow-[#000000]/40 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5]/20 to-[#06B6D4]/20 border border-white/10 text-[#22D3EE]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="landing-display text-2xl font-extrabold tracking-tight">
          Standard Authentication Required
        </h1>
        <p className="text-sm text-indigo-100/75 leading-relaxed">
          Instant demo quick-login has been disabled for production security. Please sign in with your verified Learnova account credentials.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3 font-semibold text-white transition"
        >
          Continue to Sign In
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

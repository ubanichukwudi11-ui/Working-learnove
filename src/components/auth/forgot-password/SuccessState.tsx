"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessState() {
  return (
    <div className="text-center space-y-3 py-2">
      <CheckCircle2 size={38} className="mx-auto text-[#0891B2]" />
      <h2 className="landing-display text-xl font-extrabold text-[#0B1230]">
        Check Your Inbox
      </h2>
      <p className="text-sm text-[#43466E] leading-relaxed">
        If an account exists for that email, we&apos;ve sent password reset instructions.
      </p>
      <div className="pt-3">
        <Link
          href="/login"
          className="inline-flex justify-center items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-sm"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
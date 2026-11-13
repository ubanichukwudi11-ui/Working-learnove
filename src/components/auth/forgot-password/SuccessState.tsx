"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessState() {
  return (
    <div className="text-center space-y-3 py-2">
      <CheckCircle2 size={38} className="mx-auto text-[#0D9488]" />
      <h2 className="text-xl font-extrabold text-[#0B1F3A]">Check Your Inbox</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        If an account exists for that email, we&apos;ve sent password reset instructions.
      </p>
      <div className="pt-3">
        <Link
          href="/login"
          className="inline-flex justify-center items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#143258]"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
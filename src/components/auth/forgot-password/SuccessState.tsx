"use client";

import Link from "next/link";

export default function SuccessState() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-5">
        ✓
      </div>

      <h2 className="text-2xl font-bold text-white">
        Email Sent
      </h2>

      <p className="mt-4 text-slate-400 leading-relaxed">
        If an account exists for your
        email, we've sent password reset
        instructions.
      </p>

      <p className="text-slate-400">
        Please check your inbox.
      </p>

      <Link
        href="/login"
        className="
          mt-8
          inline-flex
          justify-center
          items-center
          px-6
          py-3
          rounded-2xl
          font-semibold
          text-white
          bg-gradient-to-r
          from-[#6D28D9]
          to-[#06B6D4]
        "
      >
        Back to Login
      </Link>
    </div>
  );
}
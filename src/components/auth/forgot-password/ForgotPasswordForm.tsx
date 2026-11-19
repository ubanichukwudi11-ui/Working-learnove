"use client";

import Link from "next/link";
import { useState } from "react";
import { resetPassword } from "@/lib/auth";

type Props = {
  onSuccess: () => void;
};

export default function ForgotPasswordForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="landing-display text-2xl font-extrabold text-[var(--foreground)]">
          Forgot Password
        </h1>
        <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">
          Enter your email address and we&apos;ll send you a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="student@school.ng"
            className={`learnova-input w-full h-11 px-3.5 text-sm ${
              error ? "!border-rose-500" : ""
            }`}
          />
          {error && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-center pt-1">
          <Link href="/login" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </>
  );
}
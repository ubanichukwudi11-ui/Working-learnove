"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  onSuccess: () => void;
};

export default function ForgotPasswordForm({
  onSuccess,
}: Props) {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const validateEmail = () => {
    if (!email.trim()) {
      setError(
        "Email address is required"
      );
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError(
        "Enter a valid email address"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!validateEmail()) return;

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      onSuccess();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Forgot Password
        </h1>

        <p className="mt-2 text-slate-400">
          Enter your email address and
          we'll send you a password reset
          link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Enter your email"
            className={`
              w-full
              p-3
              rounded-2xl
              bg-[#0F172A]
              border
              text-white
              focus:outline-none
              transition
              ${
                error
                  ? "border-red-500"
                  : "border-slate-700 focus:border-[#6D28D9]"
              }
            `}
          />

          {error && (
            <p className="text-red-400 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            py-3
            rounded-2xl
            font-semibold
            text-white
            bg-gradient-to-r
            from-[#6D28D9]
            to-[#06B6D4]
            hover:opacity-90
            transition
            disabled:opacity-50
          "
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="
              text-sm
              text-slate-400
              hover:text-white
              transition
            "
          >
            Back to Login
          </Link>
        </div>
      </form>
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { onAuthStateChange, updatePassword } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SuccessState from "./SuccessState";

type ViewState = "request" | "sent" | "recovery" | "updated";

export default function ForgotPasswordCard() {
  const [view, setView] = useState<ViewState>("request");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkRecoveryParams() {
      const searchParams = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);

      const urlError =
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (urlError) {
        if (!cancelled) {
          setError(decodeURIComponent(urlError.replace(/\+/g, " ")));
        }
        return;
      }

      const code = searchParams.get("code");
      const mode = searchParams.get("mode");
      const hashType = hashParams.get("type");
      const hashAccessToken = hashParams.get("access_token");
      const hashRefreshToken = hashParams.get("refresh_token");

      if (isSupabaseConfigured && code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (exchangeError) {
            setError(exchangeError.message);
          } else {
            setView("recovery");
          }
        }
        return;
      }

      if (isSupabaseConfigured && hashAccessToken && hashRefreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken,
        });
        if (!cancelled) {
          if (sessionError) {
            setError(sessionError.message);
          } else if (hashType === "recovery" || mode === "recovery") {
            setView("recovery");
          }
        }
        return;
      }

      if ((hashType === "recovery" || mode === "recovery") && !cancelled) {
        setView("recovery");
      }
    }

    checkRecoveryParams();

    const {
      data: { subscription },
    } = onAuthStateChange((event) => {
      if (!cancelled && event === "PASSWORD_RECOVERY") {
        setError("");
        setView("recovery");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(newPassword);
      setView("updated");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Could not update password. Request a new reset link and try again.";
      setError(msg);
    } finally {
      setUpdating(false);
    }
  }

  if (view === "sent") {
    return (
      <div className="w-full">
        <SuccessState />
      </div>
    );
  }

  if (view === "updated") {
    return (
      <div className="w-full text-center space-y-3 py-2">
        <CheckCircle2 size={38} className="mx-auto text-cyan-600 dark:text-cyan-400" />
        <h2 className="landing-display text-xl font-extrabold text-[var(--foreground)]">
          Password Updated
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          Your Learnova password has been updated. You can now sign in with your new password.
        </p>
        <div className="pt-3">
          <Link
            href="/login"
            className="inline-flex justify-center items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (view === "recovery") {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h1 className="landing-display text-2xl font-extrabold text-[var(--foreground)]">
            Set New Password
          </h1>
          <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">
            Enter a new password for your Learnova account.
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="At least 6 characters"
                className="learnova-input w-full h-11 px-3.5 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Re-enter new password"
              className="learnova-input w-full h-11 px-3.5 text-sm"
            />
          </div>

          {error && (
            <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={updating}
            className="flex w-full items-center justify-center py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-50"
          >
            {updating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </button>

          <div className="text-center pt-1">
            <Link
              href="/login"
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}
      <ForgotPasswordForm onSuccess={() => setView("sent")} />
    </div>
  );
}
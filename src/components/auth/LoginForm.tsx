"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { login, loginWithGoogle } from "@/lib/auth";
import { sanitizePostAuthRedirect } from "@/lib/appUrl";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { useAuth } from "@/context/AuthContext";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  session_expired: "Your sign-in session expired. Please sign in again.",
  oauth_failed: "Google sign-in could not be completed. Please try again.",
};

export default function LoginForm() {
  const router = useRouter();
  const { login: saveUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next");
    if (nextParam) {
      setNextPath(nextParam);
    }

    const errParam = params.get("error");
    if (errParam) {
      setErrors((prev) => ({
        ...prev,
        general: AUTH_ERROR_MESSAGES[errParam] || errParam,
      }));
    }
  }, []);

  function validate() {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email.";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const user = await login(email, password);
      if (!user) {
        throw new Error("Unable to load user profile.");
      }

      saveUser(user);

      const roleDashboard = getDashboardRoute(user.role);
      const targetPath =
        user.role === "STUDENT" && user.needsProfileCompletion
          ? "/register/student/complete"
          : sanitizePostAuthRedirect(nextPath, roleDashboard);

      router.replace(targetPath);
      router.refresh();

      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/login") {
          window.location.assign(targetPath);
        }
      }, 450);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message ? err.message : "Unable to login.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setErrors({});
      setGoogleLoading(true);
      await loginWithGoogle(nextPath || undefined);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Failed to initiate Google sign in. Please check your Supabase configuration.";
      setErrors({ general: msg });
      setGoogleLoading(false);
    }
  }

  const isBusy = loading || googleLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md">
      <div className="text-center pb-1">
        <h2 className="landing-display text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Sign in to Learnova
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Continue your classes, assignments, and Nova AI study
        </p>
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[var(--foreground)]">
          Email Address
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="you@school.edu.ng"
          className={`w-full rounded-xl border bg-[var(--surface-lavender)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] px-3.5 py-2.5 text-sm outline-none transition ${
            errors.email
              ? "border-rose-500"
              : "border-[var(--border-strong)] focus:border-[#7C3AED] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[#7C3AED]/15"
          }`}
        />

        {errors.email && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[var(--foreground)]">
          Password
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Enter password"
            className={`w-full rounded-xl border bg-[var(--surface-lavender)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] px-3.5 py-2.5 pr-11 text-sm outline-none transition ${
              errors.password
                ? "border-rose-500"
                : "border-[var(--border-strong)] focus:border-[#7C3AED] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[#7C3AED]/15"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="rounded border-[var(--border-strong)] accent-[#4F46E5]"
          />
          Remember me
        </label>

        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {errors.general && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 p-3.5">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3 text-sm font-semibold text-white shadow-md shadow-[#4F46E5]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={17} className="mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-[var(--surface)] px-3 text-xs font-medium text-[var(--foreground-subtle)]">
            OR
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={isBusy}
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-lavender)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleLoading ? (
          <>
            <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Redirecting to Google...</span>
          </>
        ) : (
          <>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-4 w-4"
            />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-[var(--foreground-subtle)]">
        Google sign-in is available for Students &amp; Parents. Teachers sign in with educator email &amp; password above.
      </p>

      <div className="text-center text-xs text-[var(--foreground-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Create Account
        </Link>
      </div>
    </form>
  );
}
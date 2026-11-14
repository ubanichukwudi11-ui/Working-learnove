"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { login } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();

  const { login: saveUser } =
    useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] =
    useState<Record<string, string>>(
      {}
    );

  function validate() {
    const newErrors: Record<
      string,
      string
    > = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      newErrors.email =
        "Enter a valid email.";
    }

    if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length ===
      0
    );
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
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

      let targetPath = "/dashboard";
      switch (user.role) {
        case "SUPER_ADMIN":
          targetPath = "/super-admin";
          break;

        case "ADMIN":
          targetPath = "/admin";
          break;

        case "TEACHER":
          targetPath = "/teacher";
          break;

        case "PARENT":
          targetPath = "/parent";
          break;

        default:
          targetPath = "/dashboard";
      }

      router.push(targetPath);
      router.refresh();

      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/login") {
          window.location.assign(targetPath);
        }
      }, 400);
    } catch (err: any) {
      setErrors({
        general:
          err.message ??
          "Unable to login.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    try {
      setErrors({});
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrors({
        general:
          err.message ??
          "Failed to initiate Google sign in. Please check your Supabase configuration.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 w-full max-w-md"
    >
      <div className="text-center pb-1">
        <h2 className="landing-display text-2xl font-extrabold tracking-tight text-[#0B1230]">
          Sign in to Learnova
        </h2>
        <p className="text-sm text-[#43466E] mt-1">
          Continue your classes, assignments, and Nova AI study
        </p>
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#0B1230]">
          Email Address
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({
              ...prev,
              email: "",
            }));
          }}
          placeholder="you@school.edu.ng"
          className={`w-full rounded-xl border bg-[#FAF8FF] text-[#0B1230] placeholder:text-[#6B6F94] px-3.5 py-2.5 text-sm outline-none transition ${
            errors.email
              ? "border-red-500"
              : "border-[#DCD7F5] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
          }`}
        />

        {errors.email && (
          <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#0B1230]">
          Password
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: "",
              }));
            }}
            placeholder="Enter password"
            className={`w-full rounded-xl border bg-[#FAF8FF] text-[#0B1230] placeholder:text-[#6B6F94] px-3.5 py-2.5 pr-11 text-sm outline-none transition ${
              errors.password
                ? "border-red-500"
                : "border-[#DCD7F5] focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94] hover:text-[#4F46E5] transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-[#43466E]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="rounded border-[#DCD7F5] accent-[#4F46E5]"
          />
          Remember me
        </label>

        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-[#6D28D9] hover:text-[#4F46E5] hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="text-xs font-medium text-red-700">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
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
          <div className="w-full border-t border-[#E4E1F5]" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-[#6B6F94]">
            OR
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#DCD7F5] bg-white py-2.5 text-sm font-semibold text-[#0B1230] transition hover:bg-[#FAF8FF] hover:border-[#C4B5FD]"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="h-4 w-4"
        />
        <span>Continue with Google</span>
      </button>

      <div className="text-center text-xs text-[#43466E]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#6D28D9] hover:text-[#4F46E5] hover:underline"
        >
          Create Account
        </Link>
      </div>
    </form>
  );
}
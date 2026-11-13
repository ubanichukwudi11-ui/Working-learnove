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
      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#0F1F38]">
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
          className={`w-full rounded-xl border bg-[#F7F8FA] text-[#0F1F38] placeholder:text-slate-400 px-3.5 py-2.5 text-sm outline-none transition ${
            errors.email
              ? "border-red-500"
              : "border-slate-300 focus:border-[#0B1F3A] focus:bg-white"
          }`}
        />

        {errors.email && (
          <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#0F1F38]">
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
            className={`w-full rounded-xl border bg-[#F7F8FA] text-[#0F1F38] placeholder:text-slate-400 px-3.5 py-2.5 pr-11 text-sm outline-none transition ${
              errors.password
                ? "border-red-500"
                : "border-slate-300 focus:border-[#0B1F3A] focus:bg-white"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3A] transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="rounded border-slate-300 accent-[#0B1F3A]"
          />
          Remember me
        </label>

        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-[#0D9488] hover:underline"
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
        className="flex w-full items-center justify-center rounded-xl bg-[#0B1F3A] hover:bg-[#143258] py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="w-full border-t border-slate-200" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-slate-400">
            OR
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-[#0F1F38] transition hover:bg-slate-50"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="h-4 w-4"
        />
        <span>Continue with Google</span>
      </button>

      <div className="text-center text-xs text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#0D9488] hover:underline"
        >
          Create Account
        </Link>
      </div>
    </form>
  );
}
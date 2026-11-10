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

    switch (user.role) {
      case "ADMIN":
        router.push("/admin");
        break;

      case "TEACHER":
        router.push("/teacher");
        break;

      case "PARENT":
        router.push("/parent");
        break;

      default:
        router.push("/dashboard");
    }
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
      className="space-y-6 w-full max-w-md"
    >

      <div>

        <label className="block mb-2 text-sm text-slate-300">
          Email Address
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(
              e.target.value
            );

            setErrors((prev) => ({
              ...prev,
              email: "",
            }));
          }}
          placeholder="Enter your email"
          className={`
            w-full
            rounded-2xl
            border
            bg-slate-900
            text-white
            placeholder:text-slate-500
            p-3
            outline-none
            transition
            ${
              errors.email
                ? "border-red-500"
                : "border-slate-700 focus:border-cyan-500"
            }
          `}
        />

        {errors.email && (
          <p className="mt-2 text-sm text-red-400">
            {errors.email}
          </p>
        )}

      </div>

      <div>

        <label className="block mb-2 text-sm text-slate-300">
          Password
        </label>

        <div className="relative">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) => {
              setPassword(
                e.target.value
              );

              setErrors((prev) => ({
                ...prev,
                password: "",
              }));
            }}
            placeholder="Enter password"
            className={`
              w-full
              rounded-2xl
              border
              bg-slate-900
              text-white
              placeholder:text-slate-500
              p-3
              pr-12
              outline-none
              transition
              ${
                errors.password
                  ? "border-red-500"
                  : "border-slate-700 focus:border-cyan-500"
              }
            `}
          />
                    <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-slate-400
              hover:text-white
              transition
            "
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>

        </div>

        {errors.password && (
          <p className="mt-2 text-sm text-red-400">
            {errors.password}
          </p>
        )}

      </div>

      <div className="flex items-center justify-between">

        <label className="flex items-center gap-2 text-sm text-slate-300">

          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() =>
              setRememberMe(
                !rememberMe
              )
            }
            className="rounded"
          />

          Remember me

        </label>

        <Link
          href="/forgot-password"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Forgot Password?
        </Link>

      </div>

      {errors.general && (

        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">

          <p className="text-sm text-red-400">

            {errors.general}

          </p>

        </div>

      )}

      <button
        type="submit"
        disabled={loading}
        className="
          flex
          w-full
          items-center
          justify-center
          rounded-2xl
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          py-3
          font-semibold
          text-white
          transition
          hover:opacity-90
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >

        {loading ? (

          <>

            <Loader2
              size={18}
              className="mr-2 animate-spin"
            />

            Signing In...

          </>

        ) : (

          "Sign In"

        )}

      </button>

      <div className="relative">

        <div className="absolute inset-0 flex items-center">

          <div className="w-full border-t border-slate-700" />

        </div>

        <div className="relative flex justify-center">

          <span className="bg-[#111827] px-4 text-sm text-slate-500">

            OR

          </span>

        </div>

      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="
          flex
          w-full
          items-center
          justify-center
          gap-3
          rounded-2xl
          border
          border-slate-300
          bg-white
          py-3
          font-medium
          text-slate-900
          transition
          hover:bg-slate-100
        "
      >

        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="h-5 w-5"
        />

        <span>
          Continue with Google
        </span>

      </button>

      <div className="text-center text-sm text-slate-400">

        Don't have an account?{" "}

        <Link
          href="/register"
          className="font-medium text-cyan-400 hover:text-cyan-300"
        >

          Create Account

        </Link>

      </div>

    </form>

  );
}
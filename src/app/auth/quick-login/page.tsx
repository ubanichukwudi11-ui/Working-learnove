"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

function QuickLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: saveUser } = useAuth();
  const [status, setStatus] = useState("Authenticating...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function performQuickLogin() {
      try {
        const targetRole = searchParams.get("role") || "student";
        const email =
          targetRole === "admin"
            ? "ubanichukwudi11@gmail.com"
            : targetRole === "teacher"
            ? "ub@gmail.com"
            : "ubanichukwudi20@gmail.com";

        setStatus(`Logging in as ${email}...`);

        const user = await login(email, "Password123!");
        if (!user) {
          throw new Error("Could not retrieve user profile.");
        }

        saveUser(user);

        if (typeof window !== "undefined") {
          localStorage.setItem("learnova_user", JSON.stringify(user));
        }

        if (!isMounted) return;

        setStatus("Logged in! Redirecting to dashboard...");

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
        if (!isMounted) return;
        setError(err?.message || "Failed to log in automatically.");
      }
    }

    performQuickLogin();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, saveUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070D24] bg-architectural-grid-dark px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1438] p-8 text-center shadow-2xl shadow-[#000000]/40">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5]/20 to-[#06B6D4]/20 border border-white/10 text-[#22D3EE]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="landing-display text-2xl font-extrabold tracking-tight">
          Instant Sign In
        </h2>
        <p className="mt-2 text-sm text-indigo-100/75">
          {error ? (
            <span className="text-red-400">{error}</span>
          ) : (
            status
          )}
        </p>

        {error && (
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3 font-semibold text-white transition"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuickLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070D24] bg-architectural-grid-dark text-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#22D3EE]" />
        </div>
      }
    >
      <QuickLoginContent />
    </Suspense>
  );
}

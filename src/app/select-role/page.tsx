"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Users, School } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

type Role = "STUDENT" | "TEACHER" | "PARENT";

export default function SelectRolePage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setErrorMsg(SUPABASE_CONFIG_ERROR);
          setCheckingSession(false);
        }
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled && !session?.access_token) {
          router.replace("/login?error=session_expired");
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function chooseRole(role: Role) {
    try {
      setErrorMsg(null);
      if (!isSupabaseConfigured) {
        setErrorMsg(SUPABASE_CONFIG_ERROR);
        return;
      }
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login?error=session_expired");
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let res: Response;
      try {
        res = await fetch("/api/auth/select-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: session.access_token,
            role,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || "Could not complete role setup. Please try again.");
      }

      saveUser(data.user);
      const destination = getDashboardRoute(data.user.role);
      router.replace(destination);
      router.refresh();
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/select-role") {
          window.location.replace(destination);
        }
      }, 500);
    } catch (error: unknown) {
      const isAbort =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"));
      const msg = isAbort
        ? "Workspace setup timed out. Please try selecting your role again."
        : error instanceof Error
        ? error.message
        : "Could not complete role setup. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F4FB] bg-learnova-dots-lavender text-[#0B1230]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#4F46E5] border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-[#43466E]">
            Preparing account setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F4FB] bg-learnova-dots-lavender px-5 sm:px-6 py-12 flex items-center justify-center">
      <div className="mx-auto max-w-5xl w-full">
        <div className="flex justify-center mb-6">
          <Logo href="/" variant="learnova" />
        </div>

        <div className="text-center mb-10">
          <h1 className="landing-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1230]">
            Welcome to Learnova
          </h1>
          <p className="mt-2 text-sm text-[#43466E] max-w-lg mx-auto">
            Select how you will use Learnova to finish setting up your workspace.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 max-w-xl mx-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <button
            disabled={loading}
            onClick={() => chooseRole("STUDENT")}
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 text-left hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#4F46E5]/8 transition-all disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center mb-5 shadow-md shadow-[#4F46E5]/20">
              <GraduationCap size={24} />
            </div>
            <h2 className="landing-display text-xl font-extrabold text-[#0B1230] group-hover:text-[#4F46E5] transition-colors">
              Student
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#43466E]">
              Join live classes, study with Nova AI, complete assignments, and track your academic progress.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => chooseRole("TEACHER")}
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 text-left hover:border-[#4F46E5] hover:shadow-lg hover:shadow-[#4F46E5]/8 transition-all disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B1230] to-[#151A44] text-[#22D3EE] flex items-center justify-center mb-5 shadow-md shadow-[#0B1230]/15">
              <School size={24} />
            </div>
            <h2 className="landing-display text-xl font-extrabold text-[#0B1230] group-hover:text-[#4F46E5] transition-colors">
              Teacher
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#43466E]">
              Teach students, host interactive live classrooms, upload notes, and manage assessments.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => chooseRole("PARENT")}
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 text-left hover:border-[#06B6D4] hover:shadow-lg hover:shadow-[#06B6D4]/8 transition-all disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0891B2] to-[#06B6D4] text-white flex items-center justify-center mb-5 shadow-md shadow-[#06B6D4]/20">
              <Users size={24} />
            </div>
            <h2 className="landing-display text-xl font-extrabold text-[#0B1230] group-hover:text-[#0891B2] transition-colors">
              Parent
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#43466E]">
              Monitor your child&apos;s attendance, continuous assessment scores, and live schedule.
            </p>
          </button>
        </div>

        {loading && (
          <div className="mt-8 text-center text-xs font-bold text-[#6D28D9]">
            Setting up your Learnova workspace...
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-xs font-semibold text-[#6D28D9] hover:underline">
            Cancel and return to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
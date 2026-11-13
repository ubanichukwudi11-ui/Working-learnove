"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Users, School } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/branding/Logo";

type Role = "STUDENT" | "TEACHER" | "PARENT";

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function chooseRole(role: Role) {
    try {
      setErrorMsg(null);
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const fullName =
        user.user_metadata?.full_name || user.user_metadata?.name || "";
      const avatar = user.user_metadata?.avatar_url || "";

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatar,
        role,
        status: role === "TEACHER" ? "PENDING" : "ACTIVE",
      });

      if (profileError) throw profileError;

      if (role === "STUDENT") {
        const { error } = await supabase.from("student_profiles").upsert({ id: user.id });
        if (error) throw error;
        router.replace("/dashboard");
        return;
      }

      if (role === "PARENT") {
        const { error } = await supabase.from("parent_profiles").upsert({ id: user.id });
        if (error) throw error;
        router.replace("/parent");
        return;
      }

      if (role === "TEACHER") {
        const { error } = await supabase
          .from("teacher_profiles")
          .upsert({ id: user.id, status: "PENDING" });
        if (error) throw error;
        router.replace("/register/teacher");
      }
    } catch (error: any) {
      setErrorMsg(error?.message || "Could not complete role setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-6 py-14 flex items-center justify-center">
      <div className="mx-auto max-w-5xl w-full">
        <div className="flex justify-center mb-6">
          <Logo href="/" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            Welcome to Learnova
          </h1>
          <p className="mt-2 text-sm text-slate-600">
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
            className="rounded-2xl border border-slate-200 bg-white p-7 text-left hover:border-[#0D9488] transition disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mb-5">
              <GraduationCap size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-[#0B1F3A]">Student</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Join live classes, study with Nova AI, complete assignments, and track your academic progress.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => chooseRole("TEACHER")}
            className="rounded-2xl border border-slate-200 bg-white p-7 text-left hover:border-[#0B1F3A] transition disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/10 text-[#0B1F3A] flex items-center justify-center mb-5">
              <School size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-[#0B1F3A]">Teacher</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Teach students, host interactive live classrooms, upload notes, and manage assessments.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => chooseRole("PARENT")}
            className="rounded-2xl border border-slate-200 bg-white p-7 text-left hover:border-[#D97706] transition disabled:opacity-50 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center mb-5">
              <Users size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-[#0B1F3A]">Parent</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Monitor your child&apos;s attendance, continuous assessment scores, and live schedule.
            </p>
          </button>
        </div>

        {loading && (
          <div className="mt-8 text-center text-xs font-bold text-[#0D9488]">
            Setting up your Learnova workspace...
          </div>
        )}
      </div>
    </main>
  );
}
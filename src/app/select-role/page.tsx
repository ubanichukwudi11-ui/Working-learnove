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
      </div>
    </main>
  );
}
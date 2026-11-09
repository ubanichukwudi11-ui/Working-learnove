"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      // Wait for Supabase to finish restoring the session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const user = session.user;

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // No profile yet → choose a role
      if (!profile || !profile.role) {
          router.replace("/select-role");
          return;
      }

      switch (profile.role) {
        case "ADMIN":
          router.replace("/admin");
          break;

        case "TEACHER":
          router.replace("/teacher");
          break;

        case "PARENT":
          router.replace("/parent");
          break;

        case "STUDENT":
          router.replace("/dashboard");
          break;

        default:
          router.replace("/select-role");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />

        <p className="mt-6 text-slate-400">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
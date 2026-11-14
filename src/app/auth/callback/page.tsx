"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      // Exchange OAuth access token for authoritative server profile & httpOnly cookie
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      if (sessionRes.ok) {
        const data = await sessionRes.json();
        const role = data?.user?.role;
        if (role === "SUPER_ADMIN") {
          router.replace("/super-admin");
          return;
        }
        if (role === "ADMIN") {
          router.replace("/admin");
          return;
        }
        if (role === "TEACHER") {
          router.replace("/teacher");
          return;
        }
        if (role === "PARENT") {
          router.replace("/parent");
          return;
        }
        if (role === "STUDENT") {
          router.replace("/dashboard");
          return;
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile || !profile.role) {
        router.replace("/select-role");
        return;
      }

      switch (profile.role) {
        case "SUPER_ADMIN":
          router.replace("/super-admin");
          break;
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
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] text-[#0B1F3A]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#0D9488] border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase";
import { sanitizePostAuthRedirect } from "@/lib/appUrl";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

function waitForSupabaseSession(timeoutMs = 4500) {
  return new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(
    (resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          subscription.unsubscribe();
          resolve(null);
        }
      }, timeoutMs);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!settled && session?.access_token) {
          settled = true;
          clearTimeout(timer);
          subscription.unsubscribe();
          resolve(session);
        }
      });
    }
  );
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();
  const routerRef = useRef(router);
  const saveUserRef = useRef(saveUser);

  useEffect(() => {
    routerRef.current = router;
    saveUserRef.current = saveUser;
  }, [router, saveUser]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Completing sign in...");

  useEffect(() => {
    let active = true;
    const fetchController = new AbortController();

    function navigateTo(destination: string) {
      routerRef.current.replace(destination);
      setTimeout(() => {
        if (
          typeof window !== "undefined" &&
          window.location.pathname === "/auth/callback"
        ) {
          window.location.replace(destination);
        }
      }, 500);
    }

    async function handleCallback() {
      try {
        if (!isSupabaseConfigured) {
          throw new Error(SUPABASE_CONFIG_ERROR);
        }

        const searchParams = new URLSearchParams(window.location.search);
        const rawHash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);

        const oauthError =
          searchParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error_description") ||
          hashParams.get("error");

        if (oauthError) {
          throw new Error(decodeURIComponent(oauthError.replace(/\+/g, " ")));
        }

        const flowType = searchParams.get("type") || hashParams.get("type");
        const authCode = searchParams.get("code");

        if (flowType === "recovery") {
          setStatusMessage("Preparing password recovery...");
          if (authCode) {
            await supabase.auth.exchangeCodeForSession(authCode);
          } else {
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          }
          if (active) {
            navigateTo("/forgot-password?mode=recovery");
          }
          return;
        }

        let {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token && authCode) {
          setStatusMessage("Verifying Google authorization...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
          if (error) {
            throw error;
          }
          session = data.session;
        }

        if (!session?.access_token) {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              throw error;
            }
            session = data.session;
          }
        }

        if (!session?.access_token) {
          session = await waitForSupabaseSession(4500);
        }

        if (!session?.access_token) {
          throw new Error(
            "No active authentication session was returned. Please verify your Supabase Redirect URLs include this domain and try signing in again."
          );
        }

        if (!active) return;
        setStatusMessage("Loading your Learnova profile...");

        const fetchTimer = setTimeout(() => {
          fetchController.abort();
        }, 12000);

        let sessionRes: Response;
        try {
          sessionRes = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: session.access_token }),
            signal: fetchController.signal,
          });
        } finally {
          clearTimeout(fetchTimer);
        }

        const data = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok || !data?.user) {
          try {
            await supabase.auth.signOut({ scope: "local" });
          } catch {}
          throw new Error(data?.error || "Could not finalize your Learnova session.");
        }

        if (!active) return;
        saveUserRef.current(data.user);

        let storedNext: string | null = null;
        try {
          storedNext = sessionStorage.getItem("learnova_post_auth_next");
          sessionStorage.removeItem("learnova_post_auth_next");
        } catch {}

        const rawNext = searchParams.get("next") || storedNext;

        if (data.needsRoleSelection) {
          if (rawNext) {
            try {
              sessionStorage.setItem("learnova_post_auth_next", rawNext);
            } catch {}
          }
          navigateTo("/select-role");
          return;
        }

        if (data.user.role === "STUDENT" && data.user.needsProfileCompletion) {
          if (rawNext) {
            try {
              sessionStorage.setItem("learnova_post_auth_next", rawNext);
            } catch {}
          }
          navigateTo("/register/student/complete");
          return;
        }

        const roleDashboard = getDashboardRoute(data.user.role);
        const destination = sanitizePostAuthRedirect(rawNext, roleDashboard);
        navigateTo(destination);
      } catch (err: unknown) {
        if (!active) return;
        const isAbort =
          err instanceof Error &&
          (err.name === "AbortError" || err.message.toLowerCase().includes("aborted"));
        const msg = isAbort
          ? "Loading your profile timed out. Please try signing in again."
          : err instanceof Error && err.message
          ? err.message
          : "Sign in could not be completed. Please try again.";
        setErrorMessage(msg);
      }
    }

    handleCallback();
    return () => {
      active = false;
      fetchController.abort();
    };
  }, []);

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F4FB] bg-learnova-dots-lavender px-5 text-[#0B1230]">
        <div className="w-full max-w-md rounded-2xl border border-[#E4E1F5] bg-white p-8 shadow-xl shadow-[#0B1230]/6 text-center space-y-5">
          <div className="flex justify-center">
            <Logo href="/" variant="learnova" />
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="landing-display text-xl font-extrabold text-[#0B1230]">
              Authentication Error
            </h1>
            <p className="text-xs leading-relaxed text-[#43466E]">{errorMessage}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/login"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#4338CA] hover:to-[#6D28D9] transition"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
            <Link
              href="/register"
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-[#DCD7F5] bg-white px-4 py-2.5 text-xs font-bold text-[#0B1230] hover:bg-[#FAF8FF] transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4FB] bg-learnova-dots-lavender text-[#0B1230]">
      <div className="text-center px-6">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#4F46E5] border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-[#43466E]">{statusMessage}</p>
      </div>
    </div>
  );
}
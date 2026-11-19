"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Clock,
  FileBadge2,
  Settings,
  Bell,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/getDashboardRoute";

const UNVERIFIED_TEACHER_ALLOWED_PREFIXES = [
  "/teacher/applications",
  "/teacher/profile",
  "/notifications",
  "/settings",
  "/profile",
];

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export default function ProtectedRoute({ children, roles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const shouldCompleteStudentProfile =
    !loading &&
    user?.role === "STUDENT" &&
    Boolean(user.needsProfileCompletion) &&
    pathname !== "/register/student/complete";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (shouldCompleteStudentProfile) {
      router.replace("/register/student/complete");
    }
  }, [user, loading, router, shouldCompleteStudentProfile]);

  if (loading || shouldCompleteStudentProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] bg-learnova-dots-lavender">
        <div className="text-center space-y-2.5">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#4F46E5] border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-[var(--foreground-muted)]">
            {shouldCompleteStudentProfile
              ? "Opening your student profile setup..."
              : "Verifying your Learnova session..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (roles && !roles.includes(user.role)) {
    const homeHref = getDashboardRoute(user.role);
    return (
      <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl learnova-glass-panel p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <h1 className="landing-display text-xl font-extrabold text-[var(--foreground)]">
            Access Restricted
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Your signed-in role (<strong>{user.role.replace("_", " ")}</strong>) does not have permission to open this workspace.
          </p>
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft size={14} />
            Return to Your Workspace
          </Link>
        </div>
      </div>
    );
  }

  const isAllowedForUnverifiedTeacher = UNVERIFIED_TEACHER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  const isGatedTeacherRoute =
    user.role === "TEACHER" &&
    user.status !== "ACTIVE" &&
    !isAllowedForUnverifiedTeacher;

  if (isGatedTeacherRoute) {
    const isRejectedOrSuspended =
      user.status === "REJECTED" || user.status === "SUSPENDED";
    return (
      <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl learnova-glass-panel p-8 sm:p-10 text-center space-y-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              isRejectedOrSuspended
                ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/12 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isRejectedOrSuspended ? <ShieldAlert size={26} /> : <Clock size={26} />}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
              Educator Verification Gate · Status: {user.status}
            </p>
            <h1 className="landing-display text-2xl font-extrabold text-[var(--foreground)]">
              {user.status === "SUSPENDED"
                ? "Educator Account Suspended"
                : user.status === "REJECTED"
                ? "Application Requires Attention"
                : "Your Application Is Awaiting Admin Verification"}
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-md mx-auto">
              {user.status === "SUSPENDED"
                ? "Your educator account is currently suspended. Live classes, video publishing, attendance, and student cohorts are locked until an administrator reactivates your account."
                : user.status === "REJECTED"
                ? "Your current educator verification application was not approved. Open Application Status to review administrator feedback or resubmit updated credentials."
                : "To protect student learning quality, the Educator Dashboard, classrooms, and curriculum publishing tools remain locked until School Administration verifies your credentials and approves your teaching subjects."}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5 text-left pt-1">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-[11px] font-bold text-[#4F46E5] dark:text-[#A5B4FC] flex items-center gap-1.5">
                <FileBadge2 size={13} /> 1. Credentials
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                Submitted for admin document review
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock size={13} /> 2. Verification
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                Subject &amp; class-level approval
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <UserCheck size={13} /> 3. Dashboard
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                Full studio &amp; classroom unlock
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/teacher/applications"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
            >
              <FileBadge2 size={14} />
              Open Application Portal
            </Link>
            <Link
              href="/notifications"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--surface-lavender)] transition"
            >
              <Bell size={14} />
              Notifications
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--surface-lavender)] transition"
            >
              <Settings size={14} />
              Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
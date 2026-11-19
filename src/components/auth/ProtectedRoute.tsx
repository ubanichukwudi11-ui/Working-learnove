"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Clock, FileBadge2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/getDashboardRoute";

const GATED_TEACHER_PREFIXES = [
  "/teacher/classes",
  "/teacher/live-class",
  "/teacher/attendance",
  "/teacher/notes",
  "/teacher/assignments",
  "/teacher/students",
  "/teacher/videos",
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
        <div className="max-w-md w-full rounded-2xl learnova-card p-8 text-center space-y-4">
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

  const isGatedTeacherRoute =
    user.role === "TEACHER" &&
    user.status !== "ACTIVE" &&
    GATED_TEACHER_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );

  if (isGatedTeacherRoute) {
    const isRejectedOrSuspended =
      user.status === "REJECTED" || user.status === "SUSPENDED";
    return (
      <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl learnova-card p-8 text-center space-y-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
              isRejectedOrSuspended
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            }`}
          >
            {isRejectedOrSuspended ? <ShieldAlert size={24} /> : <Clock size={24} />}
          </div>
          <h1 className="landing-display text-xl font-extrabold text-[var(--foreground)]">
            {isRejectedOrSuspended
              ? "Educator Account Approval Required"
              : "Verification Pending School Admin Approval"}
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            {isRejectedOrSuspended
              ? `Your educator account is currently marked ${user.status.toLowerCase()}. Live teaching and student management tools remain locked until a School Administrator approves your subject application.`
              : "Your teacher credentials are currently under review by School Administration. Live classes, attendance, notes, and student tools will unlock once your account is approved."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/teacher/applications"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
            >
              <FileBadge2 size={14} />
              View My Applications
            </Link>
            <Link
              href="/teacher"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--surface-lavender)] transition"
            >
              <ArrowLeft size={14} />
              Teacher Desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { CardSkeleton, EmptyState, PageHeader } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_ACADEMIC_TERM, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import {
  Award,
  BookOpen,
  GraduationCap,
  LogOut,
  Shield,
  Video,
} from "lucide-react";

export default function TeacherProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  const loadTeacherDetails = useCallback(async () => {
    try {
      const [roomRes, appRes] = await Promise.all([
        fetch("/api/lms/classrooms", { cache: "no-store" }),
        fetch("/api/lms/teacher-applications", { cache: "no-store" }),
      ]);
      const rmJson = roomRes.ok ? await roomRes.json() : {};
      const appJson = appRes.ok ? await appRes.json() : {};
      setClassrooms(rmJson.classrooms || []);
      setApprovals((appJson.approvals || []).filter((a: any) => a.status === "APPROVED"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherDetails();
  }, [loadTeacherDetails]);

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="max-w-4xl space-y-6">
          <PageHeader
            kicker={CURRENT_ACADEMIC_TERM}
            title="Educator Profile & Teaching Allocation"
            description="Review your approved subjects, allocated cohorts, appearance preferences, and account security."
            breadcrumbs={[
              { label: "Educator Home", href: "/teacher" },
              { label: "Profile" },
            ]}
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/profile?tab=security"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition"
                >
                  <Shield size={14} />
                  Security &amp; Edit
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-rose-500/80 border border-white/20 text-white text-xs font-bold transition"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            }
          />

          <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap size={26} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--foreground)] truncate">
                  {user?.fullName || "Educator"}
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] truncate">{user?.email}</p>
                <p className="text-xs font-semibold text-[#4F46E5] dark:text-[#A5B4FC] mt-0.5">
                  Verified Educator · {TIMEZONE_LABEL}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/settings?tab=appearance"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--foreground)] transition"
              >
                Theme &amp; Settings →
              </Link>
            </div>
          </div>

          {loading ? (
            <CardSkeleton rows={3} />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="learnova-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Award size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                    Approved Subject Authorizations ({approvals.length})
                  </h3>
                  <Link
                    href="/teacher/applications"
                    className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                  >
                    Apply →
                  </Link>
                </div>

                {approvals.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Award}
                    title="No Subject Authorizations Yet"
                    description="Submit a subject application to be approved by School Admin."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {approvals.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] px-4 py-3 text-sm"
                      >
                        <p className="font-bold text-[var(--foreground)]">
                          {app.subjectName || app.subjectId}
                        </p>
                        <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                          {app.classLevelName || "Allocated Level"} · Approved
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="learnova-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                    <BookOpen size={17} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                    Allocated Cohorts ({classrooms.length})
                  </h3>
                  <Link
                    href="/teacher/classes"
                    className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                  >
                    Manage →
                  </Link>
                </div>

                {classrooms.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Video}
                    title="No Classrooms Assigned Yet"
                    description="Once School Admin assigns timetable groups, your cohorts appear here."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {classrooms.map((rm) => (
                      <Link
                        key={rm.id}
                        href={`/teacher/live-class/${rm.id}`}
                        className="block rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] hover:border-[var(--border-strong)] px-4 py-3 text-sm transition"
                      >
                        <p className="font-bold text-[var(--foreground)]">
                          {rm.subjectName} · {rm.classLevelName} ({rm.groupName})
                        </p>
                        <p className="text-xs text-[var(--foreground-subtle)] mt-0.5 tabular-nums">
                          {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT ·{" "}
                          {rm.studentUserIds?.length || 0} students
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

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
  FileBadge2,
  GraduationCap,
  LogOut,
  Settings,
  Shield,
  Video,
} from "lucide-react";

export default function TeacherProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  const isVerified = user?.status === "ACTIVE";

  const loadTeacherDetails = useCallback(async () => {
    try {
      const appPromise = fetch("/api/lms/teacher-applications", { cache: "no-store" });
      const roomPromise =
        user?.role === "TEACHER" && user?.status !== "ACTIVE"
          ? Promise.resolve(null)
          : fetch("/api/lms/classrooms", { cache: "no-store" });

      const [roomRes, appRes] = await Promise.all([roomPromise, appPromise]);
      const rmJson = roomRes && roomRes.ok ? await roomRes.json() : {};
      const appJson = appRes.ok ? await appRes.json() : {};
      setClassrooms(rmJson.classrooms || []);
      setApprovals((appJson.approvals || []).filter((a: any) => a.status === "APPROVED"));
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.status]);

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
            description="Review your verification status, academic qualifications, approved subjects, and allocated cohorts."
            breadcrumbs={[
              ...(isVerified
                ? [{ label: "Educator Home", href: "/teacher" }]
                : [{ label: "Application Portal", href: "/teacher/applications" }]),
              { label: "Profile" },
            ]}
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition"
                >
                  <Settings size={14} />
                  Settings &amp; Appearance
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition"
                >
                  <Shield size={14} />
                  Edit Contact Info
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

          <div className="learnova-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    {isVerified
                      ? `Verified Educator · ${TIMEZONE_LABEL}`
                      : `Verification Status: ${user?.status || "PENDING"} · ${TIMEZONE_LABEL}`}
                  </p>
                </div>
              </div>

              <Link
                href="/teacher/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] text-xs font-bold text-[var(--foreground)] hover:border-[#4F46E5] transition shrink-0"
              >
                <FileBadge2 size={14} />
                Application &amp; Credentials
              </Link>
            </div>

            {(user?.qualification || user?.institution || user?.bio) && (
              <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)] text-xs">
                <div>
                  <p className="text-[var(--foreground-subtle)] font-semibold">Qualification</p>
                  <p className="font-bold text-[var(--foreground)] mt-0.5">
                    {user.qualification || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--foreground-subtle)] font-semibold">Institution</p>
                  <p className="font-bold text-[var(--foreground)] mt-0.5">
                    {user.institution || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--foreground-subtle)] font-semibold">TRCN / Experience</p>
                  <p className="font-bold text-[var(--foreground)] mt-0.5">
                    {[user.experience, user.licenseNumber].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {user.bio && (
                  <div className="sm:col-span-3 pt-1">
                    <p className="text-[var(--foreground-subtle)] font-semibold">Teaching Bio</p>
                    <p className="text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                      {user.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
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
                    Manage →
                  </Link>
                </div>

                {approvals.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Award}
                    title="No Subject Authorizations Yet"
                    description="Submit or monitor your subject application for School Admin approval."
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
                  {isVerified && (
                    <Link
                      href="/teacher/classes"
                      className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                    >
                      Manage →
                    </Link>
                  )}
                </div>

                {classrooms.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Video}
                    title={isVerified ? "No Classrooms Assigned Yet" : "Awaiting Educator Approval"}
                    description={
                      isVerified
                        ? "Once School Admin assigns timetable groups, your cohorts appear here."
                        : "Classroom allocations become accessible once your educator account is approved."
                    }
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

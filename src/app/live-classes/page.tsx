"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import {
  Video,
  Users,
  Clock,
  Play,
  Wifi,
  Lock,
  MonitorCheck,
  BookOpen,
} from "lucide-react";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "live" | "scheduled">("all");

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/live-classes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setClasses(Array.isArray(data.classes) ? data.classes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    const timer = setInterval(loadClasses, 8000);
    return () => clearInterval(timer);
  }, [loadClasses]);

  const filteredClasses = classes.filter((c) => {
    if (filter === "live") return c.status === "live";
    if (filter === "scheduled") return c.status === "scheduled" || c.status === "waiting";
    return true;
  });

  const featuredClass = classes.find((c) => c.status === "live") || classes[0];

  const lifecycleLabel = (cls: any) => {
    switch (cls.lifecycleStatus) {
      case "LIVE":
        return { text: "LIVE NOW" };
      case "PREPARED":
        return { text: "Prepared · Waiting for Teacher" };
      case "ENDED":
        return { text: "Class Ended" };
      case "CANCELLED":
        return { text: "Class Cancelled" };
      default:
        return { text: "Scheduled · Waiting for Teacher" };
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-7">
          {/* Header */}
          <PageHeader
            eyebrow="Africa/Lagos (WAT) · Group-Isolated Classrooms"
            title="Learnova Live Classrooms"
            description={
              isAdmin
                ? "Administrators monitor classroom operations in the Classroom Control Centre. Private audio & video streams remain restricted to assigned teachers and entitled students."
                : isTeacher
                ? "Open your assigned classroom groups from your official timetable, prepare lesson notes, and start live sessions."
                : "Join only your allocated classroom group when your teacher starts the lesson. Switch to Audio-Only mode on low mobile bandwidth."
            }
            actions={
              isAdmin ? (
                <Link
                  href="/admin/classrooms"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shrink-0 shadow-[0_6px_18px_rgba(79,70,229,0.28)] transition whitespace-nowrap"
                >
                  <MonitorCheck size={15} />
                  Open Classroom Control Centre
                </Link>
              ) : isTeacher ? (
                <Link
                  href="/teacher/classes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shrink-0 shadow-[0_6px_18px_rgba(79,70,229,0.28)] transition whitespace-nowrap"
                >
                  <BookOpen size={15} />
                  Prepare &amp; Manage My Classes
                </Link>
              ) : undefined
            }
          />

          <div className="learnova-card px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[var(--foreground)]">
              <Wifi size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>
                <strong>Nigerian Bandwidth Optimization:</strong> Audio-First and 240p/360p stream
                modes are built into every classroom to save mobile data.
              </span>
            </div>
            <span className="text-[var(--foreground-muted)] font-semibold whitespace-nowrap">
              Strict Group Allocation &amp; Subscription Gating Active
            </span>
          </div>

          {loading ? (
            <CardSkeleton lines={6} />
          ) : classes.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No Allocated Live Classrooms Found"
              description={
                isTeacher
                  ? "You do not have any published timetable lessons assigned yet. Ensure your subject applications are approved by School Admin."
                  : isAdmin
                  ? "Publish a lesson in the Official Timetable Builder to generate capacity-bounded classroom groups."
                  : "You have not been placed into a live classroom yet. Confirm your class enrolment and active subscription plan, or check once School Admin publishes your timetable."
              }
              action={
                !isTeacher && !isAdmin
                  ? { label: "Manage Enrolment & Subscription", href: "/subscriptions" }
                  : undefined
              }
              secondaryAction={
                !isTeacher && !isAdmin
                  ? { label: "View Timetable", href: "/timetable" }
                  : undefined
              }
            />
          ) : (
            <>
              {/* Featured Active / Next Classroom */}
              {featuredClass && !isAdmin && (
                <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#22D3EE] font-semibold">
                      <span>{featuredClass.status === "live" ? "Broadcasting Now" : "Your Allocated Session"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{featuredClass.classLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{featuredClass.timeWat}</span>
                    </div>
                    <h2 className="landing-display text-2xl font-extrabold">{featuredClass.title}</h2>
                    <p className="text-sm text-[#C4B5FD]">{featuredClass.topic}</p>
                    <p className="text-xs text-slate-300 tabular-nums">
                      Instructor: <strong className="text-white">{featuredClass.teacher}</strong> ·{" "}
                      {featuredClass.studentsCount} / {featuredClass.maxCapacity} allocated
                    </p>
                  </div>

                  <div className="shrink-0">
                    {featuredClass.entitled === false ? (
                      <Link
                        href="/subscriptions"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition whitespace-nowrap"
                      >
                        <Lock size={14} />
                        Activate Subscription to Join
                      </Link>
                    ) : (
                      <Link
                        href={
                          isTeacher
                            ? `/teacher/live-class/${featuredClass.id}`
                            : `/live-classes/${featuredClass.id}`
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shadow-[0_10px_24px_rgba(79,70,229,0.4)] transition whitespace-nowrap"
                      >
                        <Play size={14} fill="currentColor" />
                        {isTeacher
                          ? "Enter Host Studio"
                          : featuredClass.status === "live"
                          ? "Join Live Classroom"
                          : "Enter Waiting Room"}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  {[
                    { id: "all", label: "All Allocated" },
                    { id: "live", label: "Live Now" },
                    { id: "scheduled", label: "Waiting / Scheduled" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        filter === f.id
                          ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[var(--foreground-muted)] tabular-nums">
                  {filteredClasses.length} classroom(s)
                </span>
              </div>

              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClasses.map((cls) => {
                  const statusMeta = lifecycleLabel(cls);
                  const blockedBySub = cls.entitled === false;
                  const targetHref = isTeacher
                    ? `/teacher/live-class/${cls.id}`
                    : `/live-classes/${cls.id}`;

                  return (
                    <div
                      key={cls.id}
                      className="learnova-card p-6 flex flex-col justify-between gap-4 hover:border-indigo-400/60 transition-colors min-w-0"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {cls.subject} · {cls.classLevel}
                          </span>
                          <span
                            className={`text-[11px] font-bold shrink-0 ${
                              cls.lifecycleStatus === "LIVE"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : cls.lifecycleStatus === "CANCELLED"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-cyan-600 dark:text-cyan-400"
                            }`}
                          >
                            {statusMeta.text}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[var(--foreground)]">{cls.title}</h3>
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">{cls.topic}</p>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                          <span className="font-semibold text-[var(--foreground)] truncate">
                            {cls.teacher}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums shrink-0">
                            <Users size={13} className="text-cyan-600 dark:text-cyan-400" />
                            {cls.studentsCount}/{cls.maxCapacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)] tabular-nums">
                          <Clock size={12} className="text-indigo-600 dark:text-indigo-400" />
                          <span>{cls.timeWat}</span>
                        </div>

                        {isAdmin ? (
                          <Link
                            href="/admin/classrooms"
                            className="w-full py-2.5 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border)] hover:border-indigo-400 text-[var(--foreground)] text-xs font-bold text-center block transition"
                          >
                            Monitor in Control Centre
                          </Link>
                        ) : blockedBySub ? (
                          <Link
                            href="/subscriptions"
                            className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                          >
                            <Lock size={13} />
                            Subscription Required
                          </Link>
                        ) : (
                          <Link
                            href={targetHref}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition ${
                              cls.status === "live"
                                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white shadow-[0_6px_16px_rgba(79,70,229,0.28)]"
                                : "border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)]"
                            }`}
                          >
                            {isTeacher
                              ? "Open Host Control Room"
                              : cls.status === "live"
                              ? "Join Live Classroom"
                              : "Enter Waiting Room"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
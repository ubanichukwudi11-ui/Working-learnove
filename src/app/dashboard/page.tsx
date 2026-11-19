"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { DashboardSkeleton, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  BookOpen,
  CalendarDays,
  CreditCard,
  Sparkles,
  NotebookPen,
  Clock,
  Lock,
  ArrowRight,
  PlaySquare,
  Award,
  Bell,
  Play,
  Send,
} from "lucide-react";

type ContinueLearningItem = {
  title: string;
  subjectName?: string;
  href: string;
  updatedAt?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolment, setEnrolment] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [continueItem, setContinueItem] = useState<ContinueLearningItem | null>(null);
  const [novaPrompt, setNovaPrompt] = useState("");
  const [nowMs, setNowMs] = useState(0);

  const loadStudentPortal = useCallback(async () => {
    try {
      const [subRes, rmRes, ttRes, anaRes, notifRes] = await Promise.all([
        fetch("/api/lms/subscriptions", { cache: "no-store" }),
        fetch("/api/lms/classrooms", { cache: "no-store" }),
        fetch("/api/lms/timetable", { cache: "no-store" }),
        fetch("/api/lms/analytics", { cache: "no-store" }),
        fetch("/api/lms/notifications", { cache: "no-store" }),
      ]);

      const subJson = subRes.ok ? await subRes.json() : {};
      const rmJson = rmRes.ok ? await rmRes.json() : {};
      const ttJson = ttRes.ok ? await ttRes.json() : {};
      const anaJson = anaRes.ok ? await anaRes.json() : {};
      const notifJson = notifRes.ok ? await notifRes.json() : {};

      setEnrolment(subJson.enrolment || null);
      setEntitlement(subJson.entitlement || null);
      setClassLevels(subJson.classLevels || []);
      setSubjects(subJson.subjects || []);
      setClassrooms(rmJson.classrooms || []);
      setTimetableEntries(ttJson.entries || []);
      setGroups(ttJson.groups || []);
      setAnalytics(anaJson.analytics || null);
      setNotifications(
        Array.isArray(notifJson.notifications) ? notifJson.notifications.slice(0, 4) : []
      );
      setNowMs(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentPortal();
    try {
      const saved = localStorage.getItem("learnova_last_learning");
      if (saved) {
        setContinueItem(JSON.parse(saved));
      }
    } catch {}
  }, [loadStudentPortal]);

  const classLevelId = entitlement?.classLevelId || enrolment?.classLevelId || "";
  const levelName =
    classLevels.find((c) => c.id === classLevelId)?.name ||
    user?.classLevel ||
    "Class Level Not Selected";

  const accessStatus = entitlement?.accessStatus || enrolment?.status || "REGISTERED";
  const isExpired =
    accessStatus === "EXPIRED" ||
    (Boolean(entitlement?.expiresAt) &&
      nowMs > 0 &&
      new Date(entitlement.expiresAt).getTime() < nowMs);
  const hasActiveEntitlement =
    !isExpired &&
    (accessStatus === "ACTIVE_PAID" || accessStatus === "SCHOLARSHIP_GRANTED");

  const liveNowRooms = classrooms.filter((c) => c.status === "LIVE");
  const subName = (id: string) => subjects.find((s) => s.id === id)?.name || id;
  const recentAttempts = Array.isArray(analytics?.recentAttempts)
    ? analytics.recentAttempts.slice(0, 3)
    : [];

  const handleNovaQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = novaPrompt.trim();
    if (!trimmed) {
      router.push("/nova");
      return;
    }
    router.push(`/nova?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <ProtectedRoute roles={["STUDENT"]}>
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            kicker={`Student Learning Portal · ${levelName}`}
            title={`Welcome back, ${user?.fullName?.split(" ")[0] || "Learner"}`}
            description="Access your official class timetable, live classrooms, topic lessons, CBT practice, and Nova AI tutor support."
            actions={
              <>
                <Link
                  href="/videos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap"
                >
                  <PlaySquare size={15} className="text-[#22D3EE]" />
                  Video Lessons
                </Link>
                {!loading && !hasActiveEntitlement && (
                  <Link
                    href="/subscriptions"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap"
                  >
                    <CreditCard size={15} className="text-[#C4B5FD]" />
                    {isExpired ? "Renew Subscription" : "Activate Subscription"}
                  </Link>
                )}
                <Link
                  href="/nova"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-semibold shadow-sm transition whitespace-nowrap"
                >
                  <Sparkles size={15} />
                  Ask Nova AI
                </Link>
              </>
            }
          />

          {/* Entitlement Gate Banner (hidden once subscription is active) */}
          {!loading && !hasActiveEntitlement && (
            <div
              className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isExpired
                  ? "border-rose-300 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-500/10"
                  : "border-amber-300 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold flex items-center gap-1.5 ${
                    isExpired
                      ? "text-rose-950 dark:text-rose-200"
                      : "text-amber-950 dark:text-amber-200"
                  }`}
                >
                  <Lock
                    size={15}
                    className={`shrink-0 ${
                      isExpired
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  />
                  {isExpired
                    ? "Your Subscription Has Expired"
                    : `Subscription Status: ${accessStatus.replace(/_/g, " ")}`}
                </p>
                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    isExpired
                      ? "text-rose-900/85 dark:text-rose-200/80"
                      : "text-amber-900/85 dark:text-amber-200/80"
                  }`}
                >
                  {isExpired
                    ? "Your previous learning pass has ended. Renew your subscription plan to restore access to live classes and recordings."
                    : accessStatus === "AWAITING_CONFIRMATION"
                    ? "Your bank transfer reference is awaiting School Admin verification. Your classrooms will unlock automatically once approved."
                    : "Confirm your class level and activate a Nigerian Naira (₦) term or monthly subscription to enter live classrooms."}
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shrink-0 whitespace-nowrap shadow-xs transition"
              >
                {isExpired ? "Renew Plan →" : "Go to Subscriptions →"}
              </Link>
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Coordinated Semantic KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Enrolled Class"
                  value={classLevels.find((c) => c.id === classLevelId)?.code || "Unselected"}
                  sublabel={accessStatus.replace(/_/g, " ")}
                  icon={BookOpen}
                  tone="learning"
                  href="/subscriptions"
                />
                <StatCard
                  label="Live Classrooms"
                  value={classrooms.length}
                  sublabel={`${liveNowRooms.length} live now`}
                  icon={Video}
                  tone="timetable"
                  href="/live-classes"
                />
                <StatCard
                  label="Weekly Lessons"
                  value={timetableEntries.length}
                  sublabel="Published WAT sessions"
                  icon={CalendarDays}
                  tone="assignments"
                  href="/timetable"
                />
                <StatCard
                  label="Term Average"
                  value={analytics ? `${analytics.overallAverage}%` : `${enrolment?.subjectIds?.length || 0} subj`}
                  sublabel={
                    analytics
                      ? `WAEC ${analytics.overallWaecGrade} · ${analytics.quizzesCompletedCount} quizzes`
                      : "Track in Achievements"
                  }
                  icon={Award}
                  tone="exams"
                  href="/analytics"
                />
              </div>

              {/* Continue Learning & Nova AI Quick Launcher */}
              <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
                <div className="learnova-card-glow p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#A5B4FC]">
                        Continue Learning
                      </p>
                      <h2 className="landing-display text-lg font-bold text-[var(--foreground)] mt-1">
                        {continueItem?.title || "Explore Curriculum Subjects & Video Lessons"}
                      </h2>
                      <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                        {continueItem?.subjectName
                          ? `Last studied in ${continueItem.subjectName} — pick up directly where you stopped.`
                          : "Browse WAEC, NECO, and JAMB curriculum topics organized by Class Level, Subject, and Term."}
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/12 dark:bg-indigo-400/15 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center shrink-0">
                      <Play size={18} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link
                      href={continueItem?.href || "/videos"}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-xs"
                    >
                      <PlaySquare size={14} />
                      {continueItem ? "Resume Topic" : "Open Video Library"}
                    </Link>
                    <Link
                      href="/subjects"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--foreground)] transition"
                    >
                      All Subjects ({subjects.length})
                    </Link>
                    <Link
                      href="/assignments?tab=cbt"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--foreground)] transition"
                    >
                      Practice CBT
                    </Link>
                  </div>
                </div>

                <form
                  onSubmit={handleNovaQuickSubmit}
                  className="learnova-card p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-300 flex items-center gap-1.5">
                        <Sparkles size={13} />
                        Nova AI Tutor
                      </p>
                      <Link
                        href="/nova"
                        className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                      >
                        Full Workspace →
                      </Link>
                    </div>
                    <h2 className="landing-display text-base font-bold text-[var(--foreground)] mt-1">
                      Stuck on a formula, essay, or past question?
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={novaPrompt}
                      onChange={(e) => setNovaPrompt(e.target.value)}
                      placeholder="Ask Nova e.g. Explain electrolysis..."
                      className="learnova-input flex-1"
                    />
                    <button
                      type="submit"
                      aria-label="Ask Nova AI"
                      className="p-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white shrink-0 transition shadow-xs"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>

              {/* Main 2-Column Workspace */}
              <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Allocated Classrooms & Recent Quizzes */}
                <div className="space-y-6 min-w-0">
                  <div className="learnova-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Video size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                        Your Allocated Classrooms
                      </h2>
                      <Link
                        href="/live-classes"
                        className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        All Rooms <ArrowRight size={13} />
                      </Link>
                    </div>

                    {classrooms.length === 0 ? (
                      <EmptyState
                        compact
                        icon={Video}
                        title="No Classrooms Allocated Yet"
                        description="Once you enrol with an active plan and School Admin publishes your timetable, your assigned group classroom will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {classrooms.map((rm) => (
                          <div
                            key={rm.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] hover:border-[var(--border-strong)] p-4 flex items-center justify-between gap-3 transition"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD] truncate">
                                {rm.subjectName} · {rm.groupName} · {rm.status}
                              </p>
                              <h3 className="text-sm font-bold text-[var(--foreground)] mt-0.5 truncate">
                                {rm.lessonTitle}
                              </h3>
                              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5 truncate tabular-nums">
                                {rm.teacherName} · {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT
                              </p>
                            </div>
                            {rm.entitled ? (
                              <Link
                                href={`/live-classes/${rm.id}`}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shrink-0 whitespace-nowrap shadow-xs transition"
                              >
                                {rm.status === "LIVE" ? "Join Live" : "Open Room"}
                              </Link>
                            ) : (
                              <Link
                                href="/subscriptions"
                                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0 whitespace-nowrap transition"
                              >
                                Unlock
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Test / CBT Results */}
                  <div className="learnova-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Award size={17} className="text-amber-600 dark:text-amber-400" />
                        Recent Quiz &amp; CBT Results
                      </h2>
                      <Link
                        href="/analytics"
                        className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline whitespace-nowrap"
                      >
                        Achievements →
                      </Link>
                    </div>

                    {recentAttempts.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)]">
                        No quiz or CBT attempts recorded yet. Try a timed WAEC/JAMB drill under Practice &amp; Exams.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {recentAttempts.map((att: any) => (
                          <div
                            key={att.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] truncate">
                                {att.subjectName}
                              </p>
                              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                {att.title}
                              </p>
                            </div>
                            <span className="text-sm font-extrabold text-[var(--foreground)] tabular-nums shrink-0">
                              {att.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Timetable, Study Shortcuts & Notifications */}
                <div className="space-y-6 min-w-0">
                  <div className="learnova-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <CalendarDays size={17} className="text-[#0891B2] dark:text-[#22D3EE]" />
                        Official Class Timetable (WAT)
                      </h2>
                      <Link
                        href="/timetable"
                        className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline whitespace-nowrap"
                      >
                        Full Schedule →
                      </Link>
                    </div>

                    {timetableEntries.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)] py-6 text-center">
                        No published timetable entries for your class level yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {timetableEntries.slice(0, 5).map((slot) => {
                          const grp = groups.find((g) => g.timetableEntryId === slot.id);
                          return (
                            <div
                              key={slot.id}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[var(--foreground)] truncate">
                                  {subName(slot.subjectId)} {grp ? `(${grp.groupName})` : ""}
                                </p>
                                <p className="text-[var(--foreground-subtle)] truncate">
                                  {slot.dayOfWeek} · {grp?.teacherName || slot.mode}
                                </p>
                              </div>
                              <span className="font-semibold text-[#4F46E5] dark:text-[#A5B4FC] tabular-nums inline-flex items-center gap-1 shrink-0">
                                <Clock size={12} />
                                {slot.startTime}–{slot.endTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Learning Tools */}
                  <div className="grid grid-cols-3 gap-3">
                    <Link
                      href="/subjects"
                      className="learnova-card p-4 hover:border-[var(--border-strong)] transition min-w-0"
                    >
                      <BookOpen size={17} className="text-[#4F46E5] dark:text-[#A5B4FC] mb-1.5" />
                      <p className="text-xs font-bold text-[var(--foreground)] truncate">Subjects</p>
                    </Link>
                    <Link
                      href="/notebook"
                      className="learnova-card p-4 hover:border-[var(--border-strong)] transition min-w-0"
                    >
                      <NotebookPen size={17} className="text-[#7C3AED] dark:text-[#C4B5FD] mb-1.5" />
                      <p className="text-xs font-bold text-[var(--foreground)] truncate">Notebook</p>
                    </Link>
                    <Link
                      href="/analytics"
                      className="learnova-card p-4 hover:border-[var(--border-strong)] transition min-w-0"
                    >
                      <Award size={17} className="text-amber-600 dark:text-amber-400 mb-1.5" />
                      <p className="text-xs font-bold text-[var(--foreground)] truncate">Progress</p>
                    </Link>
                  </div>

                  {/* Important Notifications Summary */}
                  <div className="learnova-card p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Bell size={16} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                        Recent Alerts
                      </h2>
                      <Link
                        href="/notifications"
                        className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                      >
                        View All →
                      </Link>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[var(--foreground-subtle)]">
                        No unread updates right now.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n: any) => (
                          <Link
                            key={n.id}
                            href={n.href || "/notifications"}
                            className="block rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] hover:border-[var(--border-strong)] px-3.5 py-2.5 transition"
                          >
                            <p className="text-xs font-bold text-[var(--foreground)] truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-[var(--foreground-subtle)] truncate mt-0.5">
                              {n.message}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
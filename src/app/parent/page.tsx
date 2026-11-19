"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { DashboardSkeleton, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarCheck,
  Trophy,
  Video,
  User,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  Download,
  UserPlus,
  CreditCard,
  Loader2,
  X,
  ShieldCheck,
  KeyRound,
  Trash2,
} from "lucide-react";

interface PendingWardRequest {
  linkId: string;
  studentEmail: string;
  relationship: string;
  status: "PENDING_VERIFICATION" | "REJECTED";
  linkedAt: string;
}

interface WardRecord {
  linkId: string;
  relationship: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    classLevel: string;
  };
  analytics: {
    termName: string;
    sessionName: string;
    overallAverage: number;
    overallWaecGrade: string;
    overallRemark: string;
    attendanceRate: number;
    attendancePresentCount: number;
    attendanceTotalCount: number;
    quizzesCompletedCount: number;
    cbtAveragePercentage: number;
    planName: string;
    accessStatus: string;
    subjectRows: Array<{
      subjectId: string;
      subjectName: string;
      caScore: number;
      totalPercentage: number;
      waecGrade: string;
      remark: string;
    }>;
    recentAttempts: Array<{
      id: string;
      title: string;
      subjectName: string;
      percentage: number;
      score: number;
      total: number;
      createdAt: string;
    }>;
  };
  payments: Array<{
    id: string;
    planName: string;
    amountNgn: number;
    status: string;
    createdAt: string;
  }>;
  upcomingTimetable: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    mode: string;
    subjectName: string;
  }>;
}

export default function ParentDashboard() {
  return (
    <ProtectedRoute roles={["PARENT", "ADMIN", "SUPER_ADMIN"]}>
      <ParentContent />
    </ProtectedRoute>
  );
}

function ParentContent() {
  const { user } = useAuth();
  const guardianName = user?.fullName || "Guardian";

  const [wards, setWards] = useState<WardRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingWardRequest[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [relationship, setRelationship] = useState("Mother / Guardian");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<string | null>(null);

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const loadWards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/parent", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list: WardRecord[] = data.wards || [];
      setWards(list);
      setPendingRequests(data.pendingRequests || []);
      setSelectedWardId((prev) =>
        list.some((w) => w.student.id === prev) ? prev : list[0]?.student.id || ""
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWards();
  }, [loadWards]);

  const handleLinkWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkInfo(null);
    setLinking(true);
    try {
      const res = await fetch("/api/lms/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LINK_WARD",
          studentEmail,
          relationship,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkError(data.error || "Unable to initiate guardian link.");
        return;
      }
      setStudentEmail("");
      setLinkModalOpen(false);
      setLinkInfo(
        "Verification request sent! Ask your child to share the 6-digit code sent to their email/Profile or approve the request directly in their Profile page."
      );
      await loadWards();
    } finally {
      setLinking(false);
    }
  };

  const handleVerifyCode = async (linkId: string) => {
    const code = (otpInputs[linkId] || "").trim();
    if (!code) return;
    setOtpError(null);
    setVerifyingId(linkId);
    try {
      const res = await fetch("/api/lms/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_CODE",
          linkId,
          verificationCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed.");
        return;
      }
      setOtpInputs((prev) => ({ ...prev, [linkId]: "" }));
      setLinkInfo("Ward account verified and linked!");
      await loadWards();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleUnlink = async (linkId: string) => {
    await fetch("/api/lms/parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UNLINK_WARD", linkId }),
    });
    await loadWards();
  };

  const activeWard =
    wards.find((w) => w.student.id === selectedWardId) || wards[0] || null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          kicker={
            activeWard
              ? `${activeWard.analytics.sessionName} · ${activeWard.analytics.termName} · Guardian Overview`
              : "Parent & Guardian Portal"
          }
          title={`Welcome, ${guardianName}`}
          description="Monitor your verified ward's attendance, quiz & CBT scores, tuition receipts (₦), and download official PDF report cards."
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setLinkError(null);
                  setLinkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition whitespace-nowrap"
              >
                <UserPlus size={15} className="text-[#22D3EE]" />
                Link Child Account
              </button>

              {activeWard && (
                <a
                  href={`/api/lms/report-card/download?studentId=${encodeURIComponent(
                    activeWard.student.id
                  )}`}
                  download
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
                >
                  <Download size={15} />
                  Download Report Card (PDF)
                </a>
              )}
            </>
          }
        />

        {linkInfo && (
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
            <span>{linkInfo}</span>
            <button
              type="button"
              onClick={() => setLinkInfo(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:opacity-75"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Pending Consent / Verification Requests */}
        {pendingRequests.length > 0 && (
          <div className="learnova-card p-6 space-y-3 border-amber-300 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/10">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
              <h2 className="landing-display text-sm font-bold text-[var(--foreground)]">
                Pending Guardian Verification Requests
              </h2>
            </div>
            <p className="text-xs text-[var(--foreground-subtle)]">
              Student privacy is protected. Enter the 6-digit verification code sent to the student&apos;s email/Profile, or ask the student to approve the request on their Profile page.
            </p>
            {otpError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                {otpError}
              </div>
            )}
            <div className="space-y-2.5">
              {pendingRequests.map((reqItem) => (
                <div
                  key={reqItem.linkId}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      {reqItem.studentEmail}
                    </p>
                    <p className="text-[11px] text-[var(--foreground-subtle)]">
                      {reqItem.relationship} ·{" "}
                      <span
                        className={
                          reqItem.status === "REJECTED"
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-amber-700 dark:text-amber-300 font-semibold"
                        }
                      >
                        {reqItem.status.replace(/_/g, " ")}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {reqItem.status === "PENDING_VERIFICATION" && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <KeyRound size={14} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                          <input
                            type="text"
                            maxLength={6}
                            value={otpInputs[reqItem.linkId] || ""}
                            onChange={(e) =>
                              setOtpInputs((prev) => ({
                                ...prev,
                                [reqItem.linkId]: e.target.value,
                              }))
                            }
                            placeholder="6-digit code"
                            className="learnova-input w-28 px-2.5 py-1.5 text-xs font-mono tracking-wider"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={verifyingId === reqItem.linkId}
                          onClick={() => handleVerifyCode(reqItem.linkId)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition disabled:opacity-50"
                        >
                          {verifyingId === reqItem.linkId ? "Verifying..." : "Verify Code"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUnlink(reqItem.linkId)}
                      title="Remove request"
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-subtle)] hover:text-rose-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ward Switcher if multiple children verified */}
        {wards.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {wards.map((w) => (
              <button
                key={w.linkId}
                type="button"
                onClick={() => setSelectedWardId(w.student.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  activeWard?.student.id === w.student.id
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-[#4F46E5] shadow-sm"
                    : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-lavender)]"
                }`}
              >
                {w.student.fullName} ({w.student.classLevel})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : !activeWard ? (
          <EmptyState
            icon={User}
            title="No Verified Student Account Linked Yet"
            description="Request to link your child's Learnova email address. Once verified by 6-digit code or student approval, you can track attendance, WAEC/JAMB CBT readiness, fees, and report cards."
            action={
              <button
                type="button"
                onClick={() => setLinkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
              >
                <UserPlus size={14} /> Link Student Email
              </button>
            }
          />
        ) : (
          <>
            {/* Linked Student Banner */}
            <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#4F46E5] dark:text-[#A5B4FC] font-semibold">
                    Verified Ward · {activeWard.relationship}
                  </p>
                  <h2 className="landing-display text-xl font-extrabold text-[var(--foreground)] mt-0.5 truncate">
                    {activeWard.student.fullName}
                  </h2>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5 truncate">
                    {activeWard.student.classLevel} · {activeWard.student.email} ·{" "}
                    {activeWard.analytics.planName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
                <CheckCircle2 size={16} />
                <span>Status: {activeWard.analytics.accessStatus}</span>
              </div>
            </div>

            {/* Coordinated KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Term Attendance"
                value={`${activeWard.analytics.attendanceRate}%`}
                sublabel={`${activeWard.analytics.attendancePresentCount} of ${activeWard.analytics.attendanceTotalCount} sessions`}
                icon={CalendarCheck}
                tone="attendance"
              />
              <StatCard
                label="Term Avg / Grade"
                value={`${activeWard.analytics.overallAverage}%`}
                sublabel={`WAEC ${activeWard.analytics.overallWaecGrade} (${activeWard.analytics.overallRemark})`}
                icon={Trophy}
                tone="exams"
              />
              <StatCard
                label="Quizzes & CBT"
                value={activeWard.analytics.quizzesCompletedCount}
                sublabel={`Avg score: ${activeWard.analytics.cbtAveragePercentage}%`}
                icon={Video}
                tone="assignments"
              />
              <StatCard
                label="Tuition & Plan"
                value={activeWard.analytics.planName}
                sublabel="Manage Plan (₦)"
                icon={CreditCard}
                tone="payments"
                href="/subscriptions"
              />
            </div>

            {/* Main Columns */}
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
              {/* Subject CA Breakdown */}
              <div className="learnova-card p-6 space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                    Subject Continuous Assessment (CA / 30)
                  </h2>
                  <span className="text-xs text-[var(--foreground-subtle)] font-medium">
                    {activeWard.analytics.termName}
                  </span>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {activeWard.analytics.subjectRows.map((item) => (
                    <div
                      key={item.subjectId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--foreground)] truncate">
                          {item.subjectName}
                        </p>
                        <p className="text-xs text-[var(--foreground-subtle)]">{item.remark}</p>
                      </div>
                      <div className="flex items-center gap-6 tabular-nums text-right shrink-0">
                        <div>
                          <p className="text-xs text-[var(--foreground-subtle)]">CA Score</p>
                          <p className="font-bold text-[var(--foreground)]">{item.caScore}/30</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--foreground-subtle)]">Est. Grade</p>
                          <p className="font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
                            {item.totalPercentage}% ({item.waecGrade})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timetable, Activity & Fee Receipts */}
              <div className="space-y-6 min-w-0">
                <div className="learnova-card p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                      Scheduled Classes (WAT)
                    </h2>
                    <Link
                      href="/timetable"
                      className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline inline-flex items-center gap-1"
                    >
                      Timetable
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {activeWard.upcomingTimetable.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      Published timetable periods for {activeWard.student.classLevel} will appear here.
                    </p>
                  ) : (
                    activeWard.upcomingTimetable.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen
                            size={15}
                            className="text-[#4F46E5] dark:text-[#A5B4FC] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--foreground)] truncate">
                              {slot.subjectName}
                            </p>
                            <p className="text-[var(--foreground-subtle)]">
                              {slot.dayOfWeek} · {slot.mode}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-[var(--foreground)] tabular-nums inline-flex items-center gap-1 shrink-0">
                          <Clock size={12} className="text-[#0891B2] dark:text-[#22D3EE]" />
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="learnova-card p-6 space-y-3">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                    Recent Quiz &amp; Fee Activity
                  </h2>
                  {activeWard.analytics.recentAttempts.length === 0 &&
                  activeWard.payments.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      Quiz completions and verified Naira (₦) subscription payments will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeWard.analytics.recentAttempts.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3 text-xs flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate">
                              {act.title}
                            </p>
                            <p className="text-[var(--foreground-subtle)] mt-0.5">
                              {act.subjectName}
                            </p>
                          </div>
                          <span className="font-bold text-[#4F46E5] dark:text-[#A5B4FC] tabular-nums shrink-0">
                            {act.percentage}%
                          </span>
                        </div>
                      ))}

                      {activeWard.payments.slice(0, 2).map((pay) => (
                        <div
                          key={pay.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{pay.planName}</p>
                            <p className="text-[var(--foreground-subtle)] mt-0.5">{pay.status}</p>
                          </div>
                          <span className="font-bold text-[var(--foreground)] tabular-nums">
                            ₦{pay.amountNgn.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Link Child Modal */}
      {linkModalOpen && (
        <div
          className="fixed inset-0 z-[80] bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLinkModalOpen(false)}
        >
          <form
            onSubmit={handleLinkWard}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="landing-display text-lg font-bold text-[var(--foreground)]">
                Request Guardian Ward Link
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--foreground-subtle)]">
              Enter your child&apos;s registered Learnova student email. A 6-digit verification code will be emailed to the student and shown in their Profile for consent approval.
            </p>

            {linkError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                {linkError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Student Email Address
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@example.com"
                  className="learnova-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="learnova-input"
                >
                  <option>Mother / Guardian</option>
                  <option>Father / Guardian</option>
                  <option>Legal Guardian</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-strong)] text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={linking}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 transition shadow-sm"
              >
                {linking && <Loader2 size={13} className="animate-spin" />}
                Send Verification Request
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
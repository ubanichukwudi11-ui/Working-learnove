"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
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

  // Link child modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [relationship, setRelationship] = useState("Mother / Guardian");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<string | null>(null);

  // 6-digit OTP verification state
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
      <div className="space-y-7">
        {/* Header Banner */}
        <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              {activeWard
                ? `${activeWard.analytics.sessionName} · ${activeWard.analytics.termName} · Guardian Overview`
                : "Parent & Guardian Portal"}
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome, {guardianName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Monitor your verified ward&apos;s attendance, quiz &amp; CBT scores, fee receipts (₦), and download official PDF report cards.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
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
          </div>
        </div>

        {linkInfo && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center justify-between gap-3">
            <span>{linkInfo}</span>
            <button
              type="button"
              onClick={() => setLinkInfo(null)}
              className="text-emerald-700 hover:text-emerald-950"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Pending Consent / Verification Requests */}
        {pendingRequests.length > 0 && (
          <div className="learnova-card p-6 space-y-3 border-amber-200 bg-amber-50/40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#4F46E5]" />
              <h2 className="landing-display text-sm font-bold text-[#0B1230]">
                Pending Guardian Verification Requests
              </h2>
            </div>
            <p className="text-xs text-[#6B6F94]">
              Student privacy is protected. Enter the 6-digit verification code sent to the student&apos;s email/Profile, or ask the student to approve the request on their Profile page.
            </p>
            {otpError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
                {otpError}
              </div>
            )}
            <div className="space-y-2.5">
              {pendingRequests.map((reqItem) => (
                <div
                  key={reqItem.linkId}
                  className="rounded-xl border border-[#E4E1F5] bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0B1230]">
                      {reqItem.studentEmail}
                    </p>
                    <p className="text-[11px] text-[#6B6F94]">
                      {reqItem.relationship} ·{" "}
                      <span
                        className={
                          reqItem.status === "REJECTED"
                            ? "text-rose-600 font-semibold"
                            : "text-amber-700 font-semibold"
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
                          <KeyRound size={14} className="text-[#4F46E5]" />
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
                      className="p-1.5 rounded-lg border border-[#E4E1F5] text-[#6B6F94] hover:text-rose-600 transition"
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
                    : "bg-white text-[#0B1230] border-[#E4E1F5] hover:bg-[#FAF8FF]"
                }`}
              >
                {w.student.fullName} ({w.student.classLevel})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="learnova-card p-12 text-center text-sm text-[#6B6F94]">
            Loading verified ward records...
          </div>
        ) : !activeWard ? (
          <div className="rounded-2xl border border-dashed border-[#DCD7F5] bg-white p-12 text-center space-y-3">
            <User size={28} className="mx-auto text-[#6B6F94]" />
            <h2 className="landing-display text-base font-bold text-[#0B1230]">
              No Verified Student Account Linked Yet
            </h2>
            <p className="text-xs text-[#6B6F94] max-w-md mx-auto">
              Request to link your child&apos;s Learnova email address. Once verified by 6-digit code or student approval, you can track attendance, WAEC/JAMB CBT readiness, fees, and report cards.
            </p>
            <button
              type="button"
              onClick={() => setLinkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
            >
              <UserPlus size={14} /> Link Student Email
            </button>
          </div>
        ) : (
          <>
            {/* Linked Student Banner */}
            <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#4F46E5] font-semibold">
                    Verified Ward · {activeWard.relationship}
                  </p>
                  <h2 className="landing-display text-xl font-extrabold text-[#0B1230] mt-0.5 truncate">
                    {activeWard.student.fullName}
                  </h2>
                  <p className="text-xs text-[#6B6F94] mt-0.5 truncate">
                    {activeWard.student.classLevel} · {activeWard.student.email} ·{" "}
                    {activeWard.analytics.planName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold shrink-0">
                <CheckCircle2 size={16} />
                <span>Status: {activeWard.analytics.accessStatus}</span>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="learnova-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B6F94]">
                    Term Attendance
                  </span>
                  <CalendarCheck size={17} className="text-[#4F46E5]" />
                </div>
                <p className="landing-display text-3xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                  {activeWard.analytics.attendanceRate}%
                </p>
                <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                  {activeWard.analytics.attendancePresentCount} of{" "}
                  {activeWard.analytics.attendanceTotalCount} recorded sessions
                </p>
              </div>

              <div className="learnova-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B6F94]">
                    Term Avg / Grade
                  </span>
                  <Trophy size={17} className="text-[#7C3AED]" />
                </div>
                <p className="landing-display text-3xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                  {activeWard.analytics.overallAverage}%
                </p>
                <p className="text-xs text-[#4F46E5] font-semibold mt-1">
                  WAEC {activeWard.analytics.overallWaecGrade} (
                  {activeWard.analytics.overallRemark})
                </p>
              </div>

              <div className="learnova-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B6F94]">
                    Quizzes &amp; CBT Done
                  </span>
                  <Video size={17} className="text-[#0891B2]" />
                </div>
                <p className="landing-display text-3xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                  {activeWard.analytics.quizzesCompletedCount}
                </p>
                <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                  Avg score: {activeWard.analytics.cbtAveragePercentage}%
                </p>
              </div>

              <div className="learnova-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B6F94]">
                    Tuition &amp; Plan
                  </span>
                  <CreditCard size={17} className="text-[#4F46E5]" />
                </div>
                <p className="landing-display text-xl font-extrabold text-[#0B1230] mt-3 truncate">
                  {activeWard.analytics.planName}
                </p>
                <Link
                  href="/subscriptions"
                  className="text-xs font-bold text-[#4F46E5] hover:underline mt-1 inline-block"
                >
                  Manage Plan (₦) →
                </Link>
              </div>
            </div>

            {/* Main Columns */}
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
              {/* Subject CA Breakdown */}
              <div className="learnova-card p-6 space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="landing-display text-base font-bold text-[#0B1230]">
                    Subject Continuous Assessment (CA / 30)
                  </h2>
                  <span className="text-xs text-[#6B6F94] font-medium">
                    {activeWard.analytics.termName}
                  </span>
                </div>

                <div className="divide-y divide-[#E4E1F5]">
                  {activeWard.analytics.subjectRows.map((item) => (
                    <div
                      key={item.subjectId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#0B1230] truncate">{item.subjectName}</p>
                        <p className="text-xs text-[#6B6F94]">{item.remark}</p>
                      </div>
                      <div className="flex items-center gap-6 tabular-nums text-right shrink-0">
                        <div>
                          <p className="text-xs text-[#6B6F94]">CA Score</p>
                          <p className="font-bold text-[#0B1230]">{item.caScore}/30</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B6F94]">Est. Grade</p>
                          <p className="font-bold text-[#4F46E5]">
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
                    <h2 className="landing-display text-base font-bold text-[#0B1230]">
                      Scheduled Classes (WAT)
                    </h2>
                    <Link
                      href="/timetable"
                      className="text-xs font-bold text-[#4F46E5] hover:underline inline-flex items-center gap-1"
                    >
                      Timetable
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {activeWard.upcomingTimetable.length === 0 ? (
                    <p className="text-xs text-[#6B6F94]">
                      Published timetable periods for {activeWard.student.classLevel} will appear here.
                    </p>
                  ) : (
                    activeWard.upcomingTimetable.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between py-2.5 border-b border-[#E4E1F5] last:border-0 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen size={15} className="text-[#4F46E5] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#0B1230] truncate">
                              {slot.subjectName}
                            </p>
                            <p className="text-[#6B6F94]">
                              {slot.dayOfWeek} · {slot.mode}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-[#0B1230] tabular-nums inline-flex items-center gap-1 shrink-0">
                          <Clock size={12} className="text-[#0891B2]" />
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="learnova-card p-6 space-y-3">
                  <h2 className="landing-display text-base font-bold text-[#0B1230]">
                    Recent Quiz &amp; Fee Activity
                  </h2>
                  {activeWard.analytics.recentAttempts.length === 0 &&
                  activeWard.payments.length === 0 ? (
                    <p className="text-xs text-[#6B6F94]">
                      Quiz completions and verified Naira (₦) subscription payments will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeWard.analytics.recentAttempts.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-3 text-xs flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0B1230] truncate">{act.title}</p>
                            <p className="text-[#6B6F94] mt-0.5">{act.subjectName}</p>
                          </div>
                          <span className="font-bold text-[#4F46E5] tabular-nums shrink-0">
                            {act.percentage}%
                          </span>
                        </div>
                      ))}

                      {activeWard.payments.slice(0, 2).map((pay) => (
                        <div
                          key={pay.id}
                          className="rounded-xl border border-[#E4E1F5] bg-white p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#0B1230]">{pay.planName}</p>
                            <p className="text-[#6B6F94] mt-0.5">{pay.status}</p>
                          </div>
                          <span className="font-bold text-[#0B1230] tabular-nums">
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
        <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleLinkWard}
            className="w-full max-w-md rounded-2xl bg-white border border-[#E4E1F5] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="landing-display text-lg font-bold text-[#0B1230]">
                Request Guardian Ward Link
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-[#6B6F94] hover:text-[#0B1230]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[#6B6F94]">
              Enter your child&apos;s registered Learnova student email. A 6-digit verification code will be emailed to the student and shown in their Profile for consent approval.
            </p>

            {linkError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
                {linkError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1">
                  Student Email Address
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@example.com"
                  className="learnova-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="learnova-input w-full px-3.5 py-2.5 text-sm"
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
                className="px-4 py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#43466E] hover:bg-[#FAF8FF]"
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
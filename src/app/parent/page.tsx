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
} from "lucide-react";

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
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Link child modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [relationship, setRelationship] = useState("Mother / Guardian");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const loadWards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/parent", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list: WardRecord[] = data.wards || [];
      setWards(list);
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
        setLinkError(data.error || "Unable to link student account.");
        return;
      }
      setStudentEmail("");
      setLinkModalOpen(false);
      await loadWards();
    } finally {
      setLinking(false);
    }
  };

  const activeWard =
    wards.find((w) => w.student.id === selectedWardId) || wards[0] || null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {activeWard
                ? `${activeWard.analytics.sessionName} · ${activeWard.analytics.termName} · Guardian Overview`
                : "Parent & Guardian Portal"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Welcome, {guardianName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor your ward&apos;s attendance, quiz &amp; CBT scores, fee receipts (₦), and download official PDF report cards.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLinkError(null);
                setLinkModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold transition whitespace-nowrap"
            >
              <UserPlus size={15} className="text-[#0D9488]" />
              Link Child Account
            </button>

            {activeWard && (
              <a
                href={`/api/lms/report-card/download?studentId=${encodeURIComponent(
                  activeWard.student.id
                )}`}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
              >
                <Download size={15} />
                Download Report Card (PDF)
              </a>
            )}
          </div>
        </div>

        {/* Ward Switcher if multiple children linked */}
        {wards.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {wards.map((w) => (
              <button
                key={w.linkId}
                type="button"
                onClick={() => setSelectedWardId(w.student.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  activeWard?.student.id === w.student.id
                    ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                    : "bg-white text-[#0B1F3A] border-slate-200 hover:bg-slate-50"
                }`}
              >
                {w.student.fullName} ({w.student.classLevel})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading linked ward records...
          </div>
        ) : !activeWard ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <User size={28} className="mx-auto text-slate-400" />
            <h2 className="text-base font-bold text-[#0B1F3A]">
              No Student Account Linked Yet
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Link your child&apos;s Learnova email address to track attendance, WAEC/JAMB CBT readiness, fees, and report cards.
            </p>
            <button
              type="button"
              onClick={() => setLinkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
            >
              <UserPlus size={14} /> Link Student Email
            </button>
          </div>
        ) : (
          <>
            {/* Linked Student Banner */}
            <div className="rounded-2xl border border-slate-200 bg-[#0B1F3A] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#F59E0B] shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs text-teal-300 font-semibold">
                    Linked Ward · {activeWard.relationship}
                  </p>
                  <h2 className="text-xl font-extrabold mt-0.5">
                    {activeWard.student.fullName}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeWard.student.classLevel} · {activeWard.student.email} ·{" "}
                    {activeWard.analytics.planName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 size={16} />
                <span>Status: {activeWard.analytics.accessStatus}</span>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Term Attendance
                  </span>
                  <CalendarCheck size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {activeWard.analytics.attendanceRate}%
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {activeWard.analytics.attendancePresentCount} of{" "}
                  {activeWard.analytics.attendanceTotalCount} recorded sessions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Term Avg / Grade
                  </span>
                  <Trophy size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {activeWard.analytics.overallAverage}%
                </p>
                <p className="text-xs text-[#0D9488] font-semibold mt-1">
                  WAEC {activeWard.analytics.overallWaecGrade} (
                  {activeWard.analytics.overallRemark})
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Quizzes &amp; CBT Done
                  </span>
                  <Video size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {activeWard.analytics.quizzesCompletedCount}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  Avg score: {activeWard.analytics.cbtAveragePercentage}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Tuition &amp; Plan
                  </span>
                  <CreditCard size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-xl font-extrabold text-[#0B1F3A] mt-3 truncate">
                  {activeWard.analytics.planName}
                </p>
                <Link
                  href="/subscriptions"
                  className="text-xs font-bold text-[#0D9488] hover:underline mt-1 inline-block"
                >
                  Manage Plan (₦) →
                </Link>
              </div>
            </div>

            {/* Main Columns */}
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
              {/* Subject CA Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Subject Continuous Assessment (CA / 30)
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeWard.analytics.termName}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeWard.analytics.subjectRows.map((item) => (
                    <div
                      key={item.subjectId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-bold text-[#0B1F3A]">{item.subjectName}</p>
                        <p className="text-xs text-slate-500">{item.remark}</p>
                      </div>
                      <div className="flex items-center gap-6 tabular-nums text-right">
                        <div>
                          <p className="text-xs text-slate-500">CA Score</p>
                          <p className="font-bold text-[#0B1F3A]">{item.caScore}/30</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Est. Grade</p>
                          <p className="font-bold text-[#0D9488]">
                            {item.totalPercentage}% ({item.waecGrade})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timetable, Activity & Fee Receipts */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0B1F3A]">
                      Scheduled Classes (WAT)
                    </h2>
                    <Link
                      href="/timetable"
                      className="text-xs font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                    >
                      Timetable
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {activeWard.upcomingTimetable.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Published timetable periods for {activeWard.student.classLevel} will appear here.
                    </p>
                  ) : (
                    activeWard.upcomingTimetable.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen size={15} className="text-[#0D9488] shrink-0" />
                          <div>
                            <p className="font-bold text-[#0B1F3A]">
                              {slot.subjectName}
                            </p>
                            <p className="text-slate-500">
                              {slot.dayOfWeek} · {slot.mode}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-[#0B1F3A] tabular-nums inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Recent Quiz &amp; Fee Activity
                  </h2>
                  {activeWard.analytics.recentAttempts.length === 0 &&
                  activeWard.payments.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Quiz completions and verified Naira (₦) subscription payments will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeWard.analytics.recentAttempts.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#0B1F3A]">{act.title}</p>
                            <p className="text-slate-500 mt-0.5">{act.subjectName}</p>
                          </div>
                          <span className="font-bold text-[#0D9488] tabular-nums">
                            {act.percentage}%
                          </span>
                        </div>
                      ))}

                      {activeWard.payments.slice(0, 2).map((pay) => (
                        <div
                          key={pay.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#0B1F3A]">{pay.planName}</p>
                            <p className="text-slate-500 mt-0.5">{pay.status}</p>
                          </div>
                          <span className="font-bold text-[#0B1F3A] tabular-nums">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleLinkWard}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B1F3A]">
                Link Child / Student Account
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Enter your child&apos;s registered Learnova student email address to monitor their progress and download report cards.
            </p>

            {linkError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
                {linkError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Student Email Address
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@learnova.ng"
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
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
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={linking}
                className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {linking && <Loader2 size={13} className="animate-spin" />}
                Link Student
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
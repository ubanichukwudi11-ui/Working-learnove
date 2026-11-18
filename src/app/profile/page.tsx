"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_ACADEMIC_TERM, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import {
  Check,
  CreditCard,
  ShieldCheck,
  User,
  X,
  ArrowRight,
  Building2,
} from "lucide-react";

interface GuardianRequestItem {
  linkId: string;
  parentUserId: string;
  parentName: string;
  parentEmail: string;
  relationship: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  verificationCode?: string;
  linkedAt: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [classLevel, setClassLevel] = useState(user?.classLevel || "SS1");
  const [schoolName, setSchoolName] = useState(user?.schoolName || "");
  const [examFocus, setExamFocus] = useState(user?.examPreparation || "WAEC & JAMB");
  const [lowDataDefault, setLowDataDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [guardianRequests, setGuardianRequests] = useState<GuardianRequestItem[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [subSummary, setSubSummary] = useState<{
    status: string;
    planName: string;
    expiresAt?: string;
    isExpired: boolean;
    isActive: boolean;
  } | null>(null);

  const loadStudentContext = useCallback(async () => {
    if (user?.role !== "STUDENT") return;
    try {
      const [parentRes, subRes] = await Promise.all([
        fetch("/api/lms/parent?scope=student", { cache: "no-store" }),
        fetch("/api/lms/subscriptions", { cache: "no-store" }),
      ]);
      if (parentRes.ok) {
        const data = await parentRes.json();
        setGuardianRequests(data.requests || []);
      }
      if (subRes.ok) {
        const sub = await subRes.json();
        const ent = sub.entitlement;
        const payments = Array.isArray(sub.payments) ? sub.payments : [];
        const latestVerified = payments.find((p: any) => p.status === "VERIFIED");
        const status = ent?.accessStatus || sub.enrolment?.status || "REGISTERED";
        const isExpired =
          status === "EXPIRED" ||
          (Boolean(ent?.expiresAt) && new Date(ent.expiresAt).getTime() < Date.now());
        const isActive =
          !isExpired && (status === "ACTIVE_PAID" || status === "SCHOLARSHIP_GRANTED");

        setSubSummary({
          status: isExpired ? "EXPIRED" : status,
          planName:
            latestVerified?.planName ||
            (status === "SCHOLARSHIP_GRANTED"
              ? "School Scholarship Access"
              : "Learnova Student Access"),
          expiresAt: ent?.expiresAt,
          isExpired,
          isActive,
        });
      }
    } catch {}
  }, [user?.role]);

  useEffect(() => {
    if (user?.classLevel) setClassLevel(user.classLevel);
    if (user?.schoolName) setSchoolName(user.schoolName);
    if (user?.examPreparation) setExamFocus(user.examPreparation);
    loadStudentContext();
  }, [user?.classLevel, user?.schoolName, user?.examPreparation, loadStudentContext]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classLevel,
          schoolName: schoolName.trim() || undefined,
          examPreparation: examFocus,
        }),
      });
      if (res.ok) {
        await refreshUser();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRespondGuardian = async (
    linkId: string,
    decision: "APPROVE" | "REJECT"
  ) => {
    setRespondingId(linkId);
    try {
      await fetch("/api/lms/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESPOND_LINK", linkId, decision }),
      });
      await loadStudentContext();
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="max-w-3xl space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Account &amp; Learning Preferences
            </h1>
            <p className="text-sm text-indigo-100/80 mt-1">
              Review your account details, subscription status, and study preferences.
            </p>
          </div>

          <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-sm">
                <User size={24} />
              </div>
              <div className="min-w-0">
                <h2 className="landing-display text-lg font-bold text-[#0B1230] truncate">
                  {user?.fullName || "Learnova User"}
                </h2>
                <p className="text-sm text-[#43466E] truncate">{user?.email}</p>
                <p className="text-xs font-semibold text-[#4F46E5] mt-0.5">
                  Role: {user?.role} · Timezone: {TIMEZONE_LABEL}
                </p>
              </div>
            </div>

            {user?.schoolName && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] px-3.5 py-2 text-xs font-semibold text-[#0B1230] shrink-0">
                <Building2 size={14} className="text-[#4F46E5]" />
                {user.schoolName}
              </div>
            )}
          </div>

          {/* Compact Student Subscription Status Indicator */}
          {user?.role === "STUDENT" && subSummary && (
            <div className="learnova-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    subSummary.isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : subSummary.isExpired
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-indigo-50 text-[#4F46E5] border border-indigo-200"
                  }`}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0B1230]">
                      Subscription Status
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        subSummary.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : subSummary.isExpired
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {subSummary.isActive
                        ? "Active"
                        : subSummary.isExpired
                        ? "Expired"
                        : subSummary.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#43466E] mt-1">
                    {subSummary.isActive
                      ? `${subSummary.planName}${
                          subSummary.expiresAt
                            ? ` · Valid until ${new Date(
                                subSummary.expiresAt
                              ).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                            : ""
                        }`
                      : subSummary.isExpired
                      ? "Your subscription has expired. Renew to regain live classroom access."
                      : "No active paid pass yet."}
                  </p>
                </div>
              </div>

              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] hover:bg-[#EDE9FE] px-4 py-2 text-xs font-bold text-[#4F46E5] transition shrink-0 whitespace-nowrap"
              >
                {subSummary.isActive
                  ? "View Plan"
                  : subSummary.isExpired
                  ? "Renew Plan"
                  : "Choose a Plan"}
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {user?.role === "STUDENT" && guardianRequests.length > 0 && (
            <div className="learnova-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#4F46E5]" />
                <h2 className="landing-display text-base font-bold text-[#0B1230]">
                  Parent / Guardian Link Requests
                </h2>
              </div>
              <p className="text-xs text-[#6B6F94]">
                Approve only parents or guardians you authorize to view your attendance, quiz scores, and report cards.
              </p>
              <div className="space-y-3">
                {guardianRequests.map((reqItem) => (
                  <div
                    key={reqItem.linkId}
                    className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0B1230]">
                        {reqItem.parentName} ({reqItem.relationship})
                      </p>
                      <p className="text-xs text-[#6B6F94]">
                        {reqItem.parentEmail} · Status:{" "}
                        <span className="font-semibold text-[#4F46E5]">
                          {reqItem.status.replace(/_/g, " ")}
                        </span>
                      </p>
                      {reqItem.verificationCode && (
                        <p className="text-xs font-mono font-bold text-[#0B1230] mt-1">
                          Verification Code: {reqItem.verificationCode}
                        </p>
                      )}
                    </div>

                    {reqItem.status === "PENDING_VERIFICATION" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={respondingId === reqItem.linkId}
                          onClick={() => handleRespondGuardian(reqItem.linkId, "APPROVE")}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === reqItem.linkId}
                          onClick={() => handleRespondGuardian(reqItem.linkId, "REJECT")}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition disabled:opacity-50"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="learnova-card p-6 space-y-5">
            <h2 className="landing-display text-base font-bold text-[#0B1230]">
              Academic Profile &amp; Preferences
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {user?.role === "STUDENT" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                    School Name
                  </label>
                  <input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Your school name"
                    className="learnova-input text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                  Class Level
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="learnova-input text-sm"
                >
                  <option value="JSS1">JSS1</option>
                  <option value="JSS2">JSS2</option>
                  <option value="JSS3">JSS3 (BECE)</option>
                  <option value="SS1">SS1</option>
                  <option value="SS2">SS2</option>
                  <option value="SS3">SS3 (WAEC / NECO / JAMB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                  Examination Focus
                </label>
                <select
                  value={examFocus}
                  onChange={(e) => setExamFocus(e.target.value)}
                  className="learnova-input text-sm"
                >
                  <option>WAEC &amp; JAMB</option>
                  <option>WAEC SSCE</option>
                  <option>NECO SSCE</option>
                  <option>BECE Junior Secondary</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lowDataDefault}
                onChange={(e) => setLowDataDefault(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1230]">
                  Prefer Low-Bandwidth Audio-First Mode in Live Classes
                </p>
                <p className="text-xs text-[#6B6F94] mt-0.5">
                  Optimizes live sessions for 3G/4G mobile connections by prioritizing crystal-clear audio and presentation slides.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Check size={15} />
                  Preferences saved
                </span>
              )}
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { PageHeader, CardSkeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CURRENT_ACADEMIC_TERM, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import {
  Check,
  CreditCard,
  ShieldCheck,
  User as UserIcon,
  X,
  ArrowRight,
  Building2,
  SlidersHorizontal,
  Lock,
  Bell,
  LogOut,
  Loader2,
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

type ProfileTab = "profile" | "preferences" | "security" | "notifications";

export default function ProfilePage() {
  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <Suspense fallback={<CardSkeleton rows={4} />}>
          <ProfileWorkspace />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

function ProfileWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser, logout } = useAuth();

  const paramTab = searchParams.get("tab");
  const initialTab: ProfileTab =
    paramTab === "preferences" ||
    paramTab === "security" ||
    paramTab === "notifications"
      ? paramTab
      : "profile";

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    if (
      paramTab === "profile" ||
      paramTab === "preferences" ||
      paramTab === "security" ||
      paramTab === "notifications"
    ) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [classLevel, setClassLevel] = useState(user?.classLevel || "SS1");
  const [schoolName, setSchoolName] = useState(user?.schoolName || "");
  const [examFocus, setExamFocus] = useState(user?.examPreparation || "WAEC & JAMB");
  const [lowDataDefault, setLowDataDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secSaving, setSecSaving] = useState(false);
  const [secMessage, setSecMessage] = useState<string | null>(null);
  const [secError, setSecError] = useState<string | null>(null);

  const [notifPrefs, setNotifPrefs] = useState({
    liveClassAlerts: true,
    timetableChanges: true,
    assignmentReminders: true,
    billingUpdates: true,
  });

  const [guardianRequests, setGuardianRequests] = useState<GuardianRequestItem[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [subSummary, setSubSummary] = useState<{
    status: string;
    planName: string;
    expiresAt?: string;
    isExpired: boolean;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      const savedLowData = localStorage.getItem("learnova_low_data_mode");
      if (savedLowData !== null) setLowDataDefault(savedLowData === "true");
      const savedNotif = localStorage.getItem("learnova_notification_prefs");
      if (savedNotif) {
        const parsed = JSON.parse(savedNotif);
        setNotifPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

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
    if (user?.fullName) setFullName(user.fullName);
    if (user?.phone) setPhone(user.phone);
    if (user?.classLevel) setClassLevel(user.classLevel);
    if (user?.schoolName) setSchoolName(user.schoolName);
    if (user?.examPreparation) setExamFocus(user.examPreparation);
    loadStudentContext();
  }, [
    user?.fullName,
    user?.phone,
    user?.classLevel,
    user?.schoolName,
    user?.examPreparation,
    loadStudentContext,
  ]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr(null);
    setSavedMsg(null);
    try {
      const payload: Record<string, unknown> = {
        fullName: fullName.trim() || undefined,
        phone: phone.trim(),
      };
      if (user?.role === "STUDENT") {
        payload.classLevel = classLevel;
        payload.schoolName = schoolName.trim() || undefined;
        payload.examPreparation = examFocus;
      }
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveErr(data.error || "Unable to save profile updates.");
        return;
      }
      await refreshUser();
      setSavedMsg("Profile details updated.");
      setTimeout(() => setSavedMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("learnova_low_data_mode", String(lowDataDefault));
      setSavedMsg("Appearance and bandwidth preferences saved.");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch {}
  };

  const handleToggleNotifPref = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("learnova_notification_prefs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMessage(null);
    setSecError(null);
    if (newPassword.length < 8) {
      setSecError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecError("Passwords do not match.");
      return;
    }
    if (!isSupabaseConfigured) {
      setSecError("Supabase authentication is not configured in this environment.");
      return;
    }
    setSecSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setSecError(error.message);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setSecMessage("Your password has been updated securely.");
    } finally {
      setSecSaving(false);
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

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  const initials = (user?.fullName || "LU")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabs: Array<{ id: ProfileTab; label: string; icon: typeof UserIcon }> = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "preferences", label: "Appearance & Audio", icon: SlidersHorizontal },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        kicker={CURRENT_ACADEMIC_TERM}
        title="Profile & Account Settings"
        description="Manage your Learnova identity, theme preference, account security, and notifications."
        breadcrumbs={[{ label: "Profile & Settings" }]}
        actions={
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-rose-500/80 border border-white/20 text-white text-xs font-bold transition whitespace-nowrap"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        }
      />

      {/* Identity Overview Card */}
      <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center text-base font-extrabold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="landing-display text-lg font-bold text-[var(--foreground)] truncate">
              {user?.fullName || "Learnova User"}
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] truncate">{user?.email}</p>
            <p className="text-xs font-semibold text-[#4F46E5] dark:text-[#A5B4FC] mt-0.5">
              Role: {user?.role} · Timezone: {TIMEZONE_LABEL}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user?.schoolName && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)]">
              <Building2 size={14} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
              {user.schoolName}
            </div>
          )}
          {user?.role === "TEACHER" && (
            <Link
              href="/teacher/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] px-3.5 py-2 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] transition"
            >
              Educator Allocations →
            </Link>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                active
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-transparent shadow-sm"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-lavender)]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Student Subscription Status Indicator */}
          {user?.role === "STUDENT" && subSummary && (
            <div className="learnova-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    subSummary.isActive
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      : subSummary.isExpired
                      ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                      : "bg-indigo-500/12 text-[#4F46E5] dark:text-[#A5B4FC]"
                  }`}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Subscription Status
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        subSummary.isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : subSummary.isExpired
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {subSummary.isActive
                        ? "Active"
                        : subSummary.isExpired
                        ? "Expired"
                        : subSummary.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    {subSummary.isActive
                      ? `${subSummary.planName}${
                          subSummary.expiresAt
                            ? ` · Valid until ${new Date(
                                subSummary.expiresAt
                              ).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                            : ""
                        }`
                      : subSummary.isExpired
                      ? "Your subscription has expired. Renew to restore live classroom access."
                      : "No active paid pass yet."}
                  </p>
                </div>
              </div>

              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] px-4 py-2 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] transition shrink-0 whitespace-nowrap"
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

          {/* Parent / Guardian Link Requests */}
          {user?.role === "STUDENT" && guardianRequests.length > 0 && (
            <div className="learnova-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                  Parent / Guardian Link Requests
                </h2>
              </div>
              <p className="text-xs text-[var(--foreground-subtle)]">
                Approve only parents or guardians you authorize to view your attendance, quiz scores, and report cards.
              </p>
              <div className="space-y-3">
                {guardianRequests.map((reqItem) => (
                  <div
                    key={reqItem.linkId}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {reqItem.parentName} ({reqItem.relationship})
                      </p>
                      <p className="text-xs text-[var(--foreground-subtle)]">
                        {reqItem.parentEmail} · Status:{" "}
                        <span className="font-semibold text-[#4F46E5] dark:text-[#A5B4FC]">
                          {reqItem.status.replace(/_/g, " ")}
                        </span>
                      </p>
                      {reqItem.verificationCode && (
                        <p className="text-xs font-mono font-bold text-[var(--foreground)] mt-1">
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
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition disabled:opacity-50"
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

          {/* Edit Profile Form */}
          <form onSubmit={handleSaveProfile} className="learnova-card p-6 space-y-5">
            <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
              Personal &amp; Academic Details
            </h2>

            {saveErr && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
                {saveErr}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="learnova-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="learnova-input"
                />
              </div>

              {user?.role === "STUDENT" && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                      School Name
                    </label>
                    <input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Your school name"
                      className="learnova-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                      Class Level
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="learnova-input"
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
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                      Examination Focus
                    </label>
                    <select
                      value={examFocus}
                      onChange={(e) => setExamFocus(e.target.value)}
                      className="learnova-input"
                    >
                      <option>WAEC &amp; JAMB</option>
                      <option>WAEC SSCE</option>
                      <option>NECO SSCE</option>
                      <option>BECE Junior Secondary</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving..." : "Save Profile Changes"}
              </button>
              {savedMsg && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Check size={15} />
                  {savedMsg}
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="learnova-card p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
              Appearance &amp; Theme
            </h2>
            <p className="text-xs text-[var(--foreground-subtle)]">
              Choose Light, Dark, or match your device&apos;s system setting across every Learnova page.
            </p>
            <div className="max-w-sm pt-1">
              <ThemeSwitcher variant="segmented" />
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Bandwidth &amp; Live Class Audio
            </h3>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lowDataDefault}
                onChange={(e) => setLowDataDefault(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Prefer Low-Bandwidth Audio-First Mode in Live Classes
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  Optimizes live sessions for mobile data connections by prioritizing clear audio and shared presentation slides.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
            >
              Save Preferences
            </button>
            {savedMsg && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check size={15} />
                {savedMsg}
              </span>
            )}
          </div>
        </form>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="learnova-card p-6 space-y-4">
            <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
              Password &amp; Authentication Security
            </h2>
            <p className="text-xs text-[var(--foreground-subtle)]">
              Signed in via{" "}
              <strong className="text-[var(--foreground)]">
                {user?.authProvider === "google" ? "Google OAuth" : "Email & Password"}
              </strong>{" "}
              ({user?.email}).
            </p>

            {secError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
                {secError}
              </div>
            )}
            {secMessage && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                {secMessage}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="grid sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="learnova-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="learnova-input"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={secSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {secSaving && <Loader2 size={14} className="animate-spin" />}
                  {secSaving ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Session Control</h3>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                Sign out cleanly on shared classroom or home devices.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition shrink-0"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="learnova-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                Notification Preferences
              </h2>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                Control which workspace alerts are prioritized in your Notification Center.
              </p>
            </div>
            <Link
              href="/notifications"
              className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
            >
              View Notification Center →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                key: "liveClassAlerts" as const,
                title: "Live Classroom Session Alerts",
                desc: "Notify when your allocated teacher opens or starts a live classroom.",
              },
              {
                key: "timetableChanges" as const,
                title: "Timetable & Schedule Changes",
                desc: "Receive updates when School Admin publishes or updates weekly WAT periods.",
              },
              {
                key: "assignmentReminders" as const,
                title: "Assignments & Quiz Deadlines",
                desc: "Alerts for newly published topic quizzes, CBT drills, and graded feedback.",
              },
              {
                key: "billingUpdates" as const,
                title: "Subscription & Receipt Confirmations",
                desc: "Notifications for Paystack verifications, renewals, and scholarship grants.",
              },
            ].map((pref) => (
              <label
                key={pref.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {pref.title}
                  </p>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                    {pref.desc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[pref.key]}
                  onChange={() => handleToggleNotifPref(pref.key)}
                  className="mt-1 accent-[#4F46E5]"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

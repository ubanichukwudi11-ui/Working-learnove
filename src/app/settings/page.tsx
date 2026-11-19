"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { CardSkeleton, PageHeader } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_ACCESSIBILITY_PREFS,
  DEFAULT_NOTIFICATION_PREFS,
  readAccessibilityPrefs,
  readNotificationPrefs,
  saveAccessibilityPrefs,
  saveNotificationPrefs,
  type LearnovaAccessibilityPrefs,
  type LearnovaNotificationPrefs,
} from "@/lib/settingsPreferences";
import {
  Palette,
  Bell,
  Lock,
  ShieldCheck,
  Accessibility,
  Check,
  X,
  LogOut,
  Loader2,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type SettingsTab =
  | "appearance"
  | "notifications"
  | "security"
  | "privacy"
  | "accessibility";

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

export default function SettingsPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <Suspense fallback={<CardSkeleton lines={6} />}>
          <SettingsWorkspace />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

function SettingsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const paramTab = searchParams.get("tab");
  const resolveTab = (value: string | null): SettingsTab => {
    if (
      value === "appearance" ||
      value === "notifications" ||
      value === "security" ||
      value === "privacy" ||
      value === "accessibility"
    ) {
      return value;
    }
    return "appearance";
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => resolveTab(paramTab));
  const [notifPrefs, setNotifPrefs] = useState<LearnovaNotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS
  );
  const [a11yPrefs, setA11yPrefs] = useState<LearnovaAccessibilityPrefs>(
    DEFAULT_ACCESSIBILITY_PREFS
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secSaving, setSecSaving] = useState(false);
  const [secMessage, setSecMessage] = useState<string | null>(null);
  const [secError, setSecError] = useState<string | null>(null);

  const [guardianRequests, setGuardianRequests] = useState<GuardianRequestItem[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setNotifPrefs(readNotificationPrefs());
    setA11yPrefs(readAccessibilityPrefs());
  }, []);

  useEffect(() => {
    if (paramTab) {
      setActiveTab(resolveTab(paramTab));
    }
  }, [paramTab]);

  const loadPrivacyRequests = useCallback(async () => {
    if (user?.role !== "STUDENT") return;
    try {
      const res = await fetch("/api/lms/parent?scope=student", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setGuardianRequests(json.requests || []);
      }
    } catch {}
  }, [user?.role]);

  useEffect(() => {
    loadPrivacyRequests();
  }, [loadPrivacyRequests]);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2600);
  };

  const handleToggleNotif = (key: keyof LearnovaNotificationPrefs) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveNotificationPrefs(next);
      return next;
    });
    showSaved("Notification preferences updated.");
  };

  const handleToggleA11y = (key: keyof LearnovaAccessibilityPrefs) => {
    setA11yPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveAccessibilityPrefs(next);
      return next;
    });
    showSaved("Accessibility settings applied across your workspace.");
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
      await loadPrivacyRequests();
    } finally {
      setRespondingId(null);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Palette }> = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Account & Security", icon: Lock },
    { id: "privacy", label: "Privacy", icon: ShieldCheck },
    { id: "accessibility", label: "Accessibility", icon: Accessibility },
  ];

  const profileHref = user?.role === "TEACHER" ? "/teacher/profile" : "/profile";

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        variant="surface"
        kicker="Workspace Preferences"
        title="Settings"
        description="Configure your Learnova theme appearance, notification rules, account security, privacy, and accessibility preferences."
        breadcrumbs={[{ label: "Settings" }]}
        actions={
          <Link
            href={profileHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--foreground)] transition"
          >
            <UserIcon size={14} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
            Edit Profile
            <ArrowRight size={13} />
          </Link>
        }
      />

      {savedNotice && (
        <div className="learnova-glass-panel px-4 py-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Check size={15} />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="grid md:grid-cols-[230px_1fr] gap-6 items-start">
        {/* Settings Side Navigation */}
        <nav
          aria-label="Settings sections"
          className="learnova-glass-panel p-2.5 flex md:flex-col gap-1 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  router.replace(`/settings?tab=${tab.id}`, { scroll: false });
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap text-left ${
                  active
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Panel */}
        <div className="space-y-6 min-w-0">
          {activeTab === "appearance" && (
            <div className="learnova-card p-6 sm:p-7 space-y-6">
              <div>
                <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                  Appearance &amp; Theme
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Select how Learnova looks on your device. Your preference is saved across sessions.
                </p>
              </div>

              <div className="max-w-md space-y-2.5">
                <p className="text-xs font-bold text-[var(--foreground)]">Theme Mode</p>
                <ThemeSwitcher variant="segmented" />
                {mounted && (
                  <p className="text-[11px] text-[var(--foreground-subtle)]">
                    Active setting:{" "}
                    <strong className="text-[var(--foreground)] capitalize">
                      {theme || "system"}
                    </strong>{" "}
                    {theme === "system" && resolvedTheme
                      ? `(currently rendering ${resolvedTheme} mode)`
                      : ""}
                  </p>
                )}
              </div>

              {/* Live Theme Preview Cards */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--foreground)]">
                  Interactive Theme Preview
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "light" as const,
                      title: "Light Workspace",
                      desc: "Crisp white cards & soft lavender surfaces",
                      icon: Sun,
                      bg: "bg-[#F5F4FB] text-[#0B1230] border-[#D4CEF0]",
                      cardBg: "bg-white border-[#E4E1F5]",
                    },
                    {
                      id: "dark" as const,
                      title: "Dark Workspace",
                      desc: "Deep navy surfaces for evening study",
                      icon: Moon,
                      bg: "bg-[#070B1A] text-[#EEF1FF] border-[#2B366B]",
                      cardBg: "bg-[#0F162D] border-[#263159]",
                    },
                    {
                      id: "system" as const,
                      title: "System Default",
                      desc: "Follows your OS light or dark schedule",
                      icon: Monitor,
                      bg: "bg-gradient-to-br from-[#F5F4FB] via-[#E9E6FA] to-[#151A44] text-[#0B1230] border-[#7C3AED]/40",
                      cardBg: "bg-white/85 border-[#D4CEF0]",
                    },
                  ].map((preview) => {
                    const Icon = preview.icon;
                    const selected = mounted && theme === preview.id;
                    return (
                      <button
                        key={preview.id}
                        type="button"
                        onClick={() => {
                          setTheme(preview.id);
                          showSaved(`Theme updated to ${preview.title}.`);
                        }}
                        className={`text-left rounded-2xl border p-3.5 transition ${
                          selected
                            ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/25 bg-[var(--surface-lavender)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className={`rounded-xl border p-3 mb-3 ${preview.bg}`}>
                          <div className={`rounded-lg border p-2 ${preview.cardBg} flex items-center justify-between`}>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0B1230] dark:text-[#0B1230]">
                              <Sparkles size={12} className="text-[#4F46E5]" />
                              Learnova
                            </span>
                            <span className="w-5 h-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                            <Icon size={13} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                            {preview.title}
                          </span>
                          {selected && (
                            <span className="w-4 h-4 rounded-full bg-[#4F46E5] text-white flex items-center justify-center">
                              <Check size={10} />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                          {preview.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="learnova-card p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    Decide which alerts appear prominently in your Notification Center.
                  </p>
                </div>
                <Link
                  href="/notifications"
                  className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                >
                  Open Notification Center →
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "liveClassAlerts" as const,
                    title: "Live Classroom Session Alerts",
                    desc: "Notify when your scheduled teacher opens or starts a live session.",
                  },
                  {
                    key: "timetableChanges" as const,
                    title: "Timetable & Schedule Updates",
                    desc: "Alerts whenever School Admin publishes or adjusts weekly WAT periods.",
                  },
                  {
                    key: "assignmentReminders" as const,
                    title: "Assignments, Quizzes & Video Lessons",
                    desc: "Updates for new curriculum topics, CBT practice sets, and video materials.",
                  },
                  {
                    key: "billingUpdates" as const,
                    title: "Subscriptions & Payment Receipts",
                    desc: "Confirmations for verified payments, renewals, and scholarship grants.",
                  },
                  {
                    key: "applicationUpdates" as const,
                    title: "Educator Verification & Approval Alerts",
                    desc: "Immediate alerts on teacher credential review status or subject assignments.",
                  },
                ].map((pref) => (
                  <label
                    key={pref.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer hover:border-[var(--border-strong)] transition"
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
                      onChange={() => handleToggleNotif(pref.key)}
                      className="mt-1 h-4 w-4 accent-[#4F46E5] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="learnova-card p-6 sm:p-7 space-y-4">
                <div>
                  <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                    Account Security &amp; Password
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    Signed in via{" "}
                    <strong className="text-[var(--foreground)]">
                      {user?.authProvider === "google" ? "Google OAuth" : "Email & Password"}
                    </strong>{" "}
                    ({user?.email}).
                  </p>
                </div>

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
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Session Management</h3>
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

          {activeTab === "privacy" && (
            <div className="learnova-card p-6 sm:p-7 space-y-5">
              <div>
                <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                  Privacy &amp; Data Access
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Review how your academic records, verification documents, and family links are protected.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 space-y-1.5">
                <p className="text-xs font-bold text-[var(--foreground)]">
                  Private Storage &amp; Role Isolation
                </p>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Uploaded educator verification documents, profile credentials, and classroom records are stored in private buckets and accessible only through time-limited signed URLs authorized for your role or School Administration.
                </p>
              </div>

              {user?.role === "STUDENT" && (
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Parent / Guardian Link Requests
                  </h3>
                  {guardianRequests.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      No pending or active parent/guardian link requests on your account.
                    </p>
                  ) : (
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
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "accessibility" && (
            <div className="learnova-card p-6 sm:p-7 space-y-5">
              <div>
                <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                  Accessibility &amp; Bandwidth
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Adjust motion, visual contrast, and mobile-network optimizations to suit your device and comfort.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "reducedMotion" as const,
                    title: "Reduce Motion & Glass Transitions",
                    desc: "Minimizes animations and smooth transitions across dashboards, modals, and drawers.",
                  },
                  {
                    key: "highContrast" as const,
                    title: "High-Contrast Borders & Typography",
                    desc: "Strengthens card borders, input boundaries, and secondary text legibility.",
                  },
                  {
                    key: "lowDataMode" as const,
                    title: "Low-Bandwidth Audio-First Live Class Mode",
                    desc: "Prioritizes clear audio and shared slides on constrained mobile connections.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer hover:border-[var(--border-strong)] transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {opt.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={a11yPrefs[opt.key]}
                      onChange={() => handleToggleA11y(opt.key)}
                      className="mt-1 h-4 w-4 accent-[#4F46E5] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

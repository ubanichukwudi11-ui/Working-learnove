"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { CardSkeleton, PageHeader } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "@/lib/auth";
import {
  Palette,
  Bell,
  Shield,
  Eye,
  Lock,
  Check,
  Loader2,
  LogOut,
  User as UserIcon,
  Sparkles,
  Wifi,
} from "lucide-react";

type SettingsTab = "appearance" | "notifications" | "security" | "privacy";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const initialTabParam = searchParams.get("tab");
  const validTab: SettingsTab =
    initialTabParam === "notifications" ||
    initialTabParam === "security" ||
    initialTabParam === "privacy"
      ? initialTabParam
      : "appearance";

  const [activeTab, setActiveTab] = useState<SettingsTab>(validTab);

  // Notification prefs (persisted locally across sessions)
  const [notifLiveClass, setNotifLiveClass] = useState(true);
  const [notifTimetable, setNotifTimetable] = useState(true);
  const [notifApprovals, setNotifApprovals] = useState(true);
  const [notifDigest, setNotifDigest] = useState(true);

  // Privacy & Accessibility prefs
  const [lowDataMode, setLowDataMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<"CLASSMATES" | "TEACHERS_ONLY">("CLASSMATES");

  // Security / Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [secError, setSecError] = useState("");

  useEffect(() => {
    setMounted(true);
    const tab = searchParams.get("tab");
    if (
      tab === "appearance" ||
      tab === "notifications" ||
      tab === "security" ||
      tab === "privacy"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setNotifLiveClass(localStorage.getItem("learnova_notif_live") !== "false");
      setNotifTimetable(localStorage.getItem("learnova_notif_timetable") !== "false");
      setNotifApprovals(localStorage.getItem("learnova_notif_approvals") !== "false");
      setNotifDigest(localStorage.getItem("learnova_notif_digest") !== "false");
      setLowDataMode(localStorage.getItem("learnova_low_data") === "true");
      setReducedMotion(localStorage.getItem("learnova_reduced_motion") === "true");
      setHighContrast(localStorage.getItem("learnova_high_contrast") === "true");
      const vis = localStorage.getItem("learnova_profile_visibility");
      if (vis === "TEACHERS_ONLY" || vis === "CLASSMATES") {
        setProfileVisibility(vis);
      }
    } catch {
      // ignore storage unavailable
    }
  }, []);

  const flashSaved = (msg = "Preferences saved") => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const saveNotificationPrefs = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("learnova_notif_live", String(notifLiveClass));
      localStorage.setItem("learnova_notif_timetable", String(notifTimetable));
      localStorage.setItem("learnova_notif_approvals", String(notifApprovals));
      localStorage.setItem("learnova_notif_digest", String(notifDigest));
    }
    flashSaved("Notification preferences saved");
  };

  const savePrivacyAccessibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("learnova_low_data", String(lowDataMode));
      localStorage.setItem("learnova_reduced_motion", String(reducedMotion));
      localStorage.setItem("learnova_high_contrast", String(highContrast));
      localStorage.setItem("learnova_profile_visibility", profileVisibility);
      document.documentElement.classList.toggle("reduce-motion", reducedMotion);
      document.documentElement.classList.toggle("high-contrast", highContrast);
    }
    flashSaved("Privacy & accessibility settings updated");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError("");
    if (newPassword.length < 8) {
      setSecError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecError("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      flashSaved("Password updated securely");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update password.";
      setSecError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace("/login");
  };

  const profileHref = user?.role === "TEACHER" ? "/teacher/profile" : "/profile";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        variant="surface"
        kicker="Workspace Preferences"
        title="Settings"
        description="Manage appearance, theme mode, notification alerts, password security, privacy, and accessibility across all your sessions."
        actions={
          <Link
            href={profileHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-xs font-bold text-[var(--foreground)] transition whitespace-nowrap"
          >
            <UserIcon size={14} />
            Open My Profile
          </Link>
        }
      />

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "appearance" as const, label: "Appearance", icon: Palette },
          { id: "notifications" as const, label: "Notifications", icon: Bell },
          { id: "security" as const, label: "Account Security", icon: Shield },
          { id: "privacy" as const, label: "Privacy & Accessibility", icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSavedMsg("");
                setSecError("");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                active
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {savedMsg && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
          <Check size={15} />
          {savedMsg}
        </div>
      )}

      {/* APPEARANCE */}
      {activeTab === "appearance" && (
        <div className="space-y-5">
          <div className="learnova-card p-6 space-y-5">
            <div>
              <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                Theme Mode
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Select Light, Dark, or follow your device&apos;s System preference. Your choice is remembered automatically across sessions.
              </p>
            </div>

            <div className="max-w-md">
              <ThemeSwitcher variant="segmented" />
            </div>

            {/* Live Theme Preview */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-2.5">
                Live Surface Preview · Active: {mounted ? (resolvedTheme === "dark" ? "Dark Mode" : "Light Mode") : "Loading..."}
              </p>
              <div className="learnova-glass-panel p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#A5B4FC]">
                      Liquid Glass &amp; Content Surface
                    </p>
                    <p className="text-sm font-extrabold text-[var(--foreground)] mt-0.5">
                      Mathematics · SS2 Live Cohort
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={13} />
                    High Readability
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="learnova-card p-3.5 text-xs space-y-1">
                    <p className="font-bold text-[var(--foreground)]">Solid Reading Card</p>
                    <p className="text-[var(--foreground-muted)]">
                      Forms, tables, notes, and exams stay crisp and solid for comfortable study.
                    </p>
                  </div>
                  <div className="learnova-surface-muted rounded-xl p-3.5 text-xs flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--foreground-muted)]">
                      Primary Action
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-bold">
                      Continue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <form onSubmit={saveNotificationPrefs} className="learnova-card p-6 space-y-5">
          <div>
            <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
              Notification Preferences
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Control which Learnova updates trigger alerts in your notification feed.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Live Classroom Alerts",
                desc: "Notify me when an assigned live classroom opens or prepares materials.",
                checked: notifLiveClass,
                set: setNotifLiveClass,
              },
              {
                label: "Timetable & Schedule Changes",
                desc: "Notify me when official timetables or room allocations are published.",
                checked: notifTimetable,
                set: setNotifTimetable,
              },
              {
                label: "Account & Verification Updates",
                desc: "Notify me about educator approval decisions, subject assignments, or billing status.",
                checked: notifApprovals,
                set: setNotifApprovals,
              },
              {
                label: "Weekly Progress Summary",
                desc: "Receive periodic attendance, quiz mastery, and lesson progress updates.",
                checked: notifDigest,
                set: setNotifDigest,
              },
            ].map((item) => (
              <label
                key={item.label}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.set(e.target.checked)}
                  className="mt-0.5 accent-[#4F46E5]"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
          >
            Save Notification Preferences
          </button>
        </form>
      )}

      {/* SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-5">
          <div className="learnova-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lock size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
              <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                Password Management
              </h2>
            </div>

            <p className="text-xs text-[var(--foreground-muted)]">
              Signed in as <strong className="text-[var(--foreground)]">{user?.email}</strong> ({user?.authProvider === "google" ? "Google Sign-In" : "Email & Password"}).
            </p>

            {secError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
                {secError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="grid sm:grid-cols-2 gap-4 max-w-xl">
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
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="learnova-input"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingPassword && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Active Session Control
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Sign out of Learnova on this browser when using a shared computer.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition shrink-0"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY & ACCESSIBILITY */}
      {activeTab === "privacy" && (
        <form onSubmit={savePrivacyAccessibility} className="learnova-card p-6 space-y-5">
          <div>
            <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
              Privacy &amp; Accessibility
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Customize visual comfort, motion sensitivity, bandwidth usage, and directory visibility.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Reduce Motion &amp; Transitions
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  Minimizes interface animations, hover lifts, and slide transitions for visual comfort.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Higher Border &amp; Panel Contrast
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  Strengthens outlines on cards, tables, and form inputs for sharper separation.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lowDataMode}
                onChange={(e) => setLowDataMode(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <Wifi size={14} className="text-[#0891B2] dark:text-[#22D3EE]" />
                  Low-Bandwidth Audio-First Mode
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                  Saves mobile data during live classrooms by prioritizing voice and lesson slides.
                </p>
              </div>
            </label>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-2 max-w-md">
            <label className="block text-xs font-bold text-[var(--foreground)]">
              Classroom Profile Visibility
            </label>
            <select
              value={profileVisibility}
              onChange={(e) =>
                setProfileVisibility(
                  e.target.value === "TEACHERS_ONLY" ? "TEACHERS_ONLY" : "CLASSMATES"
                )
              }
              className="learnova-input text-sm"
            >
              <option value="CLASSMATES">Visible to assigned teachers &amp; cohort classmates</option>
              <option value="TEACHERS_ONLY">Visible to teachers &amp; administrators only</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
          >
            Save Privacy &amp; Accessibility
          </button>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<CardSkeleton lines={6} />}>
          <SettingsContent />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

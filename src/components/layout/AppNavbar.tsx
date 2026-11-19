"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Search,
  Clock,
  CheckCheck,
  GraduationCap,
  Menu,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Settings,
  Shield,
  CreditCard,
  SlidersHorizontal,
} from "lucide-react";
import { formatLagosTime, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import { PWAInstallButton } from "@frontend/components/pwa/PwaSupport";
import { useSidebar } from "@/context/SidebarContext";
import ThemeSwitcher from "./ThemeSwitcher";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl?: string;
};

type PersistentNotif = {
  id: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
};

type SearchCandidate = {
  label: string;
  category: string;
  href: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Home",
  subjects: "My Learning",
  videos: "Video Lessons",
  notebook: "Notebook",
  assignments: "Practice & Exams",
  "live-classes": "Live Classrooms",
  timetable: "Timetable",
  nova: "Nova AI",
  analytics: "Achievements",
  subscriptions: "Subscriptions & Billing",
  notifications: "Notifications",
  profile: "Profile & Settings",
  teacher: "Educator Home",
  applications: "Applications",
  classes: "Classes & Timetable",
  notes: "Lesson Studio",
  attendance: "Attendance",
  students: "Students",
  parent: "Parent Portal",
  admin: "School Admin",
  academics: "Academics",
  classrooms: "Classroom Control",
  teachers: "Teacher Approvals",
  payments: "Payments & Access",
  "ai-assistant": "Admin AI Copilot",
  "super-admin": "Platform Console",
};

function getRoleRoutesForSearch(role: string): SearchCandidate[] {
  if (role === "SUPER_ADMIN") {
    return [
      { label: "Platform Governance Console", category: "Page", href: "/super-admin" },
      { label: "School Admin Overview", category: "Page", href: "/admin" },
      { label: "Academics & Curriculum", category: "Page", href: "/admin/academics" },
      { label: "Timetable Scheduler", category: "Page", href: "/admin/timetable" },
      { label: "Classroom Control Centre", category: "Page", href: "/admin/classrooms" },
      { label: "Teacher Approvals", category: "Page", href: "/admin/teachers" },
      { label: "Students Directory", category: "Page", href: "/admin/students" },
      { label: "Payments & Access", category: "Page", href: "/admin/payments" },
      { label: "Admin AI Copilot", category: "Page", href: "/admin/ai-assistant" },
      { label: "Profile & Settings", category: "Account", href: "/profile" },
    ];
  }
  if (role === "ADMIN") {
    return [
      { label: "School Admin Overview", category: "Page", href: "/admin" },
      { label: "Academics & Curriculum", category: "Page", href: "/admin/academics" },
      { label: "Timetable Scheduler", category: "Page", href: "/admin/timetable" },
      { label: "Classroom Control Centre", category: "Page", href: "/admin/classrooms" },
      { label: "Video Lessons Manager", category: "Page", href: "/admin/videos" },
      { label: "Teacher Approvals", category: "Page", href: "/admin/teachers" },
      { label: "Students Directory", category: "Page", href: "/admin/students" },
      { label: "Payments & Access", category: "Page", href: "/admin/payments" },
      { label: "Admin AI Copilot", category: "Page", href: "/admin/ai-assistant" },
      { label: "Profile & Settings", category: "Account", href: "/profile" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { label: "Educator Home", category: "Page", href: "/teacher" },
      { label: "My Classes & Timetable", category: "Page", href: "/teacher/classes" },
      { label: "Video Lessons Studio", category: "Page", href: "/teacher/videos" },
      { label: "Lesson Notes", category: "Page", href: "/teacher/notes" },
      { label: "Assignments & Quizzes", category: "Page", href: "/teacher/assignments" },
      { label: "Attendance Logs", category: "Page", href: "/teacher/attendance" },
      { label: "Students Roster", category: "Page", href: "/teacher/students" },
      { label: "Subject Applications", category: "Page", href: "/teacher/applications" },
      { label: "Educator Profile", category: "Account", href: "/teacher/profile" },
    ];
  }
  if (role === "PARENT") {
    return [
      { label: "Parent Overview", category: "Page", href: "/parent" },
      { label: "Ward Timetable", category: "Page", href: "/timetable" },
      { label: "Live Classrooms", category: "Page", href: "/live-classes" },
      { label: "Subscriptions & Billing", category: "Page", href: "/subscriptions" },
      { label: "Notifications", category: "Page", href: "/notifications" },
      { label: "Profile & Settings", category: "Account", href: "/profile" },
    ];
  }
  return [
    { label: "Student Home", category: "Page", href: "/dashboard" },
    { label: "My Learning · Subjects", category: "Page", href: "/subjects" },
    { label: "Video Lessons Library", category: "Page", href: "/videos" },
    { label: "Practice & Exams (CBT)", category: "Page", href: "/assignments" },
    { label: "Live Classrooms", category: "Page", href: "/live-classes" },
    { label: "Class Timetable", category: "Page", href: "/timetable" },
    { label: "Study Notebook", category: "Page", href: "/notebook" },
    { label: "Nova AI Tutor", category: "Page", href: "/nova" },
    { label: "Achievements & Progress", category: "Page", href: "/analytics" },
    { label: "Subscriptions & Billing", category: "Account", href: "/subscriptions" },
    { label: "Profile & Settings", category: "Account", href: "/profile" },
  ];
}

export default function AppNavbar({ user, onLogout }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { collapsed, toggleMobile } = useSidebar();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [notifications, setNotifications] = useState<PersistentNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchIndex, setSearchIndex] = useState<SearchCandidate[]>([]);
  const [lagosTime, setLagosTime] = useState(() => formatLagosTime());

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Workspace", href: "/dashboard" }];
    return segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label =
        ROUTE_LABELS[seg] ||
        (seg.length > 18 ? "Details" : seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      return { label, href };
    });
  }, [pathname]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // ignore transient network errors
    }
  }, []);

  const fetchSearchCandidates = useCallback(async () => {
    const baseItems = getRoleRoutesForSearch(user.role);
    try {
      const items: SearchCandidate[] = [...baseItems];
      const [acadRes, roomsRes] = await Promise.all([
        fetch("/api/lms/academics", { cache: "no-store" }),
        fetch("/api/lms/classrooms", { cache: "no-store" }),
      ]);
      if (acadRes.ok) {
        const acad = await acadRes.json();
        for (const s of acad.subjects || []) {
          items.push({
            label: `${s.name} (${s.code})`,
            category: "Subject",
            href:
              user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                ? "/admin/academics"
                : user.role === "TEACHER"
                ? "/teacher/classes"
                : `/subjects/${s.id}`,
          });
        }
      }
      if (roomsRes.ok) {
        const rm = await roomsRes.json();
        for (const c of rm.classrooms || []) {
          items.push({
            label: `${c.subjectName} · ${c.classLevelName} (${c.groupName})`,
            category: c.status === "LIVE" ? "Live Classroom" : "Classroom",
            href:
              user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                ? "/admin/classrooms"
                : user.role === "TEACHER"
                ? `/teacher/live-class/${c.id}`
                : `/live-classes/${c.id}`,
          });
        }
      }
      setSearchIndex(items);
    } catch {
      setSearchIndex(baseItems);
    }
  }, [user.role]);

  useEffect(() => {
    fetchNotifications();
    fetchSearchCandidates();
    const timer = setInterval(fetchNotifications, 15000);
    return () => clearInterval(timer);
  }, [fetchNotifications, fetchSearchCandidates]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLagosTime(formatLagosTime());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifications(false);
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 5);
    return searchIndex
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 7);
  }, [query, searchIndex]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/lms/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    }).catch(() => {});
  };

  const markOneRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/lms/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_READ", notificationId }),
    }).catch(() => {});
  };

  const initials = (user.fullName || "LN")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadgeLabel = () => {
    switch (user.role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "School Admin";
      case "TEACHER":
        return "Educator";
      case "PARENT":
        return "Parent";
      default:
        return "Student";
    }
  };

  const profileHref = user.role === "TEACHER" ? "/teacher/profile" : "/profile";

  return (
    <header
      className={`fixed top-0 right-0 left-0 h-16 z-40 bg-[var(--surface)]/92 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 transition-[left,background-color] duration-200 ease-out ${
        collapsed ? "md:left-[76px]" : "md:left-64"
      }`}
    >
      {/* Mobile Drawer Toggle + Brand */}
      <div className="flex items-center gap-2.5 md:hidden shrink-0">
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-lavender)] transition"
        >
          <Menu size={18} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shadow-sm shadow-[#4F46E5]/25">
          <GraduationCap size={17} />
        </div>
        <span className="landing-display font-extrabold text-[var(--foreground)] text-base tracking-tight">
          Learnova
        </span>
      </div>

      {/* Desktop Breadcrumb Context */}
      <nav
        aria-label="Workspace breadcrumb"
        className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--foreground-subtle)] shrink-0 max-w-[260px] truncate"
      >
        {breadcrumbs.map((bc, idx) => (
          <span key={bc.href} className="inline-flex items-center gap-1.5 min-w-0">
            {idx > 0 && <ChevronRight size={13} className="shrink-0 opacity-60" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-bold text-[var(--foreground)] truncate">
                {bc.label}
              </span>
            ) : (
              <Link
                href={bc.href}
                className="font-medium hover:text-[var(--foreground)] truncate transition"
              >
                {bc.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block min-w-0">
        <div className="flex items-center gap-2.5 bg-[var(--surface-lavender)] border border-[var(--border)] focus-within:border-[#7C3AED] focus-within:bg-[var(--surface)] focus-within:ring-2 focus-within:ring-[#7C3AED]/15 rounded-xl px-3.5 py-2 transition">
          <Search size={16} className="text-[var(--foreground-subtle)] shrink-0" />
          <input
            ref={searchInputRef}
            value={query}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSearch(true);
            }}
            placeholder="Search pages, subjects, or classrooms..."
            className="bg-transparent outline-none text-sm text-[var(--foreground)] w-full placeholder:text-[var(--foreground-subtle)]"
          />
          <kbd className="hidden lg:inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground-subtle)] shrink-0">
            Ctrl K
          </kbd>
        </div>

        {showSearch && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl py-2 z-50">
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
              {query.trim() ? "Matching Results" : "Quick Navigation"}
            </p>
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <button
                  key={`${res.href}-${i}`}
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setQuery("");
                    router.push(res.href);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[var(--surface-lavender)] flex items-center justify-between gap-2 transition"
                >
                  <span className="text-sm font-medium text-[var(--foreground)] truncate">
                    {res.label}
                  </span>
                  <span className="text-xs text-[#6D28D9] dark:text-[#C4B5FD] font-semibold shrink-0">
                    {res.category}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-xs text-[var(--foreground-subtle)]">
                No matches found for &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Info & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] font-medium tabular-nums bg-[var(--surface-lavender)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
          <Clock size={14} className="text-[#0891B2] dark:text-[#22D3EE]" />
          <span>{lagosTime}</span>
          <span>·</span>
          <span>{TIMEZONE_LABEL}</span>
        </div>

        <PWAInstallButton />

        <ThemeSwitcher variant="compact" />

        {/* Notification Center */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowAccountMenu(false);
              fetchNotifications();
            }}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="relative p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:border-[var(--border-strong)] hover:bg-[var(--surface-lavender)] transition"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-lavender)] flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--foreground)]">
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      No notifications yet
                    </p>
                    <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                      Timetable updates, classroom alerts, and approvals will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <Link
                      key={n.id}
                      href={n.href || "/notifications"}
                      onClick={() => {
                        markOneRead(n.id);
                        setShowNotifications(false);
                      }}
                      className={`block px-4 py-3 hover:bg-[var(--surface-lavender)] transition ${
                        !n.isRead ? "bg-[#4F46E5]/5 dark:bg-[#4F46E5]/12" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--foreground)]">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[11px] text-[var(--foreground-subtle)] mt-1 block">
                        {new Date(n.createdAt).toLocaleString("en-NG", {
                          timeZone: "Africa/Lagos",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-lavender)] text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
                >
                  Open Notification Center →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Account & Profile Dropdown Menu */}
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowAccountMenu((p) => !p);
              setShowNotifications(false);
            }}
            aria-label="Open account menu"
            aria-expanded={showAccountMenu}
            className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-lavender)] hover:border-[var(--border-strong)] p-1 sm:pr-2.5 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B1230] via-[#151A44] to-[#4F46E5] text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-[#EDE9FE] dark:ring-white/15">
              {initials || "LN"}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[130px]">
                {user.fullName}
              </p>
              <p className="text-[11px] font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">
                {roleBadgeLabel()}
              </p>
            </div>
            <ChevronDown size={14} className="hidden sm:block text-[var(--foreground-subtle)]" />
          </button>

          {showAccountMenu && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              {/* User Identity Header */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-lavender)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {initials || "LN"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-[var(--foreground-subtle)] truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
                    {roleBadgeLabel()}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  href={profileHref}
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
                >
                  <UserIcon size={15} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                  View &amp; Edit Profile
                </Link>
                <Link
                  href="/profile?tab=preferences"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
                >
                  <SlidersHorizontal size={15} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                  Account &amp; Learning Settings
                </Link>
                <Link
                  href="/profile?tab=security"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
                >
                  <Shield size={15} className="text-[#0891B2] dark:text-[#22D3EE]" />
                  Security &amp; Password
                </Link>
                <Link
                  href="/profile?tab=notifications"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
                >
                  <Bell size={15} className="text-amber-600 dark:text-amber-400" />
                  Notification Preferences
                </Link>
                {(user.role === "STUDENT" || user.role === "PARENT") && (
                  <Link
                    href="/subscriptions"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
                  >
                    <CreditCard size={15} className="text-teal-600 dark:text-teal-400" />
                    Subscription &amp; Billing
                  </Link>
                )}
              </div>

              {/* Theme Picker Inline */}
              <div className="px-3 py-2.5 border-t border-[var(--border)] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--foreground-subtle)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Settings size={12} />
                    Theme Preference
                  </span>
                </div>
                <ThemeSwitcher variant="inline" />
              </div>

              {/* Sign Out Action */}
              <div className="p-1.5 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut size={15} />
                  Sign Out of Learnova
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
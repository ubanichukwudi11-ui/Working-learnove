"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Search,
  Clock,
  CheckCheck,
  GraduationCap,
} from "lucide-react";
import { formatLagosTime, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import { PWAInstallButton } from "@frontend/components/pwa/PwaSupport";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
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

export default function AppNavbar({ user, onLogout }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<PersistentNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchIndex, setSearchIndex] = useState<SearchCandidate[]>([]);
  const [lagosTime, setLagosTime] = useState(() => formatLagosTime());

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
    try {
      const items: SearchCandidate[] = [];
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
                : "/subjects",
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
      // ignore
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      .slice(0, 6);
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

  const initials = user.fullName
    .split(" ")
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

  return (
    <header className="fixed top-0 right-0 left-0 md:left-20 lg:left-60 h-16 z-40 bg-white/92 backdrop-blur-md border-b border-[#E4E1F5] flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
      {/* Mobile Brand */}
      <div className="flex items-center gap-2 md:hidden shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shadow-sm shadow-[#4F46E5]/25">
          <GraduationCap size={17} />
        </div>
        <span className="landing-display font-extrabold text-[#0B1230] text-base tracking-tight">
          Learnova
        </span>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block min-w-0">
        <div className="flex items-center gap-2.5 bg-[#F5F4FB] border border-[#E4E1F5] focus-within:border-[#7C3AED] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7C3AED]/15 rounded-xl px-3.5 py-2 transition">
          <Search size={16} className="text-[#6B6F94] shrink-0" />
          <input
            value={query}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSearch(true);
            }}
            placeholder="Search subjects or your allocated classrooms..."
            className="bg-transparent outline-none text-sm text-[#0B1230] w-full placeholder:text-[#6B6F94]"
          />
        </div>

        {showSearch && query.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E4E1F5] rounded-2xl shadow-xl shadow-[#0B1230]/10 py-2 z-50">
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <button
                  key={`${res.href}-${i}`}
                  onClick={() => {
                    setShowSearch(false);
                    setQuery("");
                    router.push(res.href);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F5F3FF] flex items-center justify-between gap-2 transition"
                >
                  <span className="text-sm font-medium text-[#0B1230] truncate">
                    {res.label}
                  </span>
                  <span className="text-xs text-[#6D28D9] font-semibold shrink-0">
                    {res.category}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-xs text-[#6B6F94]">
                No matches for &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Info & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 ml-auto shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#43466E] font-medium tabular-nums bg-[#FAF8FF] border border-[#E4E1F5] rounded-lg px-2.5 py-1.5">
          <Clock size={14} className="text-[#0891B2]" />
          <span>{lagosTime}</span>
          <span>·</span>
          <span>{TIMEZONE_LABEL}</span>
        </div>

        <PWAInstallButton />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              fetchNotifications();
            }}
            aria-label="Notifications"
            className="relative p-2 rounded-xl border border-[#E4E1F5] bg-white text-[#43466E] hover:text-[#4F46E5] hover:border-[#C4B5FD] hover:bg-[#FAF8FF] transition"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E4E1F5] rounded-2xl shadow-xl shadow-[#0B1230]/12 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#E4E1F5] bg-[#FAF8FF] flex items-center justify-between">
                <span className="text-sm font-bold text-[#0B1230]">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-[#6D28D9] hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-[#EFEBF9] max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-semibold text-[#0B1230]">
                      No notifications yet
                    </p>
                    <p className="text-[11px] text-[#6B6F94] mt-1">
                      Timetable updates, classroom alerts, and approvals will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <Link
                      key={n.id}
                      href={n.href || "#"}
                      onClick={() => {
                        markOneRead(n.id);
                        setShowNotifications(false);
                      }}
                      className={`block px-4 py-3 hover:bg-[#FAF8FF] transition ${
                        !n.isRead ? "bg-[#F5F3FF]/60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[#0B1230]">{n.title}</p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#43466E] mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[11px] text-[#6B6F94] mt-1 block">
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
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B1230] via-[#151A44] to-[#4F46E5] text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-[#EDE9FE]">
            {initials || "LN"}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-[#0B1230] truncate max-w-[150px]">
              {user.fullName}
            </p>
            <p className="text-[11px] font-semibold text-[#6D28D9]">
              {roleBadgeLabel()}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E1F5] bg-white px-3 py-2 text-xs font-semibold text-[#43466E] hover:bg-[#FAF8FF] hover:text-[#0B1230] hover:border-[#C4B5FD] transition whitespace-nowrap shrink-0"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
import {
  NIGERIAN_NOTIFICATIONS,
  NIGERIAN_SUBJECTS,
  NIGERIAN_ASSIGNMENTS,
  formatLagosTime,
  TIMEZONE_LABEL,
} from "@/lib/nigerianCurriculum";
import { liveClasses } from "@/lib/liveClasses";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
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
  const [notifications, setNotifications] = useState(NIGERIAN_NOTIFICATIONS);
  const [lagosTime, setLagosTime] = useState(() => formatLagosTime());

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

    const items: { label: string; category: string; href: string }[] = [];

    NIGERIAN_SUBJECTS.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
        items.push({
          label: `${s.name} (${s.level})`,
          category: "Subject",
          href: `/subjects/${s.id}`,
        });
      }
    });

    liveClasses.forEach((c) => {
      if (
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q)
      ) {
        items.push({
          label: c.title,
          category: "Live Class",
          href:
            user.role === "TEACHER"
              ? `/teacher/live-class/${c.id}`
              : `/live-classes/${c.id}`,
        });
      }
    });

    NIGERIAN_ASSIGNMENTS.forEach((a) => {
      if (a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)) {
        items.push({
          label: a.title,
          category: "Assignment",
          href: user.role === "TEACHER" ? "/teacher/assignments" : "/assignments",
        });
      }
    });

    return items.slice(0, 6);
  }, [query, user.role]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadgeLabel = () => {
    switch (user.role) {
      case "TEACHER":
        return { label: "Educator", cls: "bg-teal-50 text-[#0D9488] border-teal-200" };
      case "ADMIN":
        return { label: "School Admin", cls: "bg-amber-50 text-[#B45309] border-amber-200" };
      case "PARENT":
        return { label: "Parent", cls: "bg-slate-100 text-[#0B1F3A] border-slate-300" };
      default:
        return { label: "Student", cls: "bg-sky-50 text-[#0B1F3A] border-sky-200" };
    }
  };

  const roleInfo = roleBadgeLabel();

  return (
    <header className="fixed top-0 right-0 left-0 md:left-20 lg:left-60 h-16 z-40 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      {/* Mobile Brand */}
      <div className="flex items-center gap-2 md:hidden shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-[#F59E0B]">
          <GraduationCap size={18} />
        </div>
        <span className="font-extrabold text-[#0B1F3A] text-base">Learnova</span>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="flex items-center gap-2.5 bg-[#F1F4F8] border border-slate-200 focus-within:border-[#0B1F3A] focus-within:bg-white rounded-xl px-3.5 py-2 transition">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSearch(true);
            }}
            placeholder="Search subjects, live classes, assignments..."
            className="bg-transparent outline-none text-sm text-[#0F1F38] w-full placeholder:text-slate-400"
          />
        </div>

        {showSearch && query.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <button
                  key={`${res.href}-${i}`}
                  onClick={() => {
                    setShowSearch(false);
                    setQuery("");
                    router.push(res.href);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition"
                >
                  <span className="text-sm font-medium text-[#0F1F38] truncate">
                    {res.label}
                  </span>
                  <span className="text-xs text-[#0D9488] font-semibold shrink-0">
                    {res.category}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-xs text-slate-500">
                No matches for &ldquo;{query}&rdquo;. Try Mathematics, Physics, or Live Class.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Info & Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium tabular-nums">
          <Clock size={14} className="text-[#0D9488]" />
          <span>{lagosTime}</span>
          <span>·</span>
          <span>{TIMEZONE_LABEL}</span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-50 transition"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-[#0F1F38]">Notifications</span>
                <button
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, unread: false }))
                    )
                  }
                  className="text-xs font-semibold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setShowNotifications(false)}
                    className={`block px-4 py-3 hover:bg-slate-50 transition ${
                      n.unread ? "bg-teal-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0F1F38]">{n.title}</p>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#0D9488] mt-1 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {n.detail}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">{n.time}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-9 h-9 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials || "LN"}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-[#0F1F38] truncate max-w-[150px]">
              {user.fullName}
            </p>
            <p className="text-[11px] font-semibold text-[#0D9488]">
              {roleInfo.label} · Term 2
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition whitespace-nowrap shrink-0"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
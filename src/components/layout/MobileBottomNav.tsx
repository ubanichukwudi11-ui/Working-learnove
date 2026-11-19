"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  CreditCard,
  Sparkles,
  Users,
  CalendarCheck,
  CalendarDays,
  MonitorCheck,
  ShieldCheck,
  ClipboardCheck,
  MoreHorizontal,
  PlaySquare,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function MobileBottomNav({ role = "STUDENT" }: { role?: string }) {
  const pathname = usePathname();
  const { toggleMobile, mobileOpen } = useSidebar();

  const items =
    role === "TEACHER"
      ? [
          { name: "Home", href: "/teacher", icon: LayoutDashboard, exact: true },
          { name: "Classes", href: "/teacher/classes", icon: BookOpen },
          { name: "Videos", href: "/teacher/videos", icon: PlaySquare },
          { name: "Students", href: "/teacher/students", icon: Users },
        ]
      : role === "SUPER_ADMIN"
      ? [
          { name: "Console", href: "/super-admin", icon: ShieldCheck, exact: true },
          { name: "Admin", href: "/admin", icon: LayoutDashboard, exact: true },
          { name: "Teachers", href: "/admin/teachers", icon: Users },
          { name: "Payments", href: "/admin/payments", icon: CreditCard },
        ]
      : role === "ADMIN"
      ? [
          { name: "Home", href: "/admin", icon: LayoutDashboard, exact: true },
          { name: "Rooms", href: "/admin/classrooms", icon: MonitorCheck },
          { name: "Teachers", href: "/admin/teachers", icon: Users },
          { name: "Schedule", href: "/admin/timetable", icon: CalendarCheck },
        ]
      : role === "PARENT"
      ? [
          { name: "Home", href: "/parent", icon: LayoutDashboard, exact: true },
          { name: "Timetable", href: "/timetable", icon: CalendarDays },
          { name: "Live", href: "/live-classes", icon: Video },
          { name: "Billing", href: "/subscriptions", icon: CreditCard },
        ]
      : [
          { name: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true },
          { name: "Learn", href: "/subjects", icon: BookOpen },
          { name: "Practice", href: "/assignments", icon: ClipboardCheck },
          { name: "Nova AI", href: "/nova", icon: Sparkles },
        ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed bottom-0 left-0 right-0 md:hidden min-h-16 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] z-50 flex items-center justify-around px-1.5 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition min-w-[56px] min-h-[44px] ${
              active
                ? "text-[#4F46E5] dark:text-[#A5B4FC] bg-[var(--surface-subtle)]"
                : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon size={18} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={toggleMobile}
        aria-label="More navigation destinations"
        aria-expanded={mobileOpen}
        className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition min-w-[56px] min-h-[44px] ${
          mobileOpen
            ? "text-[#4F46E5] dark:text-[#A5B4FC] bg-[var(--surface-subtle)]"
            : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
        }`}
      >
        <MoreHorizontal size={18} />
        <span>More</span>
      </button>
    </nav>
  );
}
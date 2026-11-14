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
  MonitorCheck,
  FileBadge2,
  ShieldCheck,
} from "lucide-react";

export default function MobileBottomNav({ role = "STUDENT" }: { role?: string }) {
  const pathname = usePathname();

  const items =
    role === "TEACHER"
      ? [
          { name: "Desk", href: "/teacher", icon: LayoutDashboard },
          { name: "Apply", href: "/teacher/applications", icon: FileBadge2 },
          { name: "Classes", href: "/teacher/classes", icon: BookOpen },
          { name: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
          { name: "Students", href: "/teacher/students", icon: Users },
        ]
      : role === "SUPER_ADMIN"
      ? [
          { name: "Console", href: "/super-admin", icon: ShieldCheck },
          { name: "Admin", href: "/admin", icon: LayoutDashboard },
          { name: "Teachers", href: "/admin/teachers", icon: Users },
          { name: "Payments", href: "/admin/payments", icon: CreditCard },
          { name: "Rooms", href: "/admin/classrooms", icon: MonitorCheck },
        ]
      : role === "ADMIN"
      ? [
          { name: "Admin", href: "/admin", icon: LayoutDashboard },
          { name: "Teachers", href: "/admin/teachers", icon: Users },
          { name: "Payments", href: "/admin/payments", icon: CreditCard },
          { name: "Rooms", href: "/admin/classrooms", icon: MonitorCheck },
          { name: "Schedule", href: "/admin/timetable", icon: CalendarCheck },
        ]
      : [
          { name: "Home", href: "/dashboard", icon: LayoutDashboard },
          { name: "Plans", href: "/subscriptions", icon: CreditCard },
          { name: "Live", href: "/live-classes", icon: Video },
          { name: "Subjects", href: "/subjects", icon: BookOpen },
          { name: "Nova AI", href: "/nova", icon: Sparkles },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden h-16 bg-white/95 backdrop-blur border-t border-slate-200 z-50 flex items-center justify-around px-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/teacher" &&
            item.href !== "/admin" &&
            item.href !== "/super-admin" &&
            pathname.startsWith(item.href + "/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition ${
              active ? "text-[#0D9488]" : "text-slate-500 hover:text-[#0B1F3A]"
            }`}
          >
            <Icon size={19} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
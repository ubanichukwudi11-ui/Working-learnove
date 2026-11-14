"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpenCheck,
  GraduationCap,
  Users,
  CreditCard,
  CalendarDays,
  MonitorCheck,
  LogOut,
} from "lucide-react";

const links = [
  { name: "Platform Console", href: "/super-admin", icon: ShieldCheck, exact: true },
  { name: "School Admin", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Academics", href: "/admin/academics", icon: BookOpenCheck },
  { name: "Teacher Approvals", href: "/admin/teachers", icon: GraduationCap },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Payments & Access", href: "/admin/payments", icon: CreditCard },
  { name: "Timetable", href: "/admin/timetable", icon: CalendarDays },
  { name: "Classroom Control", href: "/admin/classrooms", icon: MonitorCheck },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen md:w-20 lg:w-60 z-50 bg-[#0B1F3A] text-white flex-col border-r border-white/10">
      <Link
        href="/super-admin"
        className="h-16 flex items-center justify-center lg:justify-start gap-3 px-4 border-b border-white/10 shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#F59E0B] shrink-0">
          <ShieldCheck size={19} />
        </div>
        <div className="hidden lg:block leading-tight">
          <span className="font-extrabold text-base tracking-tight text-white">
            Learnova
          </span>
          <span className="block text-[11px] text-amber-300 font-medium">
            Super Admin
          </span>
        </div>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto sidebar-scroll">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-[#0D9488] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} className="shrink-0" />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 shrink-0">
        <button
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-300 transition"
        >
          <LogOut size={19} className="shrink-0" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

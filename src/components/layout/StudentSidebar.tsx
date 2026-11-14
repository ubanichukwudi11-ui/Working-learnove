"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  CalendarDays,
  Video,
  ClipboardList,
  NotebookPen,
  Sparkles,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Timetable", href: "/timetable", icon: CalendarDays },
  { name: "Live Classes", href: "/live-classes", icon: Video },
  { name: "Assignments", href: "/assignments", icon: ClipboardList },
  { name: "Notebook", href: "/notebook", icon: NotebookPen },
  { name: "Nova AI", href: "/nova", icon: Sparkles },
  { name: "Profile", href: "/profile", icon: User },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen md:w-20 lg:w-60 z-50 bg-[#0B1F3A] text-white flex-col border-r border-white/10">
      <Link
        href="/dashboard"
        className="h-16 flex items-center justify-center lg:justify-start gap-3 px-4 border-b border-white/10 shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#F59E0B] shrink-0">
          <GraduationCap size={20} />
        </div>
        <div className="hidden lg:block leading-tight">
          <span className="font-extrabold text-base tracking-tight text-white">
            Learnova
          </span>
          <span className="block text-[11px] text-teal-300 font-medium">
            Student Portal
          </span>
        </div>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto sidebar-scroll">
        {links.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

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
          onClick={handleLogout}
          title="Sign Out"
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-300 transition"
        >
          <LogOut size={19} className="shrink-0" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
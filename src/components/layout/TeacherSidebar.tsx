"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileBadge2,
  BookOpen,
  CalendarCheck,
  FileText,
  ClipboardList,
  Users,
  User,
  LogOut,
  GraduationCap,
  PlaySquare,
} from "lucide-react";

const links = [
  { name: "Teacher Desk", href: "/teacher", icon: LayoutDashboard, exact: true },
  { name: "My Applications", href: "/teacher/applications", icon: FileBadge2 },
  { name: "Classes & Timetable", href: "/teacher/classes", icon: BookOpen },
  { name: "Video Lessons", href: "/teacher/videos", icon: PlaySquare },
  { name: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
  { name: "Lesson Notes", href: "/teacher/notes", icon: FileText },
  { name: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
  { name: "Students", href: "/teacher/students", icon: Users },
  { name: "Profile", href: "/teacher/profile", icon: User },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen md:w-20 lg:w-60 z-50 bg-[#070D24] text-white flex-col border-r border-white/10">
      <Link
        href="/teacher"
        className="h-16 flex items-center justify-center lg:justify-start gap-3 px-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#4F46E5]/10 to-transparent"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/20 flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/25 shrink-0">
          <GraduationCap size={20} />
        </div>
        <div className="hidden lg:block leading-tight">
          <span className="landing-display font-extrabold text-base tracking-tight text-white">
            Learnova
          </span>
          <span className="block text-[11px] text-[#22D3EE] font-semibold">
            Educator Workspace
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
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/25"
                  : "text-indigo-100/75 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={19} className={`shrink-0 ${active ? "text-white" : "text-indigo-200/75"}`} />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 shrink-0">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-100/75 hover:bg-red-500/15 hover:text-red-300 transition"
        >
          <LogOut size={19} className="shrink-0" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
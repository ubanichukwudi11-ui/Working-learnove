"use client";

import {
  LayoutDashboard,
  BookOpenCheck,
  GraduationCap,
  Users,
  CreditCard,
  CalendarDays,
  MonitorCheck,
  Shield,
  Sparkles,
  PlaySquare,
  Bell,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Academic Control",
    items: [
      { name: "Academics", href: "/admin/academics", icon: BookOpenCheck },
      { name: "Timetable", href: "/admin/timetable", icon: CalendarDays },
      { name: "Classroom Control", href: "/admin/classrooms", icon: MonitorCheck },
      { name: "Video Lessons", href: "/admin/videos", icon: PlaySquare },
    ],
  },
  {
    label: "Admissions & Finance",
    items: [
      { name: "Teacher Approvals", href: "/admin/teachers", icon: GraduationCap },
      { name: "Students", href: "/admin/students", icon: Users },
      { name: "Payments & Access", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Assistant",
    items: [
      { name: "Admin AI Copilot", href: "/admin/ai-assistant", icon: Sparkles },
    ],
  },
];

export default function AdminSidebar() {
  return (
    <AppSidebarShell
      brandHref="/admin"
      workspaceLabel="School Admin"
      brandIcon={Shield}
      accentTextColor="text-[#C4B5FD]"
      settingsHref="/settings"
      groups={groups}
    />
  );
}
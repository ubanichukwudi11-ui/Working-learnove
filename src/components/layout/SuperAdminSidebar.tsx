"use client";

import {
  ShieldCheck,
  LayoutDashboard,
  BookOpenCheck,
  GraduationCap,
  Users,
  CreditCard,
  CalendarDays,
  MonitorCheck,
  Sparkles,
  PlaySquare,
  Bell,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Governance",
    items: [
      { name: "Platform Console", href: "/super-admin", icon: ShieldCheck, exact: true },
      { name: "School Admin", href: "/admin", icon: LayoutDashboard, exact: true },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "School Operations",
    items: [
      { name: "Academics", href: "/admin/academics", icon: BookOpenCheck },
      { name: "Timetable", href: "/admin/timetable", icon: CalendarDays },
      { name: "Classroom Control", href: "/admin/classrooms", icon: MonitorCheck },
      { name: "Video Lessons", href: "/admin/videos", icon: PlaySquare },
    ],
  },
  {
    label: "People & Finance",
    items: [
      { name: "Teacher Approvals", href: "/admin/teachers", icon: GraduationCap },
      { name: "Students", href: "/admin/students", icon: Users },
      { name: "Payments & Access", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Admin AI Copilot", href: "/admin/ai-assistant", icon: Sparkles },
    ],
  },
];

export default function SuperAdminSidebar() {
  return (
    <AppSidebarShell
      brandHref="/super-admin"
      workspaceLabel="Super Admin"
      brandIcon={ShieldCheck}
      accentTextColor="text-[#C4B5FD]"
      settingsHref="/settings"
      groups={groups}
    />
  );
}

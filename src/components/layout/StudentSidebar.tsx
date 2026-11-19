"use client";

import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  CalendarDays,
  Video,
  PlaySquare,
  ClipboardList,
  NotebookPen,
  Sparkles,
  Award,
  Bell,
  GraduationCap,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Home & Schedule",
    items: [
      { name: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Live Classrooms", href: "/live-classes", icon: Video },
      { name: "Timetable", href: "/timetable", icon: CalendarDays },
    ],
  },
  {
    label: "My Learning",
    items: [
      { name: "Subjects", href: "/subjects", icon: BookOpen },
      { name: "Video Lessons", href: "/videos", icon: PlaySquare },
      { name: "Practice & Exams", href: "/assignments", icon: ClipboardList },
      { name: "Notebook", href: "/notebook", icon: NotebookPen },
    ],
  },
  {
    label: "Tutor & Progress",
    items: [
      { name: "Nova AI", href: "/nova", icon: Sparkles },
      { name: "Achievements", href: "/analytics", icon: Award },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
    ],
  },
];

export default function StudentSidebar() {
  return (
    <AppSidebarShell
      brandHref="/dashboard"
      workspaceLabel="Student Portal"
      brandIcon={GraduationCap}
      accentTextColor="text-[#22D3EE]"
      settingsHref="/settings"
      groups={groups}
    />
  );
}
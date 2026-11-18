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
  User,
  GraduationCap,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Timetable", href: "/timetable", icon: CalendarDays },
      { name: "Live Classes", href: "/live-classes", icon: Video },
    ],
  },
  {
    label: "Learning",
    items: [
      { name: "Subjects", href: "/subjects", icon: BookOpen },
      { name: "Video Lessons", href: "/videos", icon: PlaySquare },
      { name: "Assignments", href: "/assignments", icon: ClipboardList },
      { name: "Notebook", href: "/notebook", icon: NotebookPen },
    ],
  },
  {
    label: "Study & Account",
    items: [
      { name: "Nova AI", href: "/nova", icon: Sparkles },
      { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
      { name: "Profile", href: "/profile", icon: User },
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
      groups={groups}
    />
  );
}
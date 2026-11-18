"use client";

import {
  LayoutDashboard,
  FileBadge2,
  BookOpen,
  CalendarCheck,
  FileText,
  ClipboardList,
  Users,
  User,
  GraduationCap,
  PlaySquare,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { name: "Teacher Desk", href: "/teacher", icon: LayoutDashboard, exact: true },
      { name: "My Applications", href: "/teacher/applications", icon: FileBadge2 },
    ],
  },
  {
    label: "Teaching",
    items: [
      { name: "Classes & Timetable", href: "/teacher/classes", icon: BookOpen },
      { name: "Video Lessons", href: "/teacher/videos", icon: PlaySquare },
      { name: "Lesson Notes", href: "/teacher/notes", icon: FileText },
      { name: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    ],
  },
  {
    label: "Students & Profile",
    items: [
      { name: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
      { name: "Students", href: "/teacher/students", icon: Users },
      { name: "Profile", href: "/teacher/profile", icon: User },
    ],
  },
];

export default function TeacherSidebar() {
  return (
    <AppSidebarShell
      brandHref="/teacher"
      workspaceLabel="Educator Workspace"
      brandIcon={GraduationCap}
      accentTextColor="text-[#22D3EE]"
      groups={groups}
    />
  );
}
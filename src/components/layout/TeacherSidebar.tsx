"use client";

import {
  LayoutDashboard,
  FileBadge2,
  BookOpen,
  CalendarCheck,
  FileText,
  ClipboardList,
  Users,
  Video,
  Bell,
  GraduationCap,
  PlaySquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const approvedGroups: SidebarNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { name: "Educator Home", href: "/teacher", icon: LayoutDashboard, exact: true },
      { name: "Live Classrooms", href: "/live-classes", icon: Video },
      { name: "My Applications", href: "/teacher/applications", icon: FileBadge2 },
    ],
  },
  {
    label: "Teaching Studio",
    items: [
      { name: "Classes & Timetable", href: "/teacher/classes", icon: BookOpen },
      { name: "Video Lessons", href: "/teacher/videos", icon: PlaySquare },
      { name: "Lesson Studio", href: "/teacher/notes", icon: FileText },
      { name: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    ],
  },
  {
    label: "Students & Alerts",
    items: [
      { name: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
      { name: "Students", href: "/teacher/students", icon: Users },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

const pendingGroups: SidebarNavGroup[] = [
  {
    label: "Verification",
    items: [
      { name: "My Applications", href: "/teacher/applications", icon: FileBadge2 },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

export default function TeacherSidebar({ status }: { status?: string }) {
  const { user } = useAuth();
  const effectiveStatus = status ?? user?.status;
  const isApproved = effectiveStatus === "ACTIVE";

  return (
    <AppSidebarShell
      brandHref={isApproved ? "/teacher" : "/teacher/applications"}
      workspaceLabel={isApproved ? "Educator Workspace" : "Verification Portal"}
      brandIcon={GraduationCap}
      accentTextColor="text-[#22D3EE]"
      settingsHref="/settings"
      groups={isApproved ? approvedGroups : pendingGroups}
    />
  );
}
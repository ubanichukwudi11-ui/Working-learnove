"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Video,
  User,
  HeartHandshake,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Family Portal",
    items: [
      { name: "Overview", href: "/parent", icon: LayoutDashboard, exact: true },
      { name: "Timetable", href: "/timetable", icon: CalendarDays },
      { name: "Live Classes", href: "/live-classes", icon: Video },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile", href: "/profile", icon: User },
    ],
  },
];

export default function ParentSidebar() {
  return (
    <AppSidebarShell
      brandHref="/parent"
      workspaceLabel="Parent Portal"
      brandIcon={HeartHandshake}
      accentTextColor="text-[#22D3EE]"
      groups={groups}
    />
  );
}
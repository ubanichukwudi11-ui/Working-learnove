"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Video,
  CreditCard,
  Bell,
  HeartHandshake,
} from "lucide-react";
import AppSidebarShell, { type SidebarNavGroup } from "./AppSidebarShell";

const groups: SidebarNavGroup[] = [
  {
    label: "Family Portal",
    items: [
      { name: "Family Overview", href: "/parent", icon: LayoutDashboard, exact: true },
      { name: "Ward Timetable", href: "/timetable", icon: CalendarDays },
      { name: "Live Classrooms", href: "/live-classes", icon: Video },
    ],
  },
  {
    label: "Updates & Billing",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Plans & Payments", href: "/subscriptions", icon: CreditCard },
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
      settingsHref="/settings"
      groups={groups}
    />
  );
}
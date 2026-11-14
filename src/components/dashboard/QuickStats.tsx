"use client";

import Link from "next/link";
import { BookOpen, ClipboardList, CalendarCheck, Award } from "lucide-react";

const stats = [
  {
    title: "Enrolled Subjects",
    value: "6",
    sub: "NERDC SSS 2 Core",
    href: "/subjects",
    icon: BookOpen,
    accent: "text-[#0B1F3A] bg-slate-100",
  },
  {
    title: "Assignments Due",
    value: "2",
    sub: "Next due tomorrow 6 PM",
    href: "/assignments",
    icon: ClipboardList,
    accent: "text-[#D97706] bg-amber-50",
  },
  {
    title: "Term Attendance",
    value: "96%",
    sub: "23 of 24 live classes",
    href: "/timetable",
    icon: CalendarCheck,
    accent: "text-[#0D9488] bg-teal-50",
  },
  {
    title: "Continuous Assessment",
    value: "81%",
    sub: "+4% vs First Term",
    href: "/analytics",
    icon: Award,
    accent: "text-emerald-700 bg-emerald-50",
  },
];

export default function QuickStats() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.title}
            href={stat.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition block"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">{stat.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.accent}`}>
                <Icon size={17} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-3 tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </Link>
        );
      })}
    </div>
  );
}
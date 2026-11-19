"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type StatTone =
  | "learning"
  | "assignments"
  | "exams"
  | "timetable"
  | "attendance"
  | "payments"
  | "ai";

const toneStyles: Record<
  StatTone,
  { iconBg: string; iconColor: string; valueHint: string }
> = {
  learning: {
    iconBg: "bg-indigo-500/12 dark:bg-indigo-400/15",
    iconColor: "text-indigo-600 dark:text-indigo-300",
    valueHint: "text-indigo-600 dark:text-indigo-300",
  },
  assignments: {
    iconBg: "bg-violet-500/12 dark:bg-violet-400/15",
    iconColor: "text-violet-600 dark:text-violet-300",
    valueHint: "text-violet-600 dark:text-violet-300",
  },
  exams: {
    iconBg: "bg-amber-500/12 dark:bg-amber-400/15",
    iconColor: "text-amber-600 dark:text-amber-300",
    valueHint: "text-amber-600 dark:text-amber-300",
  },
  timetable: {
    iconBg: "bg-cyan-500/12 dark:bg-cyan-400/15",
    iconColor: "text-cyan-600 dark:text-cyan-300",
    valueHint: "text-cyan-600 dark:text-cyan-300",
  },
  attendance: {
    iconBg: "bg-emerald-500/12 dark:bg-emerald-400/15",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    valueHint: "text-emerald-600 dark:text-emerald-300",
  },
  payments: {
    iconBg: "bg-teal-500/12 dark:bg-teal-400/15",
    iconColor: "text-teal-600 dark:text-teal-300",
    valueHint: "text-teal-600 dark:text-teal-300",
  },
  ai: {
    iconBg: "bg-fuchsia-500/12 dark:bg-fuchsia-400/15",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-300",
    valueHint: "text-fuchsia-600 dark:text-fuchsia-300",
  },
};

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  subtext?: string;
  icon: LucideIcon;
  tone?: StatTone;
  accent?: StatTone;
  href?: string;
};

export default function StatCard({
  label,
  value,
  sublabel,
  subtext,
  icon: Icon,
  tone,
  accent,
  href,
}: StatCardProps) {
  const resolvedTone = tone ?? accent ?? "learning";
  const resolvedSublabel = sublabel ?? subtext;
  const styles = toneStyles[resolvedTone] ?? toneStyles.learning;

  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)] truncate">
          {label}
        </p>
        <p className="landing-display text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-2 tabular-nums truncate">
          {value}
        </p>
        {resolvedSublabel && (
          <p className={`text-xs font-medium mt-1 truncate ${styles.valueHint}`}>
            {resolvedSublabel}
          </p>
        )}
      </div>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.iconColor}`}
      >
        <Icon size={18} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="learnova-card p-5 hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all block min-w-0"
      >
        {inner}
      </Link>
    );
  }

  return <div className="learnova-card p-5 min-w-0">{inner}</div>;
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateActionObject = {
  label: string;
  href?: string;
  onClick?: () => void;
};

function isActionObject(
  action: ReactNode | EmptyStateActionObject | undefined
): action is EmptyStateActionObject {
  return (
    typeof action === "object" &&
    action !== null &&
    "label" in action &&
    typeof (action as EmptyStateActionObject).label === "string"
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode | EmptyStateActionObject;
  secondaryAction?: ReactNode | EmptyStateActionObject;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const renderActionItem = (
    item: ReactNode | EmptyStateActionObject | undefined,
    variant: "primary" | "secondary" = "primary"
  ) => {
    if (!item) return null;
    if (isActionObject(item)) {
      const cls =
        variant === "primary"
          ? "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
          : "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-lavender)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] transition";
      if (item.href) {
        return (
          <Link href={item.href} className={cls}>
            {item.label}
          </Link>
        );
      }
      return (
        <button type="button" onClick={item.onClick} className={cls}>
          {item.label}
        </button>
      );
    }
    return item;
  };

  const resolvedPrimaryAction =
    action ?? (actionLabel ? { label: actionLabel, href: actionHref, onClick: onAction } : undefined);

  return (
    <div
      className={`rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-lavender)] text-center ${
        compact ? "p-6" : "p-10 sm:p-12"
      }`}
    >
      <div className="w-11 h-11 rounded-2xl bg-[var(--surface-subtle)] text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center mx-auto mb-3">
        <Icon size={20} />
      </div>
      <h3 className="landing-display text-base font-bold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--foreground-subtle)] mt-1 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(resolvedPrimaryAction || secondaryAction) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {renderActionItem(resolvedPrimaryAction, "primary")}
          {renderActionItem(secondaryAction, "secondary")}
        </div>
      )}
    </div>
  );
}

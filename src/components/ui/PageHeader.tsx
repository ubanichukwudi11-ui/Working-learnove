"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  kicker?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  variant?: "banner" | "surface";
};

export default function PageHeader({
  kicker,
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  variant = "banner",
}: PageHeaderProps) {
  const resolvedKicker = kicker ?? eyebrow;
  if (variant === "surface") {
    return (
      <section className="learnova-card p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--foreground-subtle)] mb-2">
              {breadcrumbs.map((bc, idx) => (
                <span key={`${bc.label}-${idx}`} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight size={12} />}
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-[var(--foreground)] font-medium transition">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[var(--foreground)]">{bc.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {resolvedKicker && (
            <p className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#A5B4FC]">
              {resolvedKicker}
            </p>
          )}
          <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-1 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--foreground-muted)] mt-1.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </section>
    );
  }

  return (
    <section className="learnova-banner-dark learnova-ambient-stage-soft bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-indigo-200/75 mb-2">
            {breadcrumbs.map((bc, idx) => (
              <span key={`${bc.label}-${idx}`} className="inline-flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={12} />}
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-white transition">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-white font-semibold">{bc.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {resolvedKicker && (
          <p className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
            {resolvedKicker}
          </p>
        )}
        <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-indigo-100/80 mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </section>
  );
}

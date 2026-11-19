"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "amber";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  href?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white shadow-sm shadow-[#4F46E5]/20",
  secondary:
    "bg-[#0B1230] hover:bg-[#151A44] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-white shadow-sm",
  amber:
    "bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm",
  outline:
    "border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-lavender)] text-[var(--foreground)]",
  ghost:
    "hover:bg-[var(--surface-subtle)] text-[var(--foreground-muted)] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC]",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs min-h-[36px]",
  md: "px-5 py-2.5 text-sm min-h-[40px]",
  lg: "px-6 py-3 text-sm min-h-[44px]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  disabled,
  href,
  type = "button",
  ...props
}: ButtonProps) {
  const commonClasses = clsx(
    "rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    "focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/35",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={commonClasses}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
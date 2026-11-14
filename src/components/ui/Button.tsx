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
    "bg-[#0B1F3A] hover:bg-[#143258] text-white shadow-sm",
  secondary:
    "bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-sm",
  amber:
    "bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm",
  outline:
    "border border-slate-300 bg-white hover:bg-slate-50 text-[#0F1F38]",
  ghost:
    "hover:bg-slate-100 text-slate-700",
  danger:
    "bg-red-600 hover:bg-red-700 text-white",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm",
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
    "rounded-xl font-semibold transition-colors duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40",
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
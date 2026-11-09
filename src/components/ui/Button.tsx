"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

type Size =
  | "sm"
  | "md"
  | "lg";

import Link from "next/link";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  href?: string;
}

const variantClasses = {
  primary:
    "bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white",

  secondary:
    "bg-slate-700 hover:bg-slate-600 text-white",

  outline:
    "border border-slate-600 hover:border-violet-500 hover:text-violet-400 text-slate-200",

  ghost:
    "hover:bg-slate-800 text-slate-300",

  danger:
    "bg-red-600 hover:bg-red-700 text-white",

  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm",

  md: "px-5 py-3 text-sm",

  lg: "px-7 py-4 text-base",
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
    "rounded-xl font-semibold transition-all duration-300 inline-flex items-center justify-center",
    "focus:outline-none focus:ring-2 focus:ring-violet-500",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95",
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
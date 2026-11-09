"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className,
  hover = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl",
        "border border-slate-800",
        "bg-[#111827]",
        "shadow-lg",
        "transition-all duration-300",
        hover &&
          "hover:border-violet-500 hover:-translate-y-1 hover:shadow-violet-500/20",
        className
      )}
    >
      {children}
    </div>
  );
}
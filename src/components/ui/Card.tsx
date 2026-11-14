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
        "rounded-2xl border border-slate-200 bg-white text-[#0F1F38] shadow-xs transition-all duration-200",
        hover && "hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
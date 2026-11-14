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
        "rounded-2xl border border-[#E4E1F5] bg-white text-[#0B1230] shadow-xs transition-all duration-200",
        hover && "hover:border-[#C4B5FD] hover:shadow-md hover:shadow-[#4F46E5]/5 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
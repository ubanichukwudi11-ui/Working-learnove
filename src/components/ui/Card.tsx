"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  className,
  hover = false,
  glow = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        glow
          ? "learnova-card-glow rounded-2xl text-[#0B1230]"
          : "rounded-2xl border border-[#E4E1F5] bg-white text-[#0B1230] shadow-xs transition-all duration-200",
        hover && !glow && "hover:border-[#C4B5FD] hover:shadow-md hover:shadow-[#4F46E5]/5 hover:-translate-y-0.5",
        hover && glow && "hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
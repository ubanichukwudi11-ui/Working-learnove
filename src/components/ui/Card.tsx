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
        glow ? "learnova-card-glow" : "learnova-card",
        hover && !glow && "hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-0.5",
        hover && glow && "hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
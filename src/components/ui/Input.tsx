"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  tone?: "surface" | "dark";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, tone = "surface", className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className={clsx(
              "mb-1.5 block text-xs font-semibold",
              tone === "dark" ? "text-indigo-100" : "text-[var(--foreground-muted)]"
            )}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={clsx(
            "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200",
            tone === "dark"
              ? "border border-white/15 bg-[#0B1230] text-white placeholder:text-indigo-200/50 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
              : "learnova-input",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/25",
            className
          )}
          {...props}
        />

        {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
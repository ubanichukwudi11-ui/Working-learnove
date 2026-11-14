"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={clsx(
            "w-full rounded-xl",
            "border border-slate-700",
            "bg-[#111827]",
            "px-4 py-3",
            "text-white",
            "placeholder:text-slate-500",
            "outline-none",
            "transition-all duration-300",
            "focus:border-violet-500",
            "focus:ring-2 focus:ring-violet-500/30",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            className
          )}
          {...props}
        />

        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Check } from "lucide-react";

type ThemeOption = "light" | "dark" | "system";

const OPTIONS: Array<{
  value: ThemeOption;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "segmented" | "inline";
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeTheme: ThemeOption =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system";

  if (variant === "segmented") {
    return (
      <div
        role="radiogroup"
        aria-label="Color theme"
        className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border)]"
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = activeTheme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              <Icon size={14} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        role="radiogroup"
        aria-label="Theme mode"
        className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border)]"
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = activeTheme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] font-semibold transition ${
                active
                  ? "bg-[var(--surface)] text-[#4F46E5] dark:text-[#A5B4FC] shadow-xs border border-[var(--border)]"
                  : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={12} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const CurrentIcon =
    !mounted || activeTheme === "system"
      ? Monitor
      : resolvedTheme === "dark"
      ? Moon
      : Sun;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Switch appearance theme"
        aria-expanded={open}
        title="Appearance theme"
        className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] hover:border-[var(--border-strong)] hover:bg-[var(--surface-lavender)] transition"
      >
        <CurrentIcon size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-1.5 z-50"
        >
          <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Appearance
          </p>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = activeTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-[var(--surface-subtle)] text-[#4F46E5] dark:text-[#A5B4FC]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={14} />
                  {opt.label}
                </span>
                {active && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

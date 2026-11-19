"use client";


import {
Search,
SlidersHorizontal,
} from "lucide-react";



export default function SubjectsHeader() {
  return (
    <section className="mb-8">
      <div>
        <h1 className="landing-display text-3xl font-extrabold text-[var(--foreground)]">
          My Subjects
        </h1>
        <p className="text-[var(--foreground-muted)] mt-1.5 text-sm">
          Continue your learning journey with Nova.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-strong)] focus-within:border-[#7C3AED] rounded-xl px-4 py-2.5 flex-1 transition">
          <Search size={18} className="text-[var(--foreground-subtle)] shrink-0" />
          <input
            placeholder="Search subjects..."
            className="bg-transparent outline-none w-full text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
          />
        </div>

        <button className="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--foreground-muted)] flex items-center justify-center hover:bg-[var(--surface-lavender)] hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0">
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </section>
  );
}
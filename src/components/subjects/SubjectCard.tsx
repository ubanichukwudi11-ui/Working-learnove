"use client";

import Link from "next/link";

import {
Calculator,
Atom,
Languages,
FlaskConical,
Leaf,
Landmark
} from "lucide-react";


type Props = {
subject:any;
};


export default function SubjectCard({ subject }: Props) {
  const icons: any = {
    calculator: Calculator,
    atom: Atom,
    languages: Languages,
    flask: FlaskConical,
    leaf: Leaf,
    landmark: Landmark,
  };

  const Icon = icons[subject.icon] || Calculator;

  return (
    <div className="group learnova-card p-5 hover:border-violet-500/50 transition flex flex-col justify-between min-w-0">
      <div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center">
          <Icon size={22} />
        </div>

        <h3 className="mt-4 font-bold text-lg text-[var(--foreground)]">
          {subject.name}
        </h3>

        <p className="text-sm text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
          {subject.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] mt-3 tabular-nums">
          <span>{subject.lessons} Lessons</span>
          <span aria-hidden="true">·</span>
          <span>{subject.topics} Topics</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
          <span>Progress</span>
          <span className="font-bold text-[var(--foreground)] tabular-nums">{subject.progress}%</span>
        </div>

        <div className="h-2 bg-violet-100 dark:bg-violet-950/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-all duration-700"
            style={{ width: `${subject.progress}%` }}
          />
        </div>

        <Link
          href={`/subjects/${subject.id}`}
          className="mt-5 block text-center rounded-xl py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-xs"
        >
          {subject.progress === 0 ? "Start Learning" : "Continue"}
        </Link>
      </div>
    </div>
  );
}
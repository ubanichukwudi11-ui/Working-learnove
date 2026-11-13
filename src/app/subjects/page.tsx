"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { NIGERIAN_SUBJECTS, CURRENT_ACADEMIC_TERM } from "@/lib/nigerianCurriculum";
import { BookOpen, Search, ArrowRight, User } from "lucide-react";

export default function SubjectsPage() {
  const [query, setQuery] = useState("");

  const filtered = NIGERIAN_SUBJECTS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.examTrack.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Subjects &amp; Curriculum Modules
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Explore structured NERDC lessons, topic notes, and WAEC/JAMB revision tracks.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 w-full md:w-72">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter subjects..."
              className="bg-transparent outline-none text-sm text-[#0F1F38] w-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((subject) => (
            <div
              key={subject.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs hover:border-[#0D9488] transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#0D9488]">{subject.code} · {subject.level}</span>
                  <span className="text-[#D97706]">{subject.examTrack}</span>
                </div>

                <h2 className="mt-3 text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                  <BookOpen size={18} className="text-[#0B1F3A]" />
                  {subject.name}
                </h2>

                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {subject.description}
                </p>

                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                  <User size={13} />
                  {subject.teacher}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">
                      {subject.completedLessons} / {subject.lessons} lessons
                    </span>
                    <span className="font-bold text-[#0B1F3A] tabular-nums">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D9488] rounded-full"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/subjects/${subject.id}`}
                  className="w-full py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                >
                  Open Curriculum
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
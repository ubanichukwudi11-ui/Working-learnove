"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { NIGERIAN_SUBJECTS } from "@/lib/nigerianCurriculum";

export default function SubjectGrid() {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Your Term Subjects</h2>
          <p className="text-xs text-slate-500">
            NERDC &amp; WAEC syllabus modules for SSS 2 Science
          </p>
        </div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D9488] hover:underline"
        >
          View all subjects
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NIGERIAN_SUBJECTS.map((subject) => (
          <Link
            key={subject.id}
            href={`/subjects/${subject.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0D9488] hover:shadow-sm transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#0D9488]">{subject.code}</span>
                <span className="text-slate-500 font-medium">{subject.examTrack}</span>
              </div>

              <h3 className="mt-2.5 text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <BookOpen size={16} className="text-slate-400 shrink-0" />
                <span>{subject.name}</span>
              </h3>

              <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                Next: {subject.nextTopic}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">{subject.teacher}</span>
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
          </Link>
        ))}
      </div>
    </section>
  );
}
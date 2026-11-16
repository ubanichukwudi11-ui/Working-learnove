"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { NIGERIAN_SUBJECTS } from "@/lib/nigerianCurriculum";

export default function SubjectGrid() {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1230]">Your Term Subjects</h2>
          <p className="text-xs text-[#6B6F94]">
            NERDC &amp; WAEC syllabus modules for SSS 2 Science
          </p>
        </div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:text-[#6D28D9] hover:underline whitespace-nowrap"
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
            className="learnova-card p-5 hover:border-[#7C3AED]/45 transition flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#4F46E5]">{subject.code}</span>
                <span className="text-[#6B6F94] font-medium">{subject.examTrack}</span>
              </div>

              <h3 className="mt-2.5 text-base font-bold text-[#0B1230] flex items-center gap-2">
                <BookOpen size={16} className="text-[#6D28D9] shrink-0" />
                <span className="truncate">{subject.name}</span>
              </h3>

              <p className="mt-1 text-xs text-[#6B6F94] line-clamp-1">
                Next: {subject.nextTopic}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E4E1F5]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#6B6F94] truncate">{subject.teacher}</span>
                <span className="font-bold text-[#0B1230] tabular-nums shrink-0">
                  {subject.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full"
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
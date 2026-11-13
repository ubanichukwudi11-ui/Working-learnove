"use client";

import { use, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { NIGERIAN_SUBJECTS } from "@/lib/nigerianCurriculum";
import { lessonData } from "@/lib/lessonData";
import { ArrowLeft, BookOpen, Clock, Sparkles, Video } from "lucide-react";

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const subject =
    NIGERIAN_SUBJECTS.find((s) => s.id === id) || NIGERIAN_SUBJECTS[0];

  const subjectModules =
    (lessonData as Record<string, Record<string, readonly any[]>>)[subject.id] ||
    lessonData.mathematics;
  const topicKeys = Object.keys(subjectModules);
  const [selectedTopic, setSelectedTopic] = useState(topicKeys[0] || "algebra");
  const lessons = subjectModules[selectedTopic] || [];
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const activeLesson = lessons[activeLessonIndex] || lessons[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/subjects"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-[#0B1F3A]"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-xs font-bold text-[#0D9488]">
                {subject.code} · {subject.level} · {subject.examTrack}
              </p>
              <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
                {subject.name}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/live-classes/math-001"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition"
            >
              <Video size={14} />
              Join Live Class
            </Link>
            <Link
              href="/nova"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-[#0B1F3A] text-xs font-bold transition"
            >
              <Sparkles size={14} className="text-[#D97706]" />
              Ask Nova AI
            </Link>
          </div>
        </div>

        {/* Topic Tabs */}
        <div className="flex flex-wrap gap-2">
          {topicKeys.map((key) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTopic(key);
                setActiveLessonIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                selectedTopic === key
                  ? "bg-[#0B1F3A] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Lesson List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 pb-1">
              Lessons ({lessons.length})
            </h2>
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.slug}
                onClick={() => setActiveLessonIndex(idx)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  idx === activeLessonIndex
                    ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                    : "bg-[#F7F8FA] text-[#0F1F38] border-slate-200 hover:bg-white"
                }`}
              >
                <p className="text-xs font-bold">{lesson.title}</p>
                <p
                  className={`text-[11px] mt-1 flex items-center gap-1 ${
                    idx === activeLessonIndex ? "text-teal-300" : "text-slate-500"
                  }`}
                >
                  <Clock size={11} />
                  {lesson.duration}
                </p>
              </button>
            ))}
          </div>

          {/* Active Lesson Detail */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
            {activeLesson ? (
              <>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-[#0D9488] uppercase">
                      {selectedTopic} Module
                    </span>
                    <h2 className="text-xl font-bold text-[#0B1F3A] mt-0.5">
                      {activeLesson.title}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Instructor: {subject.teacher}
                  </span>
                </div>

                <div className="rounded-xl bg-[#FAF8F3] border border-slate-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5 mb-2">
                    <BookOpen size={14} />
                    Study Notes &amp; Key Principles
                  </h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#0F1F38] leading-relaxed">
                    {activeLesson.notes.trim()}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a lesson to begin.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
"use client";

import { use, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { NIGERIAN_SUBJECTS } from "@/lib/nigerianCurriculum";
import { lessonData } from "@/lib/lessonData";
import { ArrowLeft, BookOpen, Clock, PlaySquare, Sparkles, Video } from "lucide-react";

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
        <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-7 text-white border border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/subjects"
              className="w-9 h-9 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#22D3EE] truncate">
                {subject.code} · {subject.level} · {subject.examTrack}
              </p>
              <h1 className="landing-display text-2xl font-extrabold truncate">
                {subject.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={`/videos?subjectId=${encodeURIComponent(subject.id)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition whitespace-nowrap"
            >
              <PlaySquare size={14} className="text-[#22D3EE]" />
              Topic Videos
            </Link>
            <Link
              href="/live-classes"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
            >
              <Video size={14} />
              Live Classrooms
            </Link>
            <Link
              href={`/nova?subject=${encodeURIComponent(subject.name)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition whitespace-nowrap"
            >
              <Sparkles size={14} className="text-[#22D3EE]" />
              Ask Nova AI
            </Link>
          </div>
        </div>

        {/* Topic Tabs */}
        <div className="flex flex-wrap gap-2">
          {topicKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSelectedTopic(key);
                setActiveLessonIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                selectedTopic === key
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-xs"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-lavender)]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Lesson List */}
          <div className="learnova-card p-4 space-y-2 min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] px-2 pb-1">
              Lessons ({lessons.length})
            </h2>
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.slug}
                type="button"
                onClick={() => setActiveLessonIndex(idx)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  idx === activeLessonIndex
                    ? "bg-[#0B1230] dark:bg-[#1E293B] text-white border-[#0B1230] dark:border-[#334155]"
                    : "bg-[var(--surface-lavender)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                }`}
              >
                <p className="text-xs font-bold">{lesson.title}</p>
                <p
                  className={`text-[11px] mt-1 flex items-center gap-1 ${
                    idx === activeLessonIndex ? "text-[#22D3EE]" : "text-[var(--foreground-subtle)]"
                  }`}
                >
                  <Clock size={11} />
                  {lesson.duration}
                </p>
              </button>
            ))}
          </div>

          {/* Active Lesson Detail */}
          <div className="learnova-card p-6 space-y-5 min-w-0">
            {activeLesson ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
                  <div>
                    <span className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] uppercase tracking-wider">
                      {selectedTopic} Module
                    </span>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mt-0.5">
                      {activeLesson.title}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[var(--foreground-subtle)]">
                    Instructor: {subject.teacher}
                  </span>
                </div>

                <div className="rounded-xl bg-[var(--surface-lavender)] border border-[var(--border)] p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] dark:text-[#C4B5FD] flex items-center gap-1.5 mb-2">
                    <BookOpen size={14} />
                    Study Notes &amp; Key Principles
                  </h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--foreground)] leading-relaxed">
                    {activeLesson.notes.trim()}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--foreground-subtle)]">Select a lesson to begin.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
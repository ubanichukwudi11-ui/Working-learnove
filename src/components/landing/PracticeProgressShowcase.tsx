"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Timer,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  FileText,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";

const sampleQuestion = {
  exam: "WAEC · Mathematics",
  prompt: "Find the roots of the quadratic equation 2x² - 5x - 3 = 0.",
  options: [
    "x = 3 or x = -1/2",
    "x = -3 or x = 1/2",
    "x = 3 or x = 1/2",
    "x = -2 or x = 3/2",
  ],
  correct: "x = 3 or x = -1/2",
  explanation:
    "Factorising 2x² - 5x - 3 = 0 gives (2x + 1)(x - 3) = 0, so x = -1/2 or x = 3.",
};

const subjectProgress = [
  { name: "Mathematics", score: 84, grade: "A1", topics: "10 / 12 topics" },
  { name: "English Language", score: 81, grade: "A1", topics: "8 / 10 topics" },
  { name: "Physics", score: 74, grade: "B2", topics: "6 / 8 topics" },
  { name: "Chemistry", score: 69, grade: "B3", topics: "6 / 9 topics" },
];

export default function PracticeProgressShowcase() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isCorrect = selectedOption === sampleQuestion.correct;

  return (
    <section
      id="practice-progress"
      className="bg-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="max-w-2xl">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
            04 &amp; 05 · Examinations &amp; Student Progress
          </p>
          <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0B1230] leading-tight">
            Practice real CBT exams and watch measurable academic growth
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 6-Col: Interactive Timed CBT Drill */}
          <div className="lg:col-span-6 min-w-0 rounded-3xl border border-[#E4E1F5] bg-[#FAF8FF] p-5 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="landing-mono text-xs font-semibold text-[#6D28D9] uppercase tracking-wider">
                  {sampleQuestion.exam}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1230] text-[#22D3EE] px-3 py-1 landing-mono text-xs font-semibold tabular-nums">
                  <Timer size={13} />
                  59:42
                </span>
              </div>

              <div>
                <h3 className="landing-display text-xl font-bold text-[#0B1230]">
                  Interactive CBT Practice Engine
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Try an authentic objective question below for instant grading
                  and marking-scheme explanation:
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#E4E1F5] p-4 sm:p-5 space-y-4">
                <p className="text-sm sm:text-base font-bold text-[#0B1230]">
                  {sampleQuestion.prompt}
                </p>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {sampleQuestion.options.map((opt, idx) => {
                    const chosen = selectedOption === opt;
                    const right = opt === sampleQuestion.correct;
                    let stateStyle =
                      "border-[#E4E1F5] bg-[#FAF8FF] text-[#0B1230] hover:border-[#7C3AED]";

                    if (selectedOption) {
                      if (right) {
                        stateStyle =
                          "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                      } else if (chosen && !right) {
                        stateStyle =
                          "border-rose-400 bg-rose-50 text-rose-900 font-semibold";
                      } else {
                        stateStyle =
                          "border-slate-200 bg-slate-50 text-slate-400";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm transition-all flex items-center gap-2 ${stateStyle}`}
                      >
                        <span className="landing-mono font-bold text-[#6D28D9]">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="landing-mono">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedOption && (
                  <div
                    className={`rounded-xl p-3.5 text-xs leading-relaxed flex items-start gap-2.5 border ${
                      isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-amber-50 border-amber-200 text-amber-950"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 mt-0.5 shrink-0"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-rose-600 mt-0.5 shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">
                        {isCorrect
                          ? "Correct! +1 mark recorded"
                          : `Correct Answer: ${sampleQuestion.correct}`}
                      </p>
                      <p>{sampleQuestion.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E1F5] flex flex-wrap items-center justify-between gap-3">
              {selectedOption ? (
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#6D28D9]"
                >
                  <RotateCcw size={13} />
                  Reset sample question
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  WAEC, NECO &amp; JAMB UTME timed mocks
                </span>
              )}

              <Link
                href="/assignments?tab=cbt"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1230] hover:bg-[#1E1B4B] text-white px-4 py-2.5 text-xs font-bold transition-colors"
              >
                Launch Full CBT Simulator
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right 6-Col: Student Progress & WAEC Development */}
          <div className="lg:col-span-6 min-w-0 rounded-3xl bg-gradient-to-br from-[#11173F] via-[#171B4D] to-[#231955] text-white p-5 sm:p-8 flex flex-col justify-between gap-6 border border-indigo-900/50">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="landing-mono text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                  Student Progress &amp; Analytics
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C4B5FD]">
                  <TrendingUp size={14} />
                  WAEC A1–F9 Scale
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-2xl bg-white/8 border border-white/10 p-3 sm:p-4 min-w-0">
                  <p className="text-[11px] text-indigo-200 truncate">Overall Avg</p>
                  <p className="landing-display text-xl sm:text-2xl font-extrabold text-white mt-1 tabular-nums">
                    77%
                  </p>
                  <p className="landing-mono text-[11px] text-[#22D3EE] mt-0.5">
                    Grade A1
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 border border-white/10 p-3 sm:p-4 min-w-0">
                  <p className="text-[11px] text-indigo-200 truncate">Attendance</p>
                  <p className="landing-display text-xl sm:text-2xl font-extrabold text-white mt-1 tabular-nums">
                    96%
                  </p>
                  <p className="landing-mono text-[11px] text-[#C4B5FD] mt-0.5">
                    Live WAT
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 border border-white/10 p-3 sm:p-4 min-w-0">
                  <p className="text-[11px] text-indigo-200 truncate">Completed</p>
                  <p className="landing-display text-xl sm:text-2xl font-extrabold text-white mt-1 tabular-nums">
                    30
                  </p>
                  <p className="landing-mono text-[11px] text-[#22D3EE] mt-0.5">
                    Lessons
                  </p>
                </div>
              </div>

              {/* Subject Mastery Bars */}
              <div className="rounded-2xl bg-[#090E2B]/80 border border-white/10 p-4 sm:p-5 space-y-3.5">
                {subjectProgress.map((sub) => (
                  <div key={sub.name} className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                      <span className="font-semibold text-white">
                        {sub.name}
                      </span>
                      <span className="landing-mono text-indigo-200 tabular-nums">
                        {sub.topics} ·{" "}
                        <strong className="text-[#22D3EE]">
                          {sub.score}% ({sub.grade})
                        </strong>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#22D3EE]"
                        style={{ width: `${sub.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <FileText size={14} className="text-[#22D3EE]" />
                <span>Includes printable PDF term report cards</span>
              </div>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] px-4 py-2.5 text-xs font-bold text-white transition-all hover:from-[#8B5CF6] hover:to-[#4338CA]"
              >
                <Award size={14} />
                Explore Progress Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

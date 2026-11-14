"use client";

import { PlaySquare, Radio, Sparkles, ClipboardCheck } from "lucide-react";

const steps = [
  {
    index: "01",
    title: "Explore Subject → Term → Topic",
    detail:
      "Select your class level and follow structured video lessons, downloadable PDF study notes, and teacher explanations.",
    icon: PlaySquare,
    accent: "text-[#6D28D9] bg-[#EDE9FE]",
  },
  {
    index: "02",
    title: "Join Moderated Live Classrooms",
    detail:
      "Watch your teacher's live broadcast, stay distraction-free as a profile avatar, and raise your hand to join the stage.",
    icon: Radio,
    accent: "text-[#0891B2] bg-[#ECFEFF]",
  },
  {
    index: "03",
    title: "Unpack Concepts with Nova AI",
    detail:
      "Ask questions, scan handwritten equations, save answers to your Notebook, and generate flashcards on demand.",
    icon: Sparkles,
    accent: "text-[#4F46E5] bg-[#EEF2FF]",
  },
  {
    index: "04",
    title: "Drill Timed CBT & Track Mastery",
    detail:
      "Complete WAEC, NECO, and JAMB practice exams with instant explanations and exportable PDF term report cards.",
    icon: ClipboardCheck,
    accent: "text-[#0D9488] bg-[#F0FDFA]",
  },
];

const metrics = [
  { number: "140+", label: "Partner Nigerian Schools" },
  { number: "38,000+", label: "Active JSS & SSS Learners" },
  { number: "94%", label: "Mock Exam Pass Readiness" },
  { number: "1,200+", label: "Verified Subject Teachers" },
];

export default function Statistics() {
  return (
    <section
      id="how-it-works"
      aria-label="How Learnova Works"
      className="relative bg-[#F5F3FF] bg-learnova-dots-lavender border-b border-[#E4E1F5] py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Metrics Strip */}
        <div className="rounded-2xl bg-white border border-[#E4E1F5] shadow-sm shadow-indigo-950/5 grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
          {metrics.map((stat, idx) => (
            <div
              key={stat.label}
              className={`p-5 sm:p-7 min-w-0 border-[#EAE7FA] ${
                idx < 2 ? "border-b lg:border-b-0" : ""
              } ${idx % 2 === 0 ? "border-r" : ""} ${
                idx === 1 ? "lg:border-r" : ""
              }`}
            >
              <p className="landing-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1B4B] tabular-nums">
                {stat.number}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm font-semibold text-[#5B21B6]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* 4-Step Learning Rhythm */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
                How Learnova Works
              </p>
              <h2 className="landing-display mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.02em] text-[#0B1230]">
                One cohesive learning loop from first lesson to final exam
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Built around Nigerian academic terms and Africa/Lagos (WAT)
              timetables—keeping students, teachers, and parents aligned.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.index}
                  className="rounded-2xl bg-white border border-[#E4E1F5] hover:border-[#7C3AED]/45 hover:-translate-y-0.5 p-6 flex flex-col justify-between gap-5 transition-all duration-200 shadow-xs"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="landing-mono text-xs font-bold text-[#7C3AED]">
                        {step.index}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.accent}`}
                      >
                        <Icon size={18} />
                      </div>
                    </div>
                    <h3 className="landing-display text-lg font-bold text-[#0B1230] leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import {
  Video,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  BarChart3,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Role-Based Live Classrooms",
    description:
      "Dedicated Teacher Control Room and distraction-free Student Classroom with moderated raised-hand stage permissions and low-data audio mode.",
  },
  {
    icon: BookOpen,
    title: "JSS & SSS Curriculum Library",
    description:
      "Structured Mathematics, English, Physics, Chemistry, Biology and Civic Education lessons organized by Nigerian school terms.",
  },
  {
    icon: ClipboardCheck,
    title: "WAEC, NECO & JAMB CBT Prep",
    description:
      "Timed CBT practice, teacher-graded assignments, and instant marking feedback aligned with examination standards.",
  },
  {
    icon: Sparkles,
    title: "Nova AI Study Companion",
    description:
      "Step-by-step concept breakdowns, formula explanations, and guided revision tailored to topics a student finds challenging.",
  },
  {
    icon: BarChart3,
    title: "Term Analytics & Attendance",
    description:
      "Clear progress tracking across terms, attendance registers, and topic mastery for students, teachers, and parents.",
  },
  {
    icon: Users,
    title: "Dedicated School Workspaces",
    description:
      "Purpose-built dashboards for Students, Teachers, Parents, and School Administrators with clear role boundaries.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">
            Complete Academic Ecosystem
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built around how Nigerian schools actually teach and learn.
          </h2>
          <p className="mt-3 text-slate-600 text-base">
            Every workspace focuses on academic clarity—helping students stay consistent and giving teachers full classroom control.
          </p>
        </div>

        <div className="grid gap-6 mt-12 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-[#F7F8FA] p-6 hover:border-[#0B1F3A]/30 hover:bg-white transition"
              >
                <div className="w-11 h-11 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#0B1F3A]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
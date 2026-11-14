"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Radio,
  PlayCircle,
  Sparkles,
  Timer,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import heroCampusImg from "@/assets/images/hero_digital_campus_1794668569545.jpg";

interface CampusMode {
  id: string;
  label: string;
  title: string;
  summary: string;
  metric: string;
  href: string;
  cta: string;
  icon: typeof Radio;
}

const campusModes: CampusMode[] = [
  {
    id: "live",
    label: "Live Classes",
    title: "Low-Data Audio-First Classrooms",
    summary:
      "Raised-hand stage moderation, live whiteboard vectors, and real-time attendance built for 3G/4G networks.",
    metric: "10:00 AM WAT · SSS 2 Maths",
    href: "/live-classes",
    cta: "Join Live Schedule",
    icon: Radio,
  },
  {
    id: "videos",
    label: "Video Library",
    title: "Subject → Term → Topic Mastery",
    summary:
      "Structured teacher & curated video lessons with timestamp Q&A, offline download packs, and instant topic quizzes.",
    metric: "JSS 1 – SSS 3 · NERDC Syllabi",
    href: "/videos",
    cta: "Browse Video Lessons",
    icon: PlayCircle,
  },
  {
    id: "nova",
    label: "Nova AI",
    title: "Snap Homework & Step-by-Step Tutor",
    summary:
      "Upload handwritten equations or diagrams to extract steps, save summaries to Notebook, or drill custom flashcards.",
    metric: "Theory + Objective Walkthroughs",
    href: "/nova",
    cta: "Launch Nova Classroom",
    icon: Sparkles,
  },
  {
    id: "cbt",
    label: "WAEC & JAMB CBT",
    title: "Timed Examination Simulator",
    summary:
      "Authentic countdown CBT practice with question navigator, instant topic diagnostics, and downloadable PDF report cards.",
    metric: "60:00 Timer · Instant Analytics",
    href: "/assignments",
    cta: "Start CBT Practice",
    icon: Timer,
  },
];

export default function Hero() {
  const [activeId, setActiveId] = useState<string>("live");
  const activeMode =
    campusModes.find((mode) => mode.id === activeId) ?? campusModes[0];
  const ActiveIcon = activeMode.icon;

  return (
    <section className="relative overflow-hidden bg-[#07162B] text-white">
      {/* Architectural Grid & Atmospheric Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-0 h-[520px] w-[520px] rounded-full bg-[#0D9488]/18 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#F59E0B]/12 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 space-y-6">
            <p className="landing-mono text-xs font-medium uppercase tracking-[0.18em] text-[#2DD4BF]">
              JSS 1 – SSS 3 · NERDC Aligned · WAEC, NECO &amp; JAMB
            </p>

            <h1 className="landing-display text-[clamp(2.35rem,4.5vw,3.85rem)] font-bold tracking-[-0.03em] leading-[1.04] text-white">
              Where Nigeria&apos;s brightest learners master{" "}
              <span className="text-[#F59E0B]">every term.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Real-time teacher-led classrooms, term-by-term video lessons, timed
              JAMB &amp; WAEC CBT drills, and multimodal Nova AI tutoring—engineered
              to run smoothly across Nigerian school networks.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#07162B] px-6 py-3.5 text-sm font-bold transition-colors shadow-lg shadow-[#F59E0B]/15 whitespace-nowrap shrink-0"
              >
                Create Free Account
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/live-classes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white px-5 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <PlayCircle size={17} className="text-[#2DD4BF]" />
                Explore Live Classes
              </Link>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#2DD4BF]" />
                Works Offline via PWA
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#2DD4BF]" />
                Low-Data Audio Live Mode
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#2DD4BF]" />
                Africa/Lagos (WAT) Timetable
              </span>
            </div>
          </div>

          {/* Right Interactive Digital Campus Stage */}
          <div className="lg:col-span-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0D213D] shadow-2xl"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={heroCampusImg}
                  alt="Nigerian secondary school scholars collaborating around glowing study tablets in a modern sunlit classroom"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07162B]/85 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="landing-mono text-[11px] uppercase tracking-wider text-[#2DD4BF]">
                      Digital Campus Stage
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      Interactive STEM Studio · Lagos &amp; Abuja Cohort
                    </p>
                  </div>
                  <Link
                    href="/videos"
                    className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors shrink-0"
                  >
                    Open Library
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Interactive Campus Mode Switcher Strip */}
              <div className="border-t border-white/10 bg-[#0A1B33] p-4 sm:p-5">
                <div
                  role="tablist"
                  aria-label="Explore Learnova modes"
                  className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3"
                >
                  {campusModes.map((mode) => {
                    const isActive = mode.id === activeMode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveId(mode.id)}
                        className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          isActive
                            ? "bg-[#0D9488] text-white"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#2DD4BF] landing-mono">
                      <ActiveIcon size={14} className="shrink-0" />
                      <span>{activeMode.metric}</span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      {activeMode.title}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {activeMode.summary}
                    </p>
                  </div>

                  <Link
                    href={activeMode.href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    {activeMode.cta}
                    <ArrowUpRight size={14} className="text-[#F59E0B]" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
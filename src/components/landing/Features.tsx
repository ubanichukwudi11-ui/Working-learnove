"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  MessageSquareText,
  Download,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Layers,
} from "lucide-react";
import heroCampusImg from "@/assets/images/hero_digital_campus_1794668569545.jpg";

type SubjectKey = "math" | "physics" | "chemistry" | "english";
type TermKey = "t1" | "t2" | "t3";

interface TopicLesson {
  title: string;
  duration: string;
  teacher: string;
  qaCount: number;
  quizCount: number;
}

const curriculumCatalog: Record<
  SubjectKey,
  {
    name: string;
    code: string;
    level: string;
    terms: Record<TermKey, { label: string; topics: TopicLesson[] }>;
  }
> = {
  math: {
    name: "Mathematics",
    code: "MTH 201",
    level: "SSS 2 Science",
    terms: {
      t1: {
        label: "First Term",
        topics: [
          {
            title: "Logarithms, Indices & Standard Form",
            duration: "22 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 14,
            quizCount: 5,
          },
          {
            title: "Arithmetic & Geometric Progressions",
            duration: "19 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 11,
            quizCount: 5,
          },
        ],
      },
      t2: {
        label: "Second Term",
        topics: [
          {
            title: "Quadratic Equations & Parabola Graphs",
            duration: "24 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 18,
            quizCount: 5,
          },
          {
            title: "Circle Theorems & Tangent Properties",
            duration: "26 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 15,
            quizCount: 5,
          },
        ],
      },
      t3: {
        label: "Third Term",
        topics: [
          {
            title: "Trigonometric Ratios, Sine & Cosine Rules",
            duration: "25 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 12,
            quizCount: 5,
          },
          {
            title: "Cumulative Frequency & Grouped Variance",
            duration: "21 min",
            teacher: "Mrs. Funke Adewale",
            qaCount: 9,
            quizCount: 5,
          },
        ],
      },
    },
  },
  physics: {
    name: "Physics",
    code: "PHY 202",
    level: "SSS 2 Science",
    terms: {
      t1: {
        label: "First Term",
        topics: [
          {
            title: "Scalars, Vectors & Parallelogram Law",
            duration: "20 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 13,
            quizCount: 5,
          },
          {
            title: "Equations of Uniformly Accelerated Motion",
            duration: "23 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 16,
            quizCount: 5,
          },
        ],
      },
      t2: {
        label: "Second Term",
        topics: [
          {
            title: "Newton's Laws of Motion & Linear Momentum",
            duration: "24 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 19,
            quizCount: 5,
          },
          {
            title: "Work, Energy, Power & Mechanical Efficiency",
            duration: "21 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 11,
            quizCount: 5,
          },
        ],
      },
      t3: {
        label: "Third Term",
        topics: [
          {
            title: "Refraction of Light & Optical Lenses",
            duration: "22 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 10,
            quizCount: 5,
          },
          {
            title: "Waves, Sound Resonance & Harmonics",
            duration: "25 min",
            teacher: "Mr. Chinedu Emeka",
            qaCount: 14,
            quizCount: 5,
          },
        ],
      },
    },
  },
  chemistry: {
    name: "Chemistry",
    code: "CHM 203",
    level: "SSS 2 Science",
    terms: {
      t1: {
        label: "First Term",
        topics: [
          {
            title: "Periodic Law, Ionization & Electronegativity",
            duration: "21 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 12,
            quizCount: 5,
          },
          {
            title: "Rates of Chemical Reaction & Collision Theory",
            duration: "19 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 9,
            quizCount: 5,
          },
        ],
      },
      t2: {
        label: "Second Term",
        topics: [
          {
            title: "Hydrocarbons: Alkanes, Alkenes & Alkynes",
            duration: "26 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 17,
            quizCount: 5,
          },
          {
            title: "Volumetric Analysis & Acid-Base Titration",
            duration: "23 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 15,
            quizCount: 5,
          },
        ],
      },
      t3: {
        label: "Third Term",
        topics: [
          {
            title: "Electrolysis & Faraday's Quantitative Laws",
            duration: "24 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 14,
            quizCount: 5,
          },
          {
            title: "Nitrogen, Ammonia & Contact Process",
            duration: "20 min",
            teacher: "Dr. Ibrahim Bello",
            qaCount: 8,
            quizCount: 5,
          },
        ],
      },
    },
  },
  english: {
    name: "English Language",
    code: "ENG 201",
    level: "SSS 2 Core",
    terms: {
      t1: {
        label: "First Term",
        topics: [
          {
            title: "WAEC Formal Letter & Argumentative Essays",
            duration: "18 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 10,
            quizCount: 5,
          },
          {
            title: "Clauses, Phrases & Sentence Concord",
            duration: "20 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 11,
            quizCount: 5,
          },
        ],
      },
      t2: {
        label: "Second Term",
        topics: [
          {
            title: "Comprehension Inference & Summary Skills",
            duration: "22 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 15,
            quizCount: 5,
          },
          {
            title: "Oral English: Vowel Contrasts & Word Stress",
            duration: "19 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 13,
            quizCount: 5,
          },
        ],
      },
      t3: {
        label: "Third Term",
        topics: [
          {
            title: "Lexis, Structure & Idiomatic Expressions",
            duration: "21 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 12,
            quizCount: 5,
          },
          {
            title: "Report Writing & Article Publication",
            duration: "18 min",
            teacher: "Mrs. Titilayo Ojo",
            qaCount: 7,
            quizCount: 5,
          },
        ],
      },
    },
  },
};

export default function Features() {
  const [subject, setSubject] = useState<SubjectKey>("math");
  const [term, setTerm] = useState<TermKey>("t2");
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);

  const activeSubject = curriculumCatalog[subject];
  const activeTerm = activeSubject.terms[term];
  const activeLesson =
    activeTerm.topics[selectedTopicIdx] || activeTerm.topics[0];

  return (
    <section
      id="video-lessons"
      className="relative bg-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
              01 · Structured Video Lessons
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0B1230] leading-tight">
              Navigate every Subject, Academic Term, and Topic effortlessly
            </h2>
            <p className="mt-3 text-slate-600 text-base leading-relaxed">
              Every lesson is organized cleanly into{" "}
              <strong className="text-[#1E1B4B]">
                Subject → Term → Topic
              </strong>{" "}
              with timestamped student Q&amp;A, downloadable PDF study notes, and
              instant topic mastery quizzes.
            </p>
          </div>

          <Link
            href="/videos"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3730A3] px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap self-start lg:self-auto"
          >
            Explore Full Video Library
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Interactive Curriculum Browser */}
        <div className="rounded-3xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 sm:p-8 shadow-sm shadow-indigo-950/5">
          {/* Step 1 & 2 Selectors: Subject + Term */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[#E4E1F5]">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select subject">
              {(Object.keys(curriculumCatalog) as SubjectKey[]).map((key) => {
                const isSelected = subject === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSubject(key);
                      setSelectedTopicIdx(0);
                    }}
                    className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-gradient-to-r from-[#6D28D9] to-[#4F46E5] text-white shadow-sm"
                        : "bg-white border border-[#E4E1F5] text-slate-700 hover:border-[#7C3AED]/40"
                    }`}
                  >
                    {curriculumCatalog[key].name}
                  </button>
                );
              })}
            </div>

            <div
              className="grid grid-cols-3 sm:inline-flex rounded-xl bg-white p-1 border border-[#E4E1F5] w-full sm:w-auto self-start md:self-auto"
              role="tablist"
              aria-label="Select academic term"
            >
              {(["t1", "t2", "t3"] as TermKey[]).map((t) => {
                const isTerm = term === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={isTerm}
                    onClick={() => {
                      setTerm(t);
                      setSelectedTopicIdx(0);
                    }}
                    className={`rounded-lg px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap text-center ${
                      isTerm
                        ? "bg-[#0B1230] text-white"
                        : "text-slate-600 hover:text-[#0B1230]"
                    }`}
                  >
                    {activeSubject.terms[t].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Topic List + Active Video Lesson Stage */}
          <div className="mt-6 grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Topic Column */}
            <div className="lg:col-span-5 min-w-0 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs landing-mono text-[#6D28D9]">
                  <span className="truncate">
                    {activeSubject.code} · {activeSubject.level}
                  </span>
                  <span className="shrink-0">{activeTerm.label}</span>
                </div>

                {activeTerm.topics.map((topic, idx) => {
                  const selected = idx === selectedTopicIdx;
                  return (
                    <button
                      key={topic.title}
                      type="button"
                      onClick={() => setSelectedTopicIdx(idx)}
                      className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all ${
                        selected
                          ? "bg-[#0B1230] text-white border-[#4F46E5] shadow-lg shadow-indigo-950/15"
                          : "bg-white text-[#0B1230] border-[#E4E1F5] hover:border-[#7C3AED]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs landing-mono">
                        <span
                          className={
                            selected ? "text-[#22D3EE]" : "text-[#6D28D9]"
                          }
                        >
                          TOPIC 0{idx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 shrink-0 ${
                            selected ? "text-indigo-200" : "text-slate-500"
                          }`}
                        >
                          <Clock size={12} />
                          {topic.duration}
                        </span>
                      </div>
                      <h3 className="landing-display text-base sm:text-lg font-bold mt-2 leading-snug">
                        {topic.title}
                      </h3>
                      <p
                        className={`text-xs mt-1.5 ${
                          selected ? "text-indigo-200/80" : "text-slate-500"
                        }`}
                      >
                        Instructor: {topic.teacher}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-[#EDE9FE]/70 border border-[#DDD6FE] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#6D28D9] flex items-center justify-center shrink-0">
                    <Layers size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E1B4B] truncate">
                      Offline Study Companion
                    </p>
                    <p className="text-[11px] text-[#4C1D95] truncate">
                      Save notes, ask at timestamps &amp; test mastery
                    </p>
                  </div>
                </div>
                <Link
                  href="/videos"
                  className="text-xs font-bold text-[#6D28D9] hover:underline whitespace-nowrap shrink-0"
                >
                  Open →
                </Link>
              </div>
            </div>

            {/* Right Active Video Lesson Preview */}
            <div className="lg:col-span-7 min-w-0 rounded-2xl bg-[#0B1230] text-white border border-indigo-900/60 overflow-hidden flex flex-col justify-between">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#070D24]">
                <Image
                  src={heroCampusImg}
                  alt={activeLesson.title}
                  fill
                  loading="eager"
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[#0B1230]/25" />

                {/* Center Play Affordance (Clear of title text) */}
                <Link
                  href="/videos"
                  aria-label={`Watch ${activeLesson.title}`}
                  className="absolute inset-0 z-10 flex items-center justify-center group"
                >
                  <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-white flex items-center justify-center shadow-xl shadow-[#7C3AED]/40 transition-transform duration-200 group-hover:scale-105">
                    <Play size={22} fill="currentColor" className="ml-0.5" />
                  </span>
                </Link>
              </div>

              {/* Dedicated Title & Duration Strip Below Video Thumbnail */}
              <div className="px-4 sm:px-6 py-4 bg-[#0B1230] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="landing-mono text-[11px] uppercase tracking-wider text-[#22D3EE]">
                    {activeSubject.name} · {activeTerm.label}
                  </p>
                  <h3 className="landing-display text-lg sm:text-xl font-bold text-white mt-0.5 leading-snug">
                    {activeLesson.title}
                  </h3>
                </div>
                <span className="landing-mono text-xs text-indigo-200 bg-[#070D24] border border-white/15 px-3 py-1 rounded-lg self-start sm:self-auto shrink-0">
                  {activeLesson.duration}
                </span>
              </div>

              <div className="p-4 sm:p-6 grid sm:grid-cols-3 gap-4 border-t border-white/10 bg-[#080F29]">
                <div className="flex items-start gap-2.5">
                  <MessageSquareText
                    size={16}
                    className="text-[#22D3EE] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">
                      <span className="tabular-nums">{activeLesson.qaCount}</span>
                      {" "}Timestamp Q&amp;As
                    </p>
                    <p className="text-[11px] text-indigo-200/75 mt-0.5">
                      Ask at exact video seconds
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Download size={16} className="text-[#C4B5FD] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      PDF Lesson Notes
                    </p>
                    <p className="text-[11px] text-indigo-200/75 mt-0.5">
                      Downloadable study pack
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="text-[#22D3EE] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">
                      <span className="tabular-nums">{activeLesson.quizCount}</span>
                      -Question Check
                    </p>
                    <p className="text-[11px] text-indigo-200/75 mt-0.5">
                      Verify mastery immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
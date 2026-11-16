"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Radio,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Hand,
  CheckCircle2,
  BookOpen,
  Award,
  ArrowUpRight,
  Mic,
} from "lucide-react";
import teacherStudioImg from "@/assets/images/teacher_broadcast_studio_1794668570885.jpg";
import heroCampusImg from "@/assets/images/hero_digital_campus_1794668569545.jpg";
import novaStudyTabletImg from "@/assets/images/nova_study_tablet_1794668570169.jpg";

type HeroView = "live" | "videos" | "nova" | "progress";

const studentAvatars = [
  { name: "Toluwani A.", initials: "TA", raised: false, color: "bg-[#7C3AED]" },
  { name: "Amina Y.", initials: "AY", raised: true, color: "bg-[#06B6D4]" },
  { name: "Chidi N.", initials: "CN", raised: false, color: "bg-[#4F46E5]" },
  { name: "Zainab M.", initials: "ZM", raised: false, color: "bg-[#0D9488]" },
];

export default function Hero() {
  const [activeView, setActiveView] = useState<HeroView>("live");
  const [studentApproved, setStudentApproved] = useState(false);

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-[#070D24] via-[#0E1538] to-[#151A44] text-white"
    >
      {/* Clean GPU-friendly radial & architectural grid layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(124, 58, 237, 0.22), transparent 44%), radial-gradient(circle at 12% 85%, rgba(6, 182, 212, 0.14), transparent 42%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-18 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-5 min-w-0 space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-medium text-[#22D3EE] landing-mono tracking-[0.12em] uppercase">
              <span>Learnova Digital Campus</span>
              <span className="text-indigo-400" aria-hidden="true">
                ·
              </span>
              <span className="text-[#C4B5FD]">JSS 1 – SSS 3 · NERDC</span>
            </div>

            <h1 className="landing-hero-serif text-[clamp(2.15rem,4.3vw,3.75rem)] font-bold tracking-[-0.02em] leading-[1.08] text-white">
              Where Nigeria&apos;s brightest learners master{" "}
              <span className="italic font-semibold text-[#22D3EE]">
                every term.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-indigo-100/85 leading-relaxed max-w-xl">
              An integrated learning ecosystem uniting structured video lessons,
              moderated live classrooms, Nova AI tutoring, timed WAEC &amp; JAMB
              CBT practice, and real-time student progress tracking.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] text-white px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold shadow-lg shadow-[#7C3AED]/30 transition-all whitespace-nowrap shrink-0 min-h-[46px]"
              >
                Get Started
                <ArrowRight size={17} />
              </Link>
              <a
                href="#video-lessons"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/45 bg-white/5 hover:bg-white/10 text-white px-4 sm:px-5 py-3 sm:py-3.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[46px]"
              >
                <Compass size={17} className="text-[#22D3EE]" />
                Explore Learnova
              </a>
            </div>

            {/* Grounded Platform Markers */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3 sm:gap-4 max-w-md">
              <div className="min-w-0">
                <p className="landing-mono text-xs sm:text-sm font-semibold text-white tabular-nums">
                  JSS 1–SS 3
                </p>
                <p className="text-[11px] sm:text-xs text-indigo-200/75 mt-0.5 leading-snug">
                  Term-structured syllabi
                </p>
              </div>
              <div className="min-w-0">
                <p className="landing-mono text-xs sm:text-sm font-semibold text-[#22D3EE] tabular-nums">
                  WAT Live
                </p>
                <p className="text-[11px] sm:text-xs text-indigo-200/75 mt-0.5 leading-snug">
                  Low-data audio &amp; video
                </p>
              </div>
              <div className="min-w-0">
                <p className="landing-mono text-xs sm:text-sm font-semibold text-[#C4B5FD] tabular-nums">
                  4 Portals
                </p>
                <p className="text-[11px] sm:text-xs text-indigo-200/75 mt-0.5 leading-snug">
                  Student, Teacher, Parent
                </p>
              </div>
            </div>
          </div>

          {/* Right Layered Platform Ecosystem Composition */}
          <div className="lg:col-span-7 min-w-0 space-y-4">
            {/* Main Interactive Learnova Stage Window */}
            <div className="learnova-ambient-stage rounded-2xl">
            <div className="relative rounded-2xl border border-indigo-400/25 bg-[#0D1336] shadow-2xl shadow-black/40 overflow-hidden">
              {/* Interactive Ecosystem View Switcher */}
              <div className="border-b border-white/10 bg-[#0A0F2C] px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div
                  role="tablist"
                  aria-label="Preview Learnova ecosystem views"
                  className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5"
                >
                  {(
                    [
                      { id: "live", label: "Live Classroom", icon: Radio },
                      { id: "videos", label: "Video Lessons", icon: PlayCircle },
                      { id: "nova", label: "Nova AI", icon: Sparkles },
                      { id: "progress", label: "Progress", icon: TrendingUp },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeView === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveView(tab.id)}
                        className={`inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          active
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm"
                            : "text-indigo-200/80 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon size={13} className="shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="landing-mono text-[11px] text-[#22D3EE] hidden sm:inline shrink-0">
                  SSS 2 Science · Second Term
                </span>
              </div>

              {/* Dynamic Preview Canvas */}
              <div className="p-3.5 sm:p-5">
                {activeView === "live" && (
                  <div className="space-y-3">
                    {/* Teacher Main Classroom Feed + Clean Attached Footer Bar */}
                    <div className="rounded-xl overflow-hidden border border-white/15 bg-[#070D24]">
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
                        <Image
                          src={teacherStudioImg}
                          alt="Teacher conducting a live mathematics lesson on an illuminated glass board"
                          fill
                          priority
                          placeholder="blur"
                          sizes="(max-width: 1024px) 100vw, 55vw"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/75 via-transparent to-transparent" />

                        {/* Teacher Lead Tag */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-[#070D24]/85 border border-white/15 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold">
                          <Radio size={13} className="text-[#22D3EE] shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-none">
                            Teacher · Mrs. Funke Adewale
                          </span>
                        </div>

                        {/* Approved Student PiP Video Preview when Teacher Approves */}
                        {studentApproved && (
                          <div className="absolute top-3 right-3 z-10 w-24 sm:w-36 rounded-xl overflow-hidden border-2 border-[#22D3EE] bg-[#131A42] shadow-xl">
                            <div className="relative aspect-[4/3] w-full">
                              <Image
                                src={heroCampusImg}
                                alt="Approved student Amina speaking on stage"
                                fill
                                placeholder="blur"
                                sizes="160px"
                                referrerPolicy="no-referrer"
                                className="object-cover"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/85 via-transparent to-transparent" />
                              <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-semibold text-white">
                                <span className="truncate">Amina Y.</span>
                                <Mic size={10} className="text-[#22D3EE] shrink-0" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Clean Control & Caption Bar Below Video Frame */}
                      <div className="px-3.5 py-3 bg-[#090F2B] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="landing-mono text-[11px] text-[#C4B5FD] truncate">
                            MTH 201 · Quadratic Equations &amp; Parabola Graphs
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                            Students remain profile avatars until approved to speak
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStudentApproved((v) => !v)}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto ${
                            studentApproved
                              ? "bg-[#06B6D4] text-[#070D24]"
                              : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                          }`}
                        >
                          <Hand size={13} />
                          {studentApproved
                            ? "Stage Active · Mute"
                            : "Approve Amina's Hand"}
                        </button>
                      </div>
                    </div>

                    {/* Student Avatar Strip */}
                    <div className="rounded-xl bg-[#090F2B] border border-white/10 px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
                        {studentAvatars.map((st) => (
                          <div
                            key={st.name}
                            className="flex items-center gap-2 min-w-0"
                          >
                            <div
                              className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full ${st.color} text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center border shrink-0 ${
                                st.raised && !studentApproved
                                  ? "border-[#22D3EE] ring-2 ring-[#22D3EE]/35"
                                  : "border-white/20"
                              }`}
                            >
                              {st.initials}
                              {st.raised && (
                                <span
                                  aria-label="Hand raised"
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22D3EE] text-[#070D24] flex items-center justify-center"
                                >
                                  <Hand size={9} />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-indigo-100/85 truncate">
                              {st.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/live-classes"
                        className="text-xs font-semibold text-[#22D3EE] hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        Open Live Schedule <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}

                {activeView === "videos" && (
                  <div className="grid sm:grid-cols-12 gap-4 items-stretch">
                    <div className="sm:col-span-7 min-w-0 relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/15 bg-[#070D24]">
                      <Image
                        src={heroCampusImg}
                        alt="Learnova structured video lessons library"
                        fill
                        loading="eager"
                        placeholder="blur"
                        sizes="(max-width: 640px) 100vw, 420px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/90 via-[#070D24]/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="landing-mono text-[11px] text-[#22D3EE]">
                          MATHEMATICS → SECOND TERM → TOPIC 03
                        </p>
                        <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                          Completing the Square &amp; Discriminant Roots
                        </p>
                      </div>
                    </div>
                    <div className="sm:col-span-5 min-w-0 rounded-xl bg-[#090F2B] border border-white/10 p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2.5">
                        <p className="landing-mono text-[11px] uppercase tracking-wider text-[#C4B5FD]">
                          Included With Lesson
                        </p>
                        {[
                          "18 min HD & Low-Data Stream",
                          "Timestamped Teacher Q&A",
                          "Downloadable PDF Study Notes",
                          "5-Question Topic Mastery Quiz",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-2 text-xs text-indigo-100/85"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-[#22D3EE] mt-0.5 shrink-0"
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/videos"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] px-3.5 py-2 text-xs font-bold text-white transition-colors"
                      >
                        Browse Video Library <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {activeView === "nova" && (
                  <div className="grid sm:grid-cols-12 gap-4 items-stretch">
                    <div className="sm:col-span-5 min-w-0 relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white/15 bg-[#070D24]">
                      <Image
                        src={novaStudyTabletImg}
                        alt="Nova AI solving quadratic equations beside parabola diagram"
                        fill
                        loading="eager"
                        placeholder="blur"
                        sizes="(max-width: 640px) 100vw, 300px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/80 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 landing-mono text-[11px] text-[#22D3EE]">
                        Snap &amp; Solve Active
                      </span>
                    </div>
                    <div className="sm:col-span-7 min-w-0 rounded-xl bg-[#090F2B] border border-[#7C3AED]/40 p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] landing-mono">
                          <span className="text-[#C4B5FD]">NOVA AI TUTOR</span>
                          <span className="text-[#22D3EE]">WAEC Marking Steps</span>
                        </div>
                        <p className="text-xs font-semibold text-white">
                          Prompt: &ldquo;Find the turning point of y = x² - 6x + 8&rdquo;
                        </p>
                        <div className="rounded-lg bg-[#070D24] border border-white/10 p-3 space-y-1.5 text-xs text-indigo-100/90 landing-mono">
                          <p>1. Axis: h = -(-6) / 2(1) = 3</p>
                          <p>2. Value: y = 3² - 6(3) + 8 = -1</p>
                          <p className="text-[#22D3EE]">3. Vertex = (3, -1)</p>
                        </div>
                      </div>
                      <Link
                        href="/nova"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] px-3.5 py-2 text-xs font-bold text-white"
                      >
                        Ask Nova AI <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {activeView === "progress" && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[#090F2B] border border-white/10 p-4 space-y-1">
                      <p className="text-xs text-indigo-200/75">Term Average</p>
                      <p className="text-2xl font-extrabold text-white tabular-nums">
                        84%
                      </p>
                      <p className="landing-mono text-[11px] text-[#22D3EE]">
                        WAEC Grade A1
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#090F2B] border border-white/10 p-4 space-y-1">
                      <p className="text-xs text-indigo-200/75">Live Attendance</p>
                      <p className="text-2xl font-extrabold text-white tabular-nums">
                        96%
                      </p>
                      <p className="landing-mono text-[11px] text-[#C4B5FD]">
                        23 / 24 Sessions
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#090F2B] border border-white/10 p-4 space-y-1">
                      <p className="text-xs text-indigo-200/75">Topics Mastered</p>
                      <p className="text-2xl font-extrabold text-white tabular-nums">
                        18 / 24
                      </p>
                      <p className="landing-mono text-[11px] text-[#22D3EE]">
                        PDF Report Ready
                      </p>
                    </div>
                    <div className="sm:col-span-3 rounded-xl bg-[#090F2B] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 text-[#C4B5FD] flex items-center justify-center shrink-0">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Continuous Assessment &amp; WAEC Projections
                          </p>
                          <p className="text-[11px] text-indigo-200/75">
                            Accessible to both Students and linked Parent portals.
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/analytics"
                        className="text-xs font-semibold text-[#22D3EE] hover:underline whitespace-nowrap shrink-0"
                      >
                        View Analytics →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Bottom Ecosystem Trio Cards */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-indigo-400/20 bg-[#121942]/90 px-4 py-3 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/25 text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <BookOpen size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    Subject → Term → Topic
                  </p>
                  <p className="text-[11px] text-indigo-200/75 truncate">
                    Structured video &amp; PDF notes
                  </p>
                </div>
              </div>

              <div className="learnova-ambient-stage-soft rounded-xl border border-[#7C3AED]/40 bg-[#121942]/95 px-4 py-3 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/20 text-[#22D3EE] flex items-center justify-center shrink-0">
                  <Sparkles size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    Nova AI Study Tutor
                  </p>
                  <p className="text-[11px] text-indigo-200/75 truncate">
                    Step-by-step Snap &amp; Solve
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-400/20 bg-[#121942]/90 px-4 py-3 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5]/30 text-[#A5B4FC] flex items-center justify-center shrink-0">
                  <Award size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    WAEC &amp; JAMB CBT
                  </p>
                  <p className="text-[11px] text-indigo-200/75 truncate">
                    Timed mock &amp; instant grading
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
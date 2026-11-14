"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Timer,
  PlayCircle,
  Radio,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import novaStudyTabletImg from "@/assets/images/nova_study_tablet_1794668570169.jpg";

type RoleTrack = "students" | "teachers" | "schools";

interface TrackHighlight {
  kicker: string;
  heading: string;
  subheading: string;
  spotlightTitle: string;
  spotlightBody: string;
  spotlightHref: string;
  spotlightCta: string;
  cbtTitle: string;
  cbtBody: string;
  cbtMetric: string;
  cbtHref: string;
  bottomCards: {
    index: string;
    icon: typeof PlayCircle;
    title: string;
    description: string;
    href: string;
    cta: string;
  }[];
}

const trackData: Record<RoleTrack, TrackHighlight> = {
  students: {
    kicker: "For JSS 1 – SSS 3 Students",
    heading: "Built for deep understanding—not last-minute cramming.",
    subheading:
      "Move seamlessly from structured video lessons and live classes to timed WAEC & JAMB CBT practice and personal Notebook revision.",
    spotlightTitle: "Nova Multimodal AI + Notebook Studio",
    spotlightBody:
      "Snap handwritten homework questions, unpack step-by-step derivations, generate custom study flashcards, and save clean summaries directly into your class Notebook.",
    spotlightHref: "/nova",
    spotlightCta: "Try Nova AI Classroom",
    cbtTitle: "Timed WAEC, NECO & JAMB CBT Engine",
    cbtBody:
      "Practice under real exam countdown timers with instant question navigation, answer explanations, and automated topic strength diagnostics.",
    cbtMetric: "60:00 · 40 Questions · Instant Mark",
    cbtHref: "/assignments",
    bottomCards: [
      {
        index: "03",
        icon: PlayCircle,
        title: "Subject → Term → Topic Videos",
        description:
          "Teacher-uploaded lessons & curated videos with timestamped Q&A, downloadable study notes, and topic quizzes.",
        href: "/videos",
        cta: "Open Video Library",
      },
      {
        index: "04",
        icon: Radio,
        title: "Low-Data Live Classrooms",
        description:
          "Join moderated raised-hand audio-first sessions tuned for Nigerian mobile networks without losing board clarity.",
        href: "/live-classes",
        cta: "See Live Classes",
      },
      {
        index: "05",
        icon: BarChart3,
        title: "Offline PWA & Term Analytics",
        description:
          "Cache study materials offline and export printable academic report cards showing quiz mastery across every subject.",
        href: "/subjects",
        cta: "Explore Curriculum",
      },
    ],
  },
  teachers: {
    kicker: "For Verified Nigerian Educators",
    heading: "Full classroom authority, zero grading friction.",
    subheading:
      "Run orderly 40-student live broadcasts, publish term-by-term video lessons, and answer timestamped student questions in one place.",
    spotlightTitle: "Studio Broadcast & Topic Video Requests",
    spotlightBody:
      "Upload custom topic walkthroughs or attach curated video explainers directly to school terms while monitoring student completion and Q&A.",
    spotlightHref: "/videos",
    spotlightCta: "Manage Topic Videos",
    cbtTitle: "Moderated Raised-Hand Stage Control",
    cbtBody:
      "Approve individual learners onto the audio stage one by one, share live equations cleanly, and record session attendance automatically.",
    cbtMetric: "Teacher Control Room · WAT Sync",
    cbtHref: "/live-classes",
    bottomCards: [
      {
        index: "03",
        icon: Timer,
        title: "Instant CBT Assessment Drills",
        description:
          "Assign curriculum-aligned WAEC & JAMB mock objectives with automated grading and per-topic failure breakdowns.",
        href: "/assignments",
        cta: "View CBT Drills",
      },
      {
        index: "04",
        icon: Sparkles,
        title: "Nova Classroom Co-Pilot",
        description:
          "Draft scheme-of-work outlines, worked examples, and quick revision flashcards for your class in seconds.",
        href: "/nova",
        cta: "Open Nova Co-Pilot",
      },
      {
        index: "05",
        icon: BarChart3,
        title: "Cohort Attendance & Scores",
        description:
          "Track attendance logs, watch completion rates, and term averages across every JSS & SSS arm you teach.",
        href: "/register/teacher",
        cta: "Teacher Onboarding",
      },
    ],
  },
  schools: {
    kicker: "For Parents & School Administrators",
    heading: "Transparent academic visibility across every term.",
    subheading:
      "Parents verify progress between meetings while school admins assign topic video requests and unify WAT timetables across arms.",
    spotlightTitle: "Connected Parent & Ward Progress Portal",
    spotlightBody:
      "Link directly to your child's academic workspace to monitor live class attendance, quiz trends, and printable end-of-term PDF report cards.",
    spotlightHref: "/register/parent",
    spotlightCta: "Open Parent Sign Up",
    cbtTitle: "School-Wide Video & Timetable Governance",
    cbtBody:
      "Assign specific teachers to record missing term topics, enforce NERDC alignment, and oversee every live class slot in real time.",
    cbtMetric: "Admin Oversight · Multi-Term",
    cbtHref: "/register/teacher",
    bottomCards: [
      {
        index: "03",
        icon: BarChart3,
        title: "Official PDF Report Cards",
        description:
          "Generate verifiable multi-subject term reports combining CBT mock marks, video quiz mastery, and attendance.",
        href: "/subjects",
        cta: "Inspect Subjects",
      },
      {
        index: "04",
        icon: Radio,
        title: "Unified Africa/Lagos Timetable",
        description:
          "Synchronize JSS 1–SSS 3 live broadcasts across morning, afternoon, and exam prep revision windows.",
        href: "/live-classes",
        cta: "View Timetable",
      },
      {
        index: "05",
        icon: Sparkles,
        title: "Guided Safe AI Guardrails",
        description:
          "Classroom-scoped Nova tutoring keeps learners anchored to worked methods rather than unverified shortcut answers.",
        href: "/nova",
        cta: "Explore Nova AI",
      },
    ],
  },
};

const tracks: { id: RoleTrack; label: string }[] = [
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "schools", label: "Parents & Schools" },
];

export default function Features() {
  const [selectedTrack, setSelectedTrack] = useState<RoleTrack>("students");
  const active = trackData[selectedTrack];

  return (
    <section
      id="features"
      className="relative bg-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header + Interactive Role Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#0D9488]">
              {active.kicker}
            </p>
            <h2 className="landing-display mt-2.5 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-[-0.025em] text-[#0B1F3A] leading-[1.12]">
              {active.heading}
            </h2>
            <p className="mt-3 text-slate-600 text-base leading-relaxed">
              {active.subheading}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Academic workspace perspective"
            className="inline-flex self-start lg:self-auto rounded-xl bg-[#F1F4F8] p-1 border border-slate-200"
          >
            {tracks.map((track) => {
              const isSelected = track.id === selectedTrack;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-[#0B1F3A] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0B1F3A]"
                  }`}
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-12 grid lg:grid-cols-12 gap-5">
          {/* Top-Left 7-Column Spotlight Feature Card */}
          <div className="lg:col-span-7 rounded-2xl bg-[#0B1F3A] text-white overflow-hidden grid sm:grid-cols-12 border border-[#143258]">
            <div className="sm:col-span-7 p-7 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between text-xs landing-mono text-[#2DD4BF]">
                  <span>01 · FEATURED WORKSPACE</span>
                  <Sparkles size={15} />
                </div>
                <h3 className="landing-display mt-4 text-2xl font-bold tracking-tight text-white leading-snug">
                  {active.spotlightTitle}
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {active.spotlightBody}
                </p>
              </div>

              <Link
                href={active.spotlightHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors self-start"
              >
                {active.spotlightCta}
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="sm:col-span-5 relative min-h-[220px] sm:min-h-full">
              <Image
                src={novaStudyTabletImg}
                alt="Student hand solving quadratic equations beside a glowing digital parabola graph on a tablet"
                fill
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A]/60 via-transparent to-transparent sm:block hidden" />
            </div>
          </div>

          {/* Top-Right 5-Column High-Contrast Architectural Card */}
          <div className="lg:col-span-5 rounded-2xl bg-[#FAF8F4] border border-slate-200 p-7 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between text-xs landing-mono text-[#D97706]">
                <span>02 · EXAM ENGINE</span>
                <Timer size={15} />
              </div>
              <h3 className="landing-display mt-4 text-2xl font-bold tracking-tight text-[#0B1F3A] leading-snug">
                {active.cbtTitle}
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {active.cbtBody}
              </p>
            </div>

            <div className="pt-5 border-t border-slate-200/90 flex items-center justify-between gap-3">
              <span className="landing-mono text-xs font-medium text-[#0B1F3A]">
                {active.cbtMetric}
              </span>
              <Link
                href={active.cbtHref}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0D9488] hover:text-[#0F766E] transition-colors shrink-0"
              >
                Launch
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Bottom 3-Column Asymmetric Trio */}
          {active.bottomCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0B1F3A]/30 p-7 flex flex-col justify-between gap-6 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs landing-mono text-slate-400">
                    <span>{card.index}</span>
                    <div className="w-9 h-9 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="landing-display mt-4 text-lg font-bold text-[#0B1F3A]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B1F3A] hover:text-[#0D9488] transition-colors self-start"
                >
                  {card.cta}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Video,
  FileCheck2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import teacherPosterImg from "@/assets/images/teacher_live_poster_1794609390527.jpg";
import heroNigeriaImg from "@/assets/images/hero_nigeria_classroom_1794609390157.jpg";

type PortalTab = "teachers" | "parents";

const portalContent: Record<
  PortalTab,
  {
    kicker: string;
    title: string;
    description: string;
    image: typeof teacherPosterImg;
    imageAlt: string;
    highlights: { label: string; detail: string; icon: typeof Video }[];
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  }
> = {
  teachers: {
    kicker: "Educator Studio & Control Room",
    title: "Conduct disciplined live lessons, publish topic videos, and track cohorts",
    description:
      "Verified Nigerian educators teach from a calm broadcast room where students stay as avatars until granted stage permission—complete with attendance logs and video publishing.",
    image: teacherPosterImg,
    imageAlt: "Verified Learnova educator preparing live classroom materials",
    highlights: [
      {
        label: "Stage & Hand Moderation",
        detail: "Approve individual learners to speak on video with one click.",
        icon: ShieldCheck,
      },
      {
        label: "Topic Video Studio",
        detail: "Upload custom lessons or curated explainers per term & topic.",
        icon: Video,
      },
      {
        label: "Automated Attendance",
        detail: "Capture live WAT session attendance & class notes cleanly.",
        icon: ClipboardList,
      },
    ],
    primaryCta: { label: "Apply as a Teacher", href: "/register/teacher" },
    secondaryCta: { label: "Teacher Log In", href: "/login" },
  },
  parents: {
    kicker: "Parent & Guardian Visibility Portal",
    title: "Follow your child's attendance, exam readiness, and term reports anytime",
    description:
      "Parents link directly to their ward's Learnova account to review live class attendance, timed CBT scores, Naira subscription receipts, and downloadable PDF report cards.",
    image: heroNigeriaImg,
    imageAlt: "Nigerian secondary school student studying in a guided classroom",
    highlights: [
      {
        label: "Link Ward Accounts",
        detail: "Monitor one or multiple children from one guardian portal.",
        icon: Users,
      },
      {
        label: "Live Attendance & Scores",
        detail: "See WAEC continuous assessment averages and quiz results.",
        icon: CheckCircle2,
      },
      {
        label: "Official PDF Report Cards",
        detail: "Download term summaries without waiting for open day.",
        icon: FileCheck2,
      },
    ],
    primaryCta: { label: "Create Parent Account", href: "/register/parent" },
    secondaryCta: { label: "Parent Log In", href: "/login" },
  },
};

export default function RolePortalsShowcase() {
  const [activeTab, setActiveTab] = useState<PortalTab>("teachers");
  const current = portalContent[activeTab];

  return (
    <section
      id="portals"
      className="bg-[#F5F3FF] bg-learnova-dots-lavender py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header + Role Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
              06 · Built For Teachers &amp; Parents Too
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0B1230] leading-tight">
              Dedicated workspaces for educators and families
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Select Teacher or Parent portal"
            className="inline-flex rounded-xl bg-white p-1.5 border border-[#E4E1F5] shadow-xs self-start lg:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "teachers"}
              onClick={() => setActiveTab("teachers")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "teachers"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0B1230]"
              }`}
            >
              <GraduationCap size={16} />
              For Teachers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "parents"}
              onClick={() => setActiveTab("parents")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "parents"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0B1230]"
              }`}
            >
              <Users size={16} />
              For Parents
            </button>
          </div>
        </div>

        {/* Active Portal Feature Card */}
        <div className="learnova-ambient-stage-soft rounded-3xl">
        <div className="rounded-3xl bg-white border border-[#E4E1F5] shadow-sm shadow-indigo-950/5 overflow-hidden grid lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 min-w-0 relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[400px] w-full bg-[#0B1230]">
            <Image
              key={activeTab}
              src={current.image}
              alt={current.imageAlt}
              fill
              loading="eager"
              placeholder="blur"
              sizes="(max-width: 1024px) 100vw, 42vw"
              referrerPolicy="no-referrer"
              className="object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/85 via-[#070D24]/25 to-transparent" />
            <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5">
              <p className="landing-mono text-[11px] uppercase tracking-wider text-[#22D3EE]">
                {current.kicker}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0 p-5 sm:p-9 flex flex-col justify-between gap-7">
            <div className="space-y-4">
              <h3 className="landing-display text-2xl sm:text-3xl font-bold text-[#0B1230] leading-snug">
                {current.title}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {current.description}
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                {current.highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-[#FAF8FF] border border-[#E4E1F5] p-4 space-y-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <p className="text-xs font-bold text-[#0B1230]">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-5 border-t border-[#E4E1F5] flex flex-wrap items-center gap-3">
              <Link
                href={current.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] text-white px-5 py-3 text-xs sm:text-sm font-bold transition-all"
              >
                {current.primaryCta.label}
                <ArrowUpRight size={15} />
              </Link>
              <Link
                href={current.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] hover:bg-[#EDE9FE] text-[#1E1B4B] px-5 py-3 text-xs sm:text-sm font-semibold transition-colors"
              >
                {current.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

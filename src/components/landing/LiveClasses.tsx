"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ArrowRight, Radio, ArrowUpRight } from "lucide-react";
import teacherStudioImg from "@/assets/images/teacher_broadcast_studio_1794668570885.jpg";

interface ClassSession {
  id: string;
  subject: string;
  topic: string;
  teacher: string;
  avatar: string;
  time: string;
  students: number;
  status: "LIVE NOW" | "TODAY";
  mode: string;
}

const classes: ClassSession[] = [
  {
    id: "math-001",
    subject: "Mathematics · SSS 2",
    topic: "Quadratic Equations & Parabola Graphs",
    teacher: "Mrs. Funke Adewale",
    avatar: "/images/avatar-funke.jpg",
    time: "10:00 AM – 11:00 AM WAT",
    students: 38,
    status: "LIVE NOW",
    mode: "Audio-First + Glass Board",
  },
  {
    id: "science-001",
    subject: "Physics · SSS 2",
    topic: "Newton's Laws of Motion & Momentum",
    teacher: "Mr. Chinedu Emeka",
    avatar: "/images/avatar-chinedu.jpg",
    time: "01:00 PM – 02:00 PM WAT",
    students: 34,
    status: "TODAY",
    mode: "Vector Force Diagrams",
  },
  {
    id: "chemistry-001",
    subject: "Chemistry · SSS 3",
    topic: "Hydrocarbons & WAEC Volumetric Analysis",
    teacher: "Dr. Ibrahim Bello",
    avatar: "/images/avatar-ibrahim.jpg",
    time: "03:30 PM – 04:30 PM WAT",
    students: 41,
    status: "TODAY",
    mode: "Practical Titration Prep",
  },
];

type FilterTab = "all" | "live" | "today";

export default function LiveClasses() {
  const [filter, setFilter] = useState<FilterTab>("all");

  const visibleClasses = classes.filter((item) => {
    if (filter === "live") return item.status === "LIVE NOW";
    if (filter === "today") return item.status === "TODAY";
    return true;
  });

  const featuredClass = classes[0];

  return (
    <section
      id="live"
      className="bg-[#F8FAFC] bg-architectural-grid-light py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header + Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#0D9488]">
              Interactive Virtual Classrooms
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-[#0B1F3A]">
              Structured live lessons in real time
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              role="tablist"
              aria-label="Filter live schedule"
              className="inline-flex rounded-xl bg-white p-1 border border-slate-200"
            >
              {(
                [
                  { id: "all", label: "All Sessions" },
                  { id: "live", label: "Live Now" },
                  { id: "today", label: "Later Today" },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? "bg-[#0B1F3A] text-white"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <Link
              href="/live-classes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A] hover:text-[#0D9488] transition-colors whitespace-nowrap shrink-0"
            >
              View full timetable
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Asymmetric Broadcast Stage + Schedule Stack */}
        <div className="mt-10 grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 5-Col Teacher Broadcast Spotlight */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-[#0B1F3A] text-white border border-[#143258] flex flex-col justify-between">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={teacherStudioImg}
                alt="Nigerian physics and mathematics educator presenting vector equations on an illuminated glass board"
                fill
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/20 to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold text-white bg-[#07162B]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/15">
                <Radio size={14} className="text-[#2DD4BF]" />
                <span>LIVE BROADCAST STUDIO</span>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between text-xs landing-mono text-[#2DD4BF]">
                <span>{featuredClass.subject}</span>
                <span>{featuredClass.students} seated</span>
              </div>
              <h3 className="landing-display text-xl font-bold text-white leading-snug">
                {featuredClass.topic}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hosted by {featuredClass.teacher} · {featuredClass.mode} ·{" "}
                {featuredClass.time}
              </p>
              <Link
                href={`/live-classes/${featuredClass.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] py-3 text-xs font-bold text-white transition-colors"
              >
                Enter Live Classroom
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right 7-Col Timetable List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {visibleClasses.map((item) => {
              const isLive = item.status === "LIVE NOW";
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-[#0B1F3A]/30 transition-colors"
                >
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                      <span className="text-[#0B1F3A]">{item.subject}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 landing-mono ${
                          isLive ? "text-[#0D9488]" : "text-slate-500"
                        }`}
                      >
                        {isLive && <Radio size={13} />}
                        {item.status}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500 font-medium">
                        {item.mode}
                      </span>
                    </div>

                    <h3 className="landing-display text-lg font-bold text-[#0F1F38] leading-snug">
                      {item.topic}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <Image
                            src={item.avatar}
                            alt={item.teacher}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-[#0F1F38]">
                          {item.teacher}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 landing-mono">
                        <Clock size={13} className="text-[#0D9488]" />
                        {item.time}
                      </span>

                      <span className="inline-flex items-center gap-1 landing-mono">
                        <Users size={13} className="text-slate-400" />
                        {item.students}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/live-classes/${item.id}`}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                      isLive
                        ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                        : "bg-[#F1F4F8] hover:bg-slate-200 text-[#0B1F3A]"
                    }`}
                  >
                    {isLive ? "Enter Live" : "View Room"}
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
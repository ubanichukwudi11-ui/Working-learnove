"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Radio,
  Hand,
  Mic,
  Video,
  Check,
  X,
  Users,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import teacherStudioImg from "@/assets/images/teacher_broadcast_studio_1794668570885.jpg";
import heroNigeriaImg from "@/assets/images/hero_nigeria_classroom_1794609390157.jpg";

interface CohortParticipant {
  id: string;
  name: string;
  initials: string;
  seatColor: string;
  handRaised: boolean;
}

const initialParticipants: CohortParticipant[] = [
  { id: "p1", name: "Toluwani A.", initials: "TA", seatColor: "bg-[#7C3AED]", handRaised: false },
  { id: "p2", name: "Chidi N.", initials: "CN", seatColor: "bg-[#4F46E5]", handRaised: true },
  { id: "p3", name: "Amina Y.", initials: "AY", seatColor: "bg-[#06B6D4]", handRaised: false },
  { id: "p4", name: "Kelechi O.", initials: "KO", seatColor: "bg-[#0D9488]", handRaised: false },
  { id: "p5", name: "Zainab M.", initials: "ZM", seatColor: "bg-[#6D28D9]", handRaised: false },
];

const todayTimetable = [
  {
    id: "math-001",
    subject: "Mathematics · SSS 2",
    topic: "Quadratic Equations & Parabola Graphs",
    teacher: "Mrs. Funke Adewale",
    avatar: "/images/avatar-funke.jpg",
    time: "10:00 AM WAT",
    live: true,
  },
  {
    id: "science-001",
    subject: "Physics · SSS 2",
    topic: "Newton's Laws & Momentum",
    teacher: "Mr. Chinedu Emeka",
    avatar: "/images/avatar-chinedu.jpg",
    time: "01:00 PM WAT",
    live: false,
  },
  {
    id: "chemistry-001",
    subject: "Chemistry · SSS 3",
    topic: "Volumetric Analysis & Titration",
    teacher: "Dr. Ibrahim Bello",
    avatar: "/images/avatar-ibrahim.jpg",
    time: "03:30 PM WAT",
    live: false,
  },
];

export default function LiveClasses() {
  const [participants, setParticipants] = useState(initialParticipants);
  const [approvedStudentId, setApprovedStudentId] = useState<string | null>(null);

  const raisedStudents = participants.filter((p) => p.handRaised);
  const activeStageStudent = participants.find((p) => p.id === approvedStudentId) || null;

  const toggleHand = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, handRaised: !p.handRaised } : p
      )
    );
    if (approvedStudentId === id) {
      setApprovedStudentId(null);
    }
  };

  const approveStudent = (id: string) => {
    setApprovedStudentId(id);
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, handRaised: false } : p))
    );
  };

  return (
    <section
      id="live-classes"
      className="relative overflow-hidden bg-gradient-to-br from-[#070D24] via-[#0F1642] to-[#1A1347] text-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 15%, rgba(124, 58, 237, 0.2), transparent 42%), radial-gradient(circle at 88% 85%, rgba(6, 182, 212, 0.14), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#22D3EE]">
              02 · Moderated Live Classrooms
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white leading-tight">
              Teacher-led broadcasts built for calm, orderly participation
            </h2>
            <p className="mt-3 text-indigo-100/80 text-base leading-relaxed">
              The teacher&apos;s feed stays front and center while students join
              as lightweight profile avatars by default. Learners raise a hand to
              speak, and their live camera unlocks only once the teacher approves.
            </p>
          </div>

          <Link
            href="/live-classes"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap self-start lg:self-auto"
          >
            View Live Timetable
            <ArrowUpRight size={16} className="text-[#22D3EE]" />
          </Link>
        </div>

        {/* Interactive Classroom Stage + Moderation & Schedule */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7-Col Interactive Stage Simulation */}
          <div className="lg:col-span-7 min-w-0 learnova-ambient-stage rounded-3xl border border-indigo-400/25 bg-[#0A1030] p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5 shadow-2xl shadow-black/35">
            {/* Main Teacher Video Feed + Clean Status Footer */}
            <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#070D24]">
              <div className="relative aspect-[16/10] sm:aspect-[16/9]">
                <Image
                  src={teacherStudioImg}
                  alt="Teacher broadcasting live lesson from Learnova studio"
                  fill
                  loading="eager"
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/70 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-[#070D24]/85 border border-white/15 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold">
                  <Radio size={13} className="text-[#22D3EE] shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-none">
                    Teacher · Mrs. Funke Adewale
                  </span>
                </div>

                {/* Approved Student Live Video Feed (Appears ONLY after teacher approval) */}
                {activeStageStudent && (
                  <div className="absolute top-3 right-3 z-10 w-24 sm:w-40 rounded-xl overflow-hidden border-2 border-[#22D3EE] bg-[#131A42] shadow-2xl">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={heroNigeriaImg}
                        alt={`${activeStageStudent.name} speaking on live classroom stage`}
                        fill
                        loading="eager"
                        placeholder="blur"
                        sizes="160px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D24]/85 via-transparent to-transparent" />
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-white">
                        <span className="truncate">{activeStageStudent.name}</span>
                        <span className="inline-flex items-center gap-1 text-[#22D3EE] shrink-0">
                          <Video size={10} />
                          <Mic size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-3.5 py-2.5 bg-[#090F2B] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="landing-mono text-[11px] sm:text-xs text-[#C4B5FD]">
                  {activeStageStudent
                    ? `Stage Unlocked: ${activeStageStudent.name} is speaking with live video`
                    : "Bandwidth Mode: Teacher Video + Student Profile Avatars"}
                </span>
                {activeStageStudent && (
                  <button
                    type="button"
                    onClick={() => setApprovedStudentId(null)}
                    className="rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1 text-[11px] font-semibold text-white shrink-0"
                  >
                    Return to Seat
                  </button>
                )}
              </div>
            </div>

            {/* Seated Students Profile Pictures Strip + Interactive Raise Hand Demo */}
            <div className="rounded-2xl bg-[#0E163D] border border-white/10 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-indigo-100 flex items-start sm:items-center gap-2">
                  <ShieldCheck size={14} className="text-[#22D3EE] mt-0.5 sm:mt-0 shrink-0" />
                  <span>Seated Learners (Profile Avatars by Default — Click to Raise Hand)</span>
                </p>
                <span className="landing-mono text-[11px] text-indigo-300 shrink-0">
                  {raisedStudents.length} hand raised
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {participants.map((p) => {
                  const isOnStage = approvedStudentId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleHand(p.id)}
                      className={`rounded-xl p-2.5 border text-left transition-all flex items-center gap-2 min-w-0 ${
                        isOnStage
                          ? "bg-[#06B6D4]/15 border-[#22D3EE] text-white"
                          : p.handRaised
                          ? "bg-[#7C3AED]/20 border-[#A78BFA] text-white"
                          : "bg-[#070D24]/70 border-white/10 text-indigo-100/85 hover:border-white/25"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${p.seatColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                      >
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{p.name}</p>
                        <p className="text-[10px] text-indigo-300 flex items-center gap-1 leading-tight mt-0.5">
                          {p.handRaised && !isOnStage && (
                            <Hand size={10} className="text-[#22D3EE] shrink-0" />
                          )}
                          <span className="truncate">
                            {isOnStage
                              ? "Video Live"
                              : p.handRaised
                              ? "Hand Raised"
                              : "Avatar Only"}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Teacher Approval Queue Bar */}
              <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {raisedStudents.length > 0 ? (
                  <>
                    <p className="text-xs text-[#C4B5FD]">
                      <strong className="text-white">
                        {raisedStudents[0].name}
                      </strong>{" "}
                      raised a hand to speak on camera
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveStudent(raisedStudents[0].id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070D24] px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        <Check size={13} />
                        Approve Video &amp; Mic
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleHand(raisedStudents[0].id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-100"
                      >
                        <X size={13} />
                        Dismiss
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-indigo-200/75">
                    Click any student avatar above to test raising a hand and
                    granting teacher stage approval.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right 5-Col WAT Schedule & Classroom Rules */}
          <div className="lg:col-span-5 min-w-0 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              {todayTimetable.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-[#0E163D]/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 transition-colors ${
                    item.live
                      ? "learnova-ambient-stage-soft border-[#22D3EE]/40 hover:border-[#22D3EE]/70"
                      : "border-indigo-400/20 hover:border-[#7C3AED]/50"
                  }`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs landing-mono">
                      <span className="text-[#C4B5FD] font-semibold">
                        {item.subject}
                      </span>
                      <span className="text-indigo-500" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={
                          item.live ? "text-[#22D3EE] font-semibold" : "text-indigo-300"
                        }
                      >
                        {item.live ? "LIVE NOW" : "SCHEDULED"}
                      </span>
                    </div>

                    <h3 className="landing-display text-base font-bold text-white leading-snug">
                      {item.topic}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200/80">
                      <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/20 shrink-0">
                          <Image
                            src={item.avatar}
                            alt={item.teacher}
                            fill
                            sizes="24px"
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        </div>
                        <span>{item.teacher}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 landing-mono text-[11px]">
                        <Clock size={12} className="text-[#22D3EE]" />
                        {item.time}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/live-classes/${item.id}`}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap shrink-0 self-start sm:self-auto transition-colors ${
                      item.live
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                        : "bg-white/10 hover:bg-white/15 text-indigo-100"
                    }`}
                  >
                    {item.live ? "Enter Live" : "Preview"}
                  </Link>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-indigo-400/20 bg-[#0A1030] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE]">
                <Users size={15} />
                <span>Capacity-Bounded Cohort Groups</span>
              </div>
              <p className="text-xs text-indigo-100/80 leading-relaxed">
                Large cohorts are automatically balanced into focused groups of
                up to 50 learners with automated attendance tracking and low-data
                audio modes for smooth 3G/4G playback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
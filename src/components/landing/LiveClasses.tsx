"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ArrowRight, Radio } from "lucide-react";

const classes = [
  {
    id: "math-001",
    subject: "Mathematics · SSS 2",
    topic: "Quadratic Equations & Parabola Graphs",
    teacher: "Mrs. Funke Adewale",
    avatar: "/images/avatar-funke.jpg",
    time: "10:00 AM – 11:00 AM WAT",
    students: 38,
    status: "LIVE NOW",
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
  },
];

export default function LiveClasses() {
  return (
    <section id="live" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">
              Interactive Virtual Classrooms
            </p>
            <h2
              className="mt-2 text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Attend structured live lessons in real time
            </h2>
          </div>
          <Link
            href="/live-classes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A] hover:text-[#0D9488] transition shrink-0"
          >
            View full timetable
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {classes.map((item) => {
            const isLive = item.status === "LIVE NOW";
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="text-[#0B1F3A]">{item.subject}</span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isLive ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {isLive && <Radio size={13} />}
                      {item.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-[#0F1F38] leading-snug">
                    {item.topic}
                  </h3>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={item.avatar}
                        alt={item.teacher}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-[#0F1F38]">{item.teacher}</p>
                      <p className="text-slate-500">Lead Instructor</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} className="text-[#0D9488]" />
                      {item.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} className="text-slate-400" />
                      {item.students}
                    </span>
                  </div>

                  <Link
                    href={`/live-classes/${item.id}`}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition ${
                      isLive
                        ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                        : "bg-[#F1F4F8] hover:bg-slate-200 text-[#0B1F3A]"
                    }`}
                  >
                    {isLive ? "Enter Live Classroom" : "View Class Room"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
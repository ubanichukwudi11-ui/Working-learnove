"use client";

import Image from "next/image";
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative bg-[#FAF8F3] border-b border-slate-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">
            JSS 1 – SSS 3 · WAEC, NECO & JAMB Readiness
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#0B1F3A] leading-[1.08]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Structured digital schooling built for Nigerian learners.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
            Attend real-time live classes with experienced Nigerian educators,
            prepare systematically for WAEC, NECO and JAMB, submit assignments,
            and get instant step-by-step guidance from Nova AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button href="/register" variant="primary" size="lg">
              Create Free Account
              <ArrowRight size={17} />
            </Button>
            <Button href="/live-classes" variant="outline" size="lg">
              <PlayCircle size={17} className="text-[#0D9488]" />
              Explore Live Classes
            </Button>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0D9488]" />
              NERDC Curriculum Aligned
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0D9488]" />
              Low-Data Audio-First Live Mode
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0D9488]" />
              Africa/Lagos (WAT) Timetable
            </span>
          </div>
        </div>

        {/* Right Editorial Classroom Photograph */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl aspect-[16/10]">
            <Image
              src="/images/hero-classroom.jpg"
              alt="Nigerian secondary school students collaborating with a teacher in a digital classroom"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
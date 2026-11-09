"use client";

import Link from "next/link";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  GraduationCap,
  BrainCircuit,
  Video,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#030712]">

      {/* Background */}

      <div className="absolute inset-0">

        <div className="absolute left-0 top-0 h-[450px] w-[450px] rounded-full bg-cyan-500/20 blur-[140px]" />

        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[170px]" />

        <div className="absolute left-1/2 top-40 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />

      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24">

        {/* LEFT */}

        <div className="w-full lg:w-1/2">

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">

            <Sparkles size={16} />

            AI Powered Learning Platform

          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-white md:text-7xl">

            Learn

            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">

              Smarter.

            </span>

            Grow Faster.

          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400">

            Learnova combines AI tutoring,
            live classes, smart notes,
            assignments and real-time
            analytics into one beautiful
            learning experience.

          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <Link
              href="/register"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold text-white transition hover:scale-105"
            >
              Start Learning

              <ArrowRight size={18} />
            </Link>

            <button
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-slate-700
                px-8
                py-4
                text-white
                transition
                hover:bg-slate-900
              "
            >
              <PlayCircle size={20} />

              Watch Demo

            </button>

          </div>

          <div className="mt-14 grid grid-cols-3 gap-5">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <GraduationCap className="mb-4 text-cyan-400" />

              <h3 className="text-3xl font-bold text-white">

                25K+

              </h3>

              <p className="mt-2 text-sm text-slate-400">

                Students

              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <BrainCircuit className="mb-4 text-violet-400" />

              <h3 className="text-3xl font-bold text-white">

                AI

              </h3>

              <p className="mt-2 text-sm text-slate-400">

                Personal Tutor

              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <Video className="mb-4 text-blue-400" />

              <h3 className="text-3xl font-bold text-white">

                Live

              </h3>

              <p className="mt-2 text-sm text-slate-400">

                Interactive Classes

              </p>

            </div>

          </div>

        </div>
        
        {/* RIGHT */}

        <div className="relative mt-20 hidden w-1/2 lg:mt-0 lg:flex lg:justify-end">

          {/* Glow */}

          <div className="absolute right-10 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />

          {/* Dashboard */}

          <div className="relative w-[560px] rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">

            {/* Window Header */}

            <div className="mb-6 flex items-center justify-between">

              <div className="flex gap-2">

                <div className="h-3 w-3 rounded-full bg-red-500" />

                <div className="h-3 w-3 rounded-full bg-yellow-500" />

                <div className="h-3 w-3 rounded-full bg-green-500" />

              </div>

              <span className="text-sm text-slate-500">

                Learnova Dashboard

              </span>

            </div>

            {/* Upcoming Class */}

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-cyan-300">

                    LIVE CLASS

                  </p>

                  <h3 className="mt-2 text-xl font-bold text-white">

                    Physics - Motion

                  </h3>

                  <p className="mt-1 text-slate-400">

                    Starts in 12 minutes

                  </p>

                </div>

                <button className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white">

                  Join

                </button>

              </div>

            </div>

            {/* Grid */}

            <div className="mt-6 grid grid-cols-2 gap-5">

              {/* Nova */}

              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

                <p className="text-sm text-cyan-400">

                  Nova AI

                </p>

                <h4 className="mt-2 text-lg font-semibold text-white">

                  Ask Anything

                </h4>

                <p className="mt-3 text-sm text-slate-400">

                  Explain Newton's Laws in simple terms.

                </p>

              </div>

              {/* Attendance */}

              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

                <p className="text-sm text-violet-400">

                  Attendance

                </p>

                <h2 className="mt-3 text-4xl font-black text-white">

                  98%

                </h2>

                <p className="mt-2 text-sm text-slate-400">

                  Excellent performance

                </p>

              </div>

              {/* Notes */}

              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

                <p className="text-sm text-blue-400">

                  Smart Notes

                </p>

                <ul className="mt-4 space-y-2 text-sm text-slate-300">

                  <li>✓ Mechanics</li>

                  <li>✓ Algebra</li>

                  <li>✓ Chemistry</li>

                </ul>

              </div>

              {/* Progress */}

              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

                <p className="text-sm text-emerald-400">

                  Weekly Progress

                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">

                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />

                </div>

                <p className="mt-3 text-sm text-slate-400">

                  82% completed

                </p>

              </div>

            </div>

            {/* Bottom Card */}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0F172A] p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-400">

                    Today's Study Time

                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">

                    3h 45m

                  </h2>

                </div>

                <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400">

                  +25%

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Floating Badges */}

        <div className="absolute -left-10 top-16 hidden rounded-2xl border border-slate-800 bg-slate-900/90 px-5 py-4 shadow-xl xl:block">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            AI Tutor
          </p>

          <h4 className="mt-1 text-lg font-semibold text-white">
            Nova is Online
          </h4>

          <p className="mt-2 text-sm text-cyan-400">
            Ready to help 24/7
          </p>
        </div>

        <div className="absolute -right-8 bottom-10 hidden rounded-2xl border border-slate-800 bg-slate-900/90 px-5 py-4 shadow-xl xl:block">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Success Rate
          </p>

          <h2 className="mt-1 text-3xl font-black text-white">
            98%
          </h2>

          <p className="mt-2 text-sm text-emerald-400">
            Students improving weekly
          </p>
        </div>

      </div>

      {/* Trusted By */}

      <div className="relative border-t border-slate-800/60 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-10 px-6 py-8 text-sm font-medium tracking-wide text-slate-500">

          <span>AI Powered</span>

          <span>•</span>

          <span>Live Classes</span>

          <span>•</span>

          <span>Smart Notes</span>

          <span>•</span>

          <span>Assignments</span>

          <span>•</span>

          <span>Analytics</span>

          <span>•</span>

          <span>Parent Portal</span>

        </div>
      </div>

    </section>
  );
}
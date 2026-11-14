"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Check,
  Calculator,
  Camera,
  Layers,
  RotateCw,
  ArrowRight,
  BookmarkPlus,
} from "lucide-react";
import novaStudyTabletImg from "@/assets/images/nova_study_tablet_1794668570169.jpg";

type DemoTab = "solver" | "snap" | "flashcards";

export default function NovaShowcase() {
  const [activeTab, setActiveTab] = useState<DemoTab>("solver");
  const [flipped, setFlipped] = useState(false);

  return (
    <section
      id="nova-ai"
      className="relative overflow-hidden bg-[#F5F3FF] bg-learnova-dots-lavender py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-5 min-w-0 space-y-6">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
            03 · Nova AI Educational Assistant
          </p>

          <h2 className="landing-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] leading-[1.12] text-[#0B1230]">
            Ask any question, unpack tough concepts, and study smarter
          </h2>

          <p className="text-slate-600 text-base leading-relaxed">
            Nova sits right beside your video lessons and Notebook. Upload a
            photo of handwritten working, get step-by-step derivations instead
            of bare answers, and convert explanations into revision flashcards.
          </p>

          <ul className="space-y-3 text-sm text-[#1E1B4B] pt-1">
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#6D28D9] mt-0.5 shrink-0" />
              <span>
                Step-by-step explanations aligned with NERDC &amp; WAEC marking
                schemes
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#0891B2] mt-0.5 shrink-0" />
              <span>
                Multimodal Snap &amp; Solve for handwritten equations and science
                diagrams
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#4F46E5] mt-0.5 shrink-0" />
              <span>
                One-click Save to Notebook &amp; instant flashcard deck
                generation
              </span>
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/nova"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] text-white px-6 py-3.5 text-sm font-bold shadow-md shadow-[#7C3AED]/20 transition-all"
            >
              <Sparkles size={16} />
              Open Nova AI Workspace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/notebook"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6FE] bg-white hover:bg-[#FAF8FF] text-[#1E1B4B] px-5 py-3.5 text-sm font-semibold transition-colors"
            >
              View Study Notebook
            </Link>
          </div>
        </div>

        {/* Right Interactive Mini-Classroom Studio */}
        <div className="lg:col-span-7 min-w-0">
          <div className="rounded-3xl bg-[#0B1230] border border-indigo-900/60 shadow-2xl shadow-indigo-950/20 overflow-hidden text-white">
            {/* Studio Top Switcher Bar */}
            <div className="border-b border-white/10 bg-[#070D24] px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "solver"}
                  onClick={() => setActiveTab("solver")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === "solver"
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                      : "text-indigo-200/80 hover:bg-white/5"
                  }`}
                >
                  <Calculator size={14} />
                  Step-by-Step Solver
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "snap"}
                  onClick={() => setActiveTab("snap")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === "snap"
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                      : "text-indigo-200/80 hover:bg-white/5"
                  }`}
                >
                  <Camera size={14} />
                  Snap &amp; Solve
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "flashcards"}
                  onClick={() => {
                    setActiveTab("flashcards");
                    setFlipped(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === "flashcards"
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                      : "text-indigo-200/80 hover:bg-white/5"
                  }`}
                >
                  <Layers size={14} />
                  Study Flashcards
                </button>
              </div>

              <span className="landing-mono text-[11px] text-[#22D3EE]">
                SSS 2 · WAEC Prep
              </span>
            </div>

            {/* Interactive Tab Panels */}
            <div className="p-5 sm:p-7 min-h-[330px] flex flex-col justify-between">
              {activeTab === "solver" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="landing-mono text-[11px] uppercase tracking-wider text-[#22D3EE]">
                      Student Question
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-white">
                      How do I find the vertex and roots of{" "}
                      <span className="landing-mono text-[#C4B5FD]">
                        y = x² - 6x + 8
                      </span>{" "}
                      for WAEC theory?
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#070D24] border border-[#7C3AED]/40 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="landing-mono text-[11px] uppercase tracking-wider text-[#C4B5FD]">
                        Nova Guided Breakdown
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#22D3EE] whitespace-nowrap">
                        <BookmarkPlus size={13} />
                        Save to Notebook
                      </span>
                    </div>
                    <ol className="space-y-2 text-sm text-indigo-100/90 leading-relaxed list-decimal list-inside">
                      <li>
                        Factorize to locate the roots:{" "}
                        <span className="landing-mono text-white">
                          (x - 2)(x - 4) = 0 → x = 2 or x = 4
                        </span>
                        .
                      </li>
                      <li>
                        Compute symmetry axis{" "}
                        <span className="landing-mono text-white">
                          h = -b / 2a = 6 / 2 = 3
                        </span>
                        .
                      </li>
                      <li>
                        Substitute{" "}
                        <span className="landing-mono text-white">x = 3</span>:{" "}
                        <span className="landing-mono text-white">
                          y = 9 - 18 + 8 = -1
                        </span>
                        . Turning point is{" "}
                        <span className="landing-mono text-[#22D3EE]">
                          (3, -1)
                        </span>
                        .
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === "snap" && (
                <div className="grid sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-6 min-w-0 relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white/15 bg-[#070D24]">
                    <Image
                      src={novaStudyTabletImg}
                      alt="Handwritten math equation scanned beside digital parabola plot"
                      fill
                      loading="eager"
                      placeholder="blur"
                      sizes="(max-width: 640px) 100vw, 340px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="sm:col-span-6 min-w-0 space-y-3">
                    <p className="landing-mono text-[11px] uppercase tracking-wider text-[#22D3EE]">
                      Vision Extraction Complete
                    </p>
                    <h3 className="landing-display text-lg font-bold text-white">
                      Detected Equation &amp; Curve Sketch
                    </h3>
                    <p className="text-xs text-indigo-100/80 leading-relaxed">
                      Nova reads pencil notebook working directly from camera
                      uploads, verifies each algebraic line, and catches sign
                      errors before submission.
                    </p>
                    <div className="rounded-lg bg-[#070D24] border border-white/10 px-3.5 py-2.5 landing-mono text-xs text-[#C4B5FD]">
                      Check Step 2: Δ = (-6)² - 4(1)(8) = 4 &gt; 0
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "flashcards" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-indigo-200">
                    <span className="landing-mono text-[#22D3EE]">
                      SSS 2 Physics · Card 1 of 5
                    </span>
                    <button
                      type="button"
                      onClick={() => setFlipped((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C4B5FD] hover:text-white transition-colors"
                    >
                      <RotateCw size={13} />
                      {flipped ? "Show Question" : "Flip Card for Answer"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFlipped((v) => !v)}
                    className="w-full text-left rounded-xl bg-[#070D24] border border-[#7C3AED]/45 hover:border-[#22D3EE] p-7 min-h-[190px] flex flex-col justify-between transition-colors"
                  >
                    <span className="landing-mono text-[11px] uppercase tracking-wider text-[#22D3EE]">
                      {flipped ? "Marking-Scheme Definition" : "Prompt Question"}
                    </span>
                    <p className="landing-display text-lg sm:text-xl font-bold text-white leading-snug">
                      {flipped
                        ? "F = ma — The rate of change of linear momentum of a body is directly proportional to the applied force and acts in the direction of the force."
                        : "State Newton's Second Law of Motion and write its mathematical expression for constant mass."}
                    </p>
                    <span className="text-xs text-indigo-300">
                      Click card to flip
                    </span>
                  </button>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-200/80">
                <span>Grounded in Nigerian SSS &amp; JSS syllabi</span>
                <Link
                  href="/nova"
                  className="font-semibold text-[#22D3EE] hover:underline"
                >
                  Try with your own question →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
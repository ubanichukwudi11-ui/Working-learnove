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
      id="nova"
      className="relative overflow-hidden bg-[#07162B] text-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-architectural-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-[#0D9488]/15 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-5 space-y-6">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#F59E0B]">
            Nova AI Classroom Companion
          </p>

          <h2 className="landing-display text-3xl sm:text-4xl font-bold tracking-[-0.025em] leading-[1.1] text-white">
            Guided revision that explains the &ldquo;why&rdquo; behind every
            solution.
          </h2>

          <p className="text-slate-300 text-base leading-relaxed">
            Built like a patient subject teacher inside your Notebook. Upload
            a snapshot of tricky WAEC theory questions, generate instant recall
            flashcards, or drill topics right beside your video lessons.
          </p>

          <ul className="space-y-3 text-sm text-slate-200 pt-1">
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#2DD4BF] mt-0.5 shrink-0" />
              <span>
                Step-by-step derivations aligned with NERDC &amp; WAEC marking
                schemes
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#2DD4BF] mt-0.5 shrink-0" />
              <span>
                Multimodal Snap &amp; Solve for handwritten maths &amp; physics
                diagrams
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={16} className="text-[#2DD4BF] mt-0.5 shrink-0" />
              <span>
                One-click Save to Notebook &amp; interactive study flashcard
                generation
              </span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href="/nova"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#07162B] px-6 py-3.5 text-sm font-bold transition-colors"
            >
              <Sparkles size={16} />
              Open Nova AI Workspace
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right Interactive Mini-Classroom Studio */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-[#0D213D] border border-white/15 shadow-2xl overflow-hidden">
            {/* Studio Top Switcher Bar */}
            <div className="border-b border-white/10 bg-[#0A1B33] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "solver"}
                  onClick={() => setActiveTab("solver")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === "solver"
                      ? "bg-[#0D9488] text-white"
                      : "text-slate-300 hover:bg-white/5"
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
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === "snap"
                      ? "bg-[#0D9488] text-white"
                      : "text-slate-300 hover:bg-white/5"
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
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === "flashcards"
                      ? "bg-[#0D9488] text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Layers size={14} />
                  Study Flashcards
                </button>
              </div>

              <span className="landing-mono text-[11px] text-slate-400">
                SSS 2 · WAEC Prep
              </span>
            </div>

            {/* Interactive Tab Panels */}
            <div className="p-6 sm:p-7 min-h-[320px] flex flex-col justify-between">
              {activeTab === "solver" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/6 border border-white/10 p-4">
                    <p className="landing-mono text-[11px] uppercase tracking-wider text-[#2DD4BF]">
                      Student Prompt
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-white">
                      How do I find the vertex and roots of{" "}
                      <span className="landing-mono text-[#F59E0B]">
                        y = x² - 6x + 8
                      </span>{" "}
                      for WAEC theory?
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#07162B] border border-[#0D9488]/40 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="landing-mono text-[11px] uppercase tracking-wider text-[#F59E0B]">
                        Nova Guided Breakdown
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2DD4BF]">
                        <BookmarkPlus size={13} />
                        Saved to Notebook
                      </span>
                    </div>
                    <ol className="space-y-2 text-sm text-slate-200 leading-relaxed list-decimal list-inside">
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
                        <span className="landing-mono text-[#F59E0B]">
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
                  <div className="sm:col-span-6 relative aspect-[4/3] rounded-xl overflow-hidden border border-white/15">
                    <Image
                      src={novaStudyTabletImg}
                      alt="Handwritten notebook math equation scanned beside digital parabola plot"
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="sm:col-span-6 space-y-3">
                    <p className="landing-mono text-[11px] uppercase tracking-wider text-[#2DD4BF]">
                      Vision Extraction Complete
                    </p>
                    <h3 className="landing-display text-lg font-bold text-white">
                      Detected Equation &amp; Curve Sketch
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Nova reads pencil notebook working directly from camera
                      uploads, verifies each algebraic line, and flags sign
                      mistakes before exam submission.
                    </p>
                    <div className="rounded-lg bg-[#07162B] border border-white/10 px-3.5 py-2.5 landing-mono text-xs text-[#F59E0B]">
                      Check Step 2: Discriminant Δ = (-6)² - 4(1)(8) = 4 &gt; 0
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "flashcards" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="landing-mono text-[#2DD4BF]">
                      SSS 2 Physics · Card 1 of 5
                    </span>
                    <button
                      type="button"
                      onClick={() => setFlipped((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors"
                    >
                      <RotateCw size={13} />
                      {flipped ? "Show Question" : "Flip Card for Answer"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFlipped((v) => !v)}
                    className="w-full text-left rounded-xl bg-[#07162B] border border-[#0D9488]/40 hover:border-[#2DD4BF] p-7 min-h-[190px] flex flex-col justify-between transition-colors"
                  >
                    <span className="landing-mono text-[11px] uppercase tracking-wider text-[#F59E0B]">
                      {flipped ? "Marking-Scheme Definition" : "Prompt Question"}
                    </span>
                    <p className="landing-display text-lg sm:text-xl font-bold text-white leading-snug">
                      {flipped
                        ? "F = ma — The rate of change of linear momentum of a body is directly proportional to the applied force and acts in the direction of the force."
                        : "State Newton's Second Law of Motion and write its mathematical expression for constant mass."}
                    </p>
                    <span className="text-xs text-slate-400">
                      Click card to flip
                    </span>
                  </button>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>Grounded in Nigerian SSS &amp; JSS syllabi</span>
                <Link
                  href="/nova"
                  className="font-semibold text-[#2DD4BF] hover:underline"
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
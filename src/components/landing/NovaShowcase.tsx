"use client";

import Button from "@/components/ui/Button";
import { Sparkles, Check } from "lucide-react";

export default function NovaShowcase() {
  return (
    <section id="nova" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0B1F3A] text-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
            Nova AI Tutor
          </p>
          <h2
            className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Guided revision that explains the &ldquo;why&rdquo; behind every solution.
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Whether preparing for WAEC Mathematics theory or revising Organic Chemistry at night, Nova breaks complex topics into clear steps and generates targeted practice questions.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-2.5">
              <Check size={16} className="text-[#0D9488]" />
              Step-by-step worked examples aligned with SSS syllabi
            </li>
            <li className="flex items-center gap-2.5">
              <Check size={16} className="text-[#0D9488]" />
              Generates quick 5-question WAEC & JAMB drills on demand
            </li>
            <li className="flex items-center gap-2.5">
              <Check size={16} className="text-[#0D9488]" />
              Connected directly inside Notebook and Live Classrooms
            </li>
          </ul>

          <div className="mt-8">
            <Button href="/nova" variant="amber" size="lg">
              <Sparkles size={17} />
              Open Nova AI Workspace
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-[#102A4C] border border-white/15 p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-white/10">
            <span className="font-semibold text-white">Nova Study Session · SSS 2 Mathematics</span>
            <span>WAT · Live Tutor</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-teal-300">Student</p>
            <p className="mt-1 text-sm text-white">
              How do I find the vertex and roots of y = x² - 6x + 8 for WAEC theory?
            </p>
          </div>

          <div className="bg-[#0B1F3A] border border-teal-400/30 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-[#F59E0B]">Nova AI</p>
            <p className="text-sm text-slate-200 leading-relaxed">
              1. Factorize to find roots: x² - 6x + 8 = (x - 2)(x - 4) = 0, so x = 2 or x = 4.
              <br />
              2. Find vertex x-coordinate: h = -b / (2a) = 6 / 2 = 3.
              <br />
              3. Substitute x = 3: y = 3² - 6(3) + 8 = -1. Vertex is (3, -1).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
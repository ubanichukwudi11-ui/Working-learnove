"use client";

import { BookOpen, ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import type { NovaChatMode, NovaPersona } from "@backend/ai/geminiClient";

type StarterCard = {
  title: string;
  subtitle: string;
  prompt: string;
  mode: NovaChatMode;
  persona?: NovaPersona;
  icon: typeof BookOpen;
};

type Props = {
  subjectFocus?: string;
  onSelect: (prompt: string, suggestedMode?: NovaChatMode, suggestedPersona?: NovaPersona) => void;
};

export default function SuggestedPrompts({ subjectFocus, onSelect }: Props) {
  const focus = subjectFocus && subjectFocus !== "All Subjects" ? subjectFocus : "Mathematics";

  const cards: StarterCard[] = [
    {
      title: "Explain a Classroom Topic",
      subtitle: `Step-by-step ${focus} breakdown with relatable Nigerian examples`,
      prompt: `Explain a core WAEC ${focus} topic step-by-step with clear formulas and two worked examples.`,
      mode: "deep",
      persona: "tutor",
      icon: BookOpen,
    },
    {
      title: "WAEC & JAMB Practice Drill",
      subtitle: `4 exam-style ${focus} questions with marking scheme answers`,
      prompt: `Set 4 JAMB/WAEC practice questions on ${focus} (mix of objectives and short theory) with full marking scheme explanations at the end.`,
      mode: "general",
      persona: "quiz_master",
      icon: ClipboardCheck,
    },
    {
      title: "Notebook Revision Sheet",
      subtitle: `Concise formulas, definitions & common pitfalls ready to save`,
      prompt: `Create a structured one-page revision guide for ${focus} suitable for saving in my study notebook, highlighting definitions and exam traps.`,
      mode: "fast",
      persona: "stem_coach",
      icon: FileText,
    },
    {
      title: "Classroom Lesson Plan & Rubric",
      subtitle: `45-minute interactive lesson outline for teachers & study groups`,
      prompt: `Draft a 45-minute classroom lesson plan on ${focus} with learning objectives, a starter activity, guided practice, and homework questions.`,
      mode: "general",
      persona: "tutor",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            type="button"
            onClick={() => onSelect(card.prompt, card.mode, card.persona)}
            className="text-left rounded-2xl border border-[#E4E1F5] bg-white hover:border-[#7C3AED] hover:bg-[#FAF8FF] p-4 transition flex items-start gap-3.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FAF8FF] border border-[#DCD7F5] group-hover:bg-[#F5F3FF] group-hover:border-[#C4B5FD] flex items-center justify-center shrink-0 transition">
              <Icon size={17} className="text-[#4F46E5] group-hover:text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0B1230]">{card.title}</p>
              <p className="text-xs text-[#4A5073] mt-0.5 leading-relaxed">
                {card.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import {
  Bot,
  Sparkles,
  MessageCircle,
  ArrowRight,
} from "lucide-react";


export default function NovaSubjectAssistant() {
  return (
    <div className="mt-8 learnova-banner-dark bg-architectural-grid-dark rounded-2xl border border-white/10 p-6 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Bot size={22} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
            Nova AI Insight
          </p>
          <h2 className="landing-display text-xl font-bold">
            Your Personal Learning Assistant
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white/10 border border-white/10 p-5">
        <div className="flex items-center gap-2 text-[#22D3EE] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={15} />
          Recommendation
        </div>

        <p className="mt-2.5 text-base text-indigo-50 leading-relaxed">
          I noticed you need more practice with <strong className="text-white">Algebra equations</strong>. Try a quick 10 minute revision session.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white px-5 py-2.5 text-sm font-semibold transition">
          Start Revision
          <ArrowRight size={16} />
        </button>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 text-sm font-semibold transition">
          <MessageCircle size={16} />
          Ask Nova
        </button>
      </div>
    </div>
  );
}
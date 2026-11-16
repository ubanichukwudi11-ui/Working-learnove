"use client";

import { motion } from "framer-motion";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LearnovaSplash() {
  return (
    <main className="relative min-h-screen bg-[#070D24] bg-architectural-grid-dark flex items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-[#06B6D4]/15 blur-3xl" />

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/20 flex items-center justify-center text-white shadow-2xl shadow-[#4F46E5]/30"
        >
          <GraduationCap size={44} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="landing-display mt-7 text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
        >
          Learnova
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-sm font-medium text-[#22D3EE]"
        >
          Digital Learning Campus · Powered by Nova AI
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-indigo-200/80"
        >
          <Loader2 size={14} className="text-[#22D3EE] animate-spin" />
          Preparing your learning space...
        </motion.div>
      </div>
    </main>
  );
}
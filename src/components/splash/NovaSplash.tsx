"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const letters = "LEARNOVA".split("");

export default function NovaSplash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#070D24] bg-architectural-grid-dark flex items-center justify-center">
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        className="absolute inset-0 origin-right bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] z-20"
      />

      <div className="pointer-events-none absolute w-[520px] h-[520px] rounded-full bg-[#4F46E5]/25 blur-[140px]" />
      <div className="pointer-events-none absolute w-[420px] h-[420px] rounded-full bg-[#06B6D4]/15 blur-[140px]" />

      <div className="relative z-30 flex flex-col items-center">
        <div className="flex">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.06 }}
              className="landing-display text-4xl sm:text-5xl md:text-7xl font-black tracking-wider text-white"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-4 text-[#22D3EE] tracking-[0.28em] uppercase text-xs font-semibold"
        >
          Digital Learning Campus
        </motion.p>

        <div className="mt-9 w-72 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.8 }}
            className="h-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#22D3EE]"
          />
        </div>
      </div>
    </div>
  );
}
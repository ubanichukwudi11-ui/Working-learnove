"use client";

import { motion } from "framer-motion";

export default function LearnovaSplash() {
  return (
    <main
      className="
      min-h-screen
      bg-[#0F172A]
      flex
      items-center
      justify-center
      overflow-hidden
      "
    >
      <div className="text-center">
        <motion.div
          initial={{
            scale: 0,
            rotate: -180,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            rotate: 0,
            opacity: 1,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="
          w-32
          h-32
          mx-auto
          rounded-3xl
          bg-gradient-to-br
          from-purple-600
          to-cyan-500
          flex
          items-center
          justify-center
          text-5xl
          font-bold
          text-white
          shadow-2xl
          "
        >
          N
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.7,
            duration: 0.5,
          }}
          className="
          mt-8
          text-5xl
          font-bold
          text-white
          "
        >
          Learnova
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.1,
          }}
          className="
          mt-2
          text-slate-400
          "
        >
          Powered by Nova AI
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.5,
          }}
          className="
          mt-10
          text-purple-300
          "
        >
          Preparing your learning space...
        </motion.div>
      </div>
    </main>
  );
}
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
    <div
      className="
      fixed
      inset-0
      overflow-hidden
      bg-[#020617]
      flex
      items-center
      justify-center
      "
    >
      {/* Liquid Reveal */}

      <motion.div
        initial={{
          scaleX: 1,
        }}
        animate={{
          scaleX: 0,
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        className="
        absolute
        inset-0
        origin-right
        bg-gradient-to-r
        from-purple-700
        via-purple-500
        to-cyan-500
        z-20
        "
      />

      {/* Purple Glow */}

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
        absolute
        w-[600px]
        h-[600px]
        rounded-full
        bg-purple-600
        blur-[150px]
        "
      />

      {/* Cyan Glow */}

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="
        absolute
        w-[500px]
        h-[500px]
        rounded-full
        bg-cyan-500
        blur-[150px]
        "
      />

      {/* Particles */}

      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
          }}
          className="
          absolute
          w-1.5
          h-1.5
          rounded-full
          bg-cyan-400
          "
          style={{
            left: `${(i * 11) % 100}%`,
            top: `${(i * 7) % 100}%`,
          }}
        />
      ))}

      {/* Content */}

      <div
        className="
        relative
        z-30
        flex
        flex-col
        items-center
        "
      >
        {/* Logo */}

        <div className="flex">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.5 + index * 0.08,
              }}
              className="
              text-5xl
              md:text-7xl
              font-black
              tracking-wider
              text-white
              "
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 1.3,
          }}
          className="
          mt-5
          text-slate-300
          tracking-[0.3em]
          uppercase
          text-xs
          "
        >
          AI Learning Platform
        </motion.p>

        {/* Loading Bar */}

        <div
          className="
          mt-10
          w-72
          h-1.5
          bg-slate-800
          rounded-full
          overflow-hidden
          "
        >
          <motion.div
            initial={{
              width: 0,
            }}
            animate={{
              width: "100%",
            }}
            transition={{
              duration: 3,
            }}
            className="
            h-full
            bg-gradient-to-r
            from-purple-500
            via-fuchsia-500
            to-cyan-500
            "
          />
        </div>
      </div>
    </div>
  );
}
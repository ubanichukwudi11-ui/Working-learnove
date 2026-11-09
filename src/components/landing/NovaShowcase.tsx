"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function NovaShowcase() {
  return (
    <section className="py-28 px-6 bg-[#111827]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{opacity:0,x:-40}}
          whileInView={{opacity:1,x:0}}
          viewport={{once:true}}
        >
          <span className="text-cyan-400 font-semibold">
            Meet Nova AI
          </span>

          <h2 className="text-5xl font-black mt-4">
            Your Personal AI Teacher
          </h2>

          <p className="mt-6 text-slate-400 text-lg leading-8">
            Ask questions anytime, generate quizzes,
            summarize notes, explain difficult topics,
            create flashcards and prepare for exams
            with Learnova's intelligent assistant.
          </p>

          <div className="mt-8">
            <Button size="lg">
              Try Nova AI
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{opacity:0,x:40}}
          whileInView={{opacity:1,x:0}}
          viewport={{once:true}}
        >
          <Card className="p-8 space-y-6">
            <div className="bg-slate-800 rounded-xl p-5">
              <p className="text-slate-400 text-sm">
                Student
              </p>

              <p className="mt-2">
                Explain Photosynthesis in simple words.
              </p>
            </div>

            <div className="bg-violet-600 rounded-xl p-5">
              <p className="text-violet-200 text-sm">
                Nova AI
              </p>

              <p className="mt-2 leading-7">
                Plants make their own food using
                sunlight, water and carbon dioxide.
                This process is called photosynthesis.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-5">
              <h4 className="font-bold">
                Quick Quiz
              </h4>

              <ul className="mt-4 space-y-2 text-slate-300">
                <li>✅ What gas do plants absorb?</li>
                <li>✅ What is chlorophyll?</li>
                <li>✅ Why is sunlight important?</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
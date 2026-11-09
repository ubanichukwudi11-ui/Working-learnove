"use client";

import { motion } from "framer-motion";
import {
  Bot,
  BookOpen,
  Video,
  BarChart3,
  NotebookPen,
  Trophy,
} from "lucide-react";
import Card from "@/components/ui/Card";

const features = [
  {
    icon: Bot,
    title: "Nova AI",
    description:
      "Your personal AI tutor that explains concepts, answers questions and generates quizzes.",
  },
  {
    icon: Video,
    title: "Live Classes",
    description:
      "Attend live interactive lessons with teachers from anywhere.",
  },
  {
    icon: BookOpen,
    title: "Smart Learning",
    description:
      "Organized subjects, lessons and resources in one place.",
  },
  {
    icon: NotebookPen,
    title: "Digital Notebook",
    description:
      "Save notes, summaries and AI-generated explanations.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track performance, strengths and areas that need improvement.",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Earn XP, badges and certificates as you complete your learning goals.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-28 px-6 bg-[#0F172A]"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{opacity:0,y:30}}
          whileInView={{opacity:1,y:0}}
          transition={{duration:.6}}
          viewport={{once:true}}
          className="text-center"
        >
          <h2 className="text-4xl font-black">
            Everything You Need
          </h2>

          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Learnova combines artificial intelligence,
            live learning and analytics into one
            beautiful platform.
          </p>
        </motion.div>

        <div className="grid gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{opacity:0,y:40}}
                whileInView={{opacity:1,y:0}}
                transition={{
                  duration:.5,
                  delay:index*.1
                }}
                viewport={{once:true}}
              >
                <Card
                  hover
                  className="p-8 h-full"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center">
                    <Icon size={28}/>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold">
                    {feature.title}
                  </h3>

                  <p className="mt-4 text-slate-400 leading-7">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
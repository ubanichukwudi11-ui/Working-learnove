"use client";

import { motion } from "framer-motion";

const stats = [
  {
    number:"50K+",
    label:"Students"
  },
  {
    number:"800+",
    label:"Teachers"
  },
  {
    number:"120+",
    label:"Schools"
  },
  {
    number:"1M+",
    label:"AI Questions Answered"
  }
];

export default function Statistics() {
  return (
    <section className="py-24 bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat,index)=>(
          <motion.div
            key={stat.label}
            initial={{opacity:0,y:30}}
            whileInView={{opacity:1,y:0}}
            transition={{
              delay:index*.1
            }}
            viewport={{once:true}}
            className="text-center"
          >
            <h2 className="text-5xl font-black bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
              {stat.number}
            </h2>

            <p className="mt-4 text-slate-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
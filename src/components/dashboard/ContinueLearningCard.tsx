"use client";

import {
  Atom,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";


export default function ContinueLearningCard() {

  return (
    <div
      className="
      relative
      overflow-hidden
      bg-[#111827]
      border
      border-slate-800
      rounded-2xl
      pp-5
      sm:p-6
      mt-8
      group
      hover:border-purple-500/40
      transition-all
      duration-300
      "
    >

      {/* Background Glow */}

      <div
        className="
        absolute
        -right-20
        -top-20
        w-60
        h-60
        bg-purple-600/20
        blur-3xl
        rounded-full
        "
      />


      <div className="relative z-10">


        {/* Header */}

        <div className="flex justify-between items-start">


          <div>

            <p className="text-slate-400 text-sm">
              Continue Learning
            </p>


            <h2
              className="
              text-3xl
              font-bold
              mt-3
              "
            >
              Physics
            </h2>


            <p
              className="
              text-slate-400
              mt-1
              "
            >
              Motion and Forces
            </p>

          </div>



          <div
            className="
            w-14
            h-14
            rounded-2xl
            bg-purple-500/20
            flex
            items-center
            justify-center
            "
          >

            <Atom
              size={32}
              className="text-purple-400"
            />

          </div>


        </div>




        {/* Progress */}

        <div className="mt-7">


          <div
            className="
            flex
            justify-between
            text-sm
            mb-2
            "
          >

            <span className="text-slate-400">
              Progress
            </span>


            <span>
              62%
            </span>


          </div>



          <div
            className="
            h-3
            bg-slate-800
            rounded-full
            overflow-hidden
            "
          >

            <div
              className="
              h-full
              w-[62%]
              rounded-full
              bg-gradient-to-r
              from-[#6D28D9]
              to-[#06B6D4]
              animate-pulse
              "
            />

          </div>


        </div>





        {/* Lesson Info */}

        <div
          className="
          mt-6
          p-4
          rounded-xl
          bg-slate-900/60
          border
          border-slate-800
          "
        >

          <p
            className="
            text-sm
            text-slate-400
            "
          >
            Next Lesson
          </p>


          <p className="font-semibold mt-1">
            Newton's Laws of Motion
          </p>


        </div>





        {/* Badges */}

        <div
          className="
          flex
          flex-wrap
          gap-3
          mt-5
          "
        >

          <div
            className="
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-full
            bg-purple-500/20
            text-purple-300
            text-sm
            "
          >

            <Sparkles size={16}/>

            +120 XP

          </div>




          <div
            className="
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-full
            bg-cyan-500/20
            text-cyan-300
            text-sm
            "
          >

            <Clock size={16}/>

            15 min left

          </div>


        </div>





        {/* Button */}

        <button
          className="
          mt-6
          flex
          items-center
          gap-2
          px-6
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-[#6D28D9]
          to-[#06B6D4]
          font-semibold
          hover:scale-[1.02]
          transition
          "
        >

          Continue Learning

          <ArrowRight size={18}/>

        </button>


      </div>


    </div>
  );
}
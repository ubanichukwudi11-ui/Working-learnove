"use client";

import {
  Sparkles,
  Flame,
  BookOpenCheck,
  TrendingUp,
} from "lucide-react";


const stats = [
  {
    title: "XP Earned",
    value: "1,250",
    icon: Sparkles,
    color: "purple",
  },

  {
    title: "Study Streak",
    value: "7 Days",
    icon: Flame,
    color: "orange",
  },

  {
    title: "Lessons Completed",
    value: "42",
    icon: BookOpenCheck,
    color: "cyan",
  },

  {
    title: "Weekly Progress",
    value: "78%",
    icon: TrendingUp,
    color: "green",
  },
];



export default function QuickStats() {


  return (

    <div
      className="
      grid
      grid-cols-2
      lg:grid-cols-4
      gap-4
      mt-6
      "
    >

      {stats.map((stat)=>{

        const Icon = stat.icon;


        return (

          <div
            key={stat.title}
            className="
            bg-[#111827]
            border
            border-slate-800
            rounded-2xl
            p-5
            hover:-translate-y-1
            hover:border-slate-700
            transition-all
            duration-300
            "
          >

            <div
              className="
              flex
              justify-between
              items-start
              "
            >

              <div
                className="
                w-11
                h-11
                rounded-2xl
                bg-gradient-to-r
                from-[#6D28D9]
                to-[#06B6D4]
                flex
                items-center
                justify-center
                "
              >

                <Icon
                  size={22}
                  className="text-white"
                />

              </div>


            </div>



            <p
              className="
              text-slate-400
              text-sm
              mt-5
              "
            >
              {stat.title}
            </p>



            <h3
              className="
              text-2xl
              font-bold
              mt-2
              "
            >
              {stat.value}
            </h3>


          </div>

        )

      })}


    </div>

  );

}
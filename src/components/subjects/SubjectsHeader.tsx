"use client";


import {
Search,
SlidersHorizontal,
} from "lucide-react";



export default function SubjectsHeader() {
  return (
    <section className="mb-8">
      <div>
        <h1 className="landing-display text-3xl font-extrabold text-[#0B1230]">
          My Subjects
        </h1>
        <p className="text-[#43466E] mt-1.5 text-sm">
          Continue your learning journey with Nova.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex items-center gap-3 bg-white border border-[#DCD7F5] focus-within:border-[#7C3AED] rounded-xl px-4 py-2.5 flex-1 transition">
          <Search size={18} className="text-[#6B6F94] shrink-0" />
          <input
            placeholder="Search subjects..."
            className="bg-transparent outline-none w-full text-sm text-[#0B1230] placeholder:text-[#6B6F94]"
          />
        </div>

        <button className="w-11 h-11 rounded-xl bg-white border border-[#DCD7F5] text-[#43466E] flex items-center justify-center hover:bg-[#FAF8FF] hover:text-[#4F46E5] transition shrink-0">
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </section>
  );
}
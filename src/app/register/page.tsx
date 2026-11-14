"use client";

import Link from "next/link";
import { GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import Logo from "@/components/branding/Logo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F5F4FB] bg-learnova-dots-lavender flex flex-col justify-center px-5 sm:px-6 py-12">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo href="/" variant="learnova" />
        </div>

        <div className="text-center mb-10">
          <h1 className="landing-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1230]">
            Create Your Learnova Account
          </h1>
          <p className="mt-2 text-sm text-[#43466E] max-w-xl mx-auto">
            Select your academic role to access live Nigerian classrooms, study notebooks, and progress reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/register/student"
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 shadow-xs hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#4F46E5]/8 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-[#4F46E5]/20">
                <GraduationCap size={24} />
              </div>
              <h2 className="landing-display mt-5 text-xl font-extrabold text-[#0B1230]">
                Student
              </h2>
              <p className="mt-2 text-xs text-[#43466E] leading-relaxed">
                Join live JSS &amp; SSS classes, practice WAEC &amp; JAMB CBT drills, study with Nova AI, and manage class notes.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#6D28D9]">
              Create Student Account
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>

          <Link
            href="/register/teacher"
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 shadow-xs hover:border-[#4F46E5] hover:shadow-lg hover:shadow-[#4F46E5]/8 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B1230] to-[#151A44] text-[#22D3EE] flex items-center justify-center shadow-md shadow-[#0B1230]/15">
                <BookOpen size={24} />
              </div>
              <h2 className="landing-display mt-5 text-xl font-extrabold text-[#0B1230]">
                Teacher
              </h2>
              <p className="mt-2 text-xs text-[#43466E] leading-relaxed">
                Host interactive live classrooms, manage cohort assignments, publish lesson notes, and track attendance.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#4F46E5]">
              Apply as Teacher
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>

          <Link
            href="/register/parent"
            className="group rounded-2xl border border-[#E4E1F5] bg-white p-7 shadow-xs hover:border-[#06B6D4] hover:shadow-lg hover:shadow-[#06B6D4]/8 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0891B2] to-[#06B6D4] text-white flex items-center justify-center shadow-md shadow-[#06B6D4]/20">
                <Users size={24} />
              </div>
              <h2 className="landing-display mt-5 text-xl font-extrabold text-[#0B1230]">
                Parent / Guardian
              </h2>
              <p className="mt-2 text-xs text-[#43466E] leading-relaxed">
                Monitor your child&apos;s term attendance, continuous assessment scores, and upcoming WAT class timetable.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#0891B2]">
              Create Parent Account
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-xs text-[#43466E]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#6D28D9] hover:text-[#4F46E5] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
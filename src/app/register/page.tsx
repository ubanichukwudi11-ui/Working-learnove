"use client";

import Link from "next/link";
import { GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import Logo from "@/components/branding/Logo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            Create Your Learnova Account
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Select your academic role to access live Nigerian classrooms, study notebooks, and progress reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/register/student"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-[#0D9488] transition flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-[#0B1F3A]">Student</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Join live JSS &amp; SSS classes, practice WAEC &amp; JAMB CBT drills, study with Nova AI, and manage class notes.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#0D9488]">
              Create Student Account
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>

          <Link
            href="/register/teacher"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-[#0B1F3A] transition flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0B1F3A]/10 text-[#0B1F3A] flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-[#0B1F3A]">Teacher</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Host interactive live classrooms, manage cohort assignments, publish lesson notes, and track attendance.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#0B1F3A]">
              Apply as Teacher
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>

          <Link
            href="/register/parent"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-[#D97706] transition flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                <Users size={24} />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-[#0B1F3A]">Parent / Guardian</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Monitor your child&apos;s term attendance, continuous assessment scores, and upcoming WAT class timetable.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#D97706]">
              Create Parent Account
              <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition" size={15} />
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0D9488] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
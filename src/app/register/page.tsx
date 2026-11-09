"use client";

import Link from "next/link";

import {
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-6xl">

        <div className="text-center mb-14">

          <h1 className="text-5xl font-bold text-white">
            Create Your Learnova Account
          </h1>

          <p className="mt-5 text-slate-400 text-lg">
            Choose the type of account you want to create.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-3">

          {/* STUDENT */}

          <Link
            href="/register/student"
            className="
              group
              rounded-3xl
              border
              border-slate-800
              bg-[#111827]
              p-8
              transition
              hover:border-cyan-500
              hover:-translate-y-1
            "
          >

            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center">

              <GraduationCap
                className="text-cyan-400"
                size={32}
              />

            </div>

            <h2 className="mt-8 text-2xl font-bold text-white">
              Student
            </h2>

            <p className="mt-4 text-slate-400 leading-7">
              Join live classes,
              study with Nova AI,
              take quizzes,
              complete assignments,
              and monitor your learning progress.
            </p>

            <div className="mt-8 flex items-center text-cyan-400 font-semibold">

              Create Student Account

              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition"
                size={18}
              />

            </div>

          </Link>

          {/* TEACHER */}

          <Link
            href="/register/teacher"
            className="
              group
              rounded-3xl
              border
              border-slate-800
              bg-[#111827]
              p-8
              transition
              hover:border-purple-500
              hover:-translate-y-1
            "
          >

            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">

              <BookOpen
                className="text-purple-400"
                size={32}
              />

            </div>

            <h2 className="mt-8 text-2xl font-bold text-white">
              Teacher
            </h2>

            <p className="mt-4 text-slate-400 leading-7">
              Teach students,
              upload lessons,
              host live classes,
              manage assignments,
              and earn through Learnova.
            </p>

            <div className="mt-8 flex items-center text-purple-400 font-semibold">

              Apply as Teacher

              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition"
                size={18}
              />

            </div>

          </Link>

                    {/* PARENT */}

          <Link
            href="/register/parent"
            className="
              group
              rounded-3xl
              border
              border-slate-800
              bg-[#111827]
              p-8
              transition
              hover:border-emerald-500
              hover:-translate-y-1
            "
          >

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">

              <Users
                className="text-emerald-400"
                size={32}
              />

            </div>

            <h2 className="mt-8 text-2xl font-bold text-white">
              Parent
            </h2>

            <p className="mt-4 text-slate-400 leading-7">
              Monitor your child's learning,
              view attendance,
              receive performance reports,
              and communicate with teachers.
            </p>

            <div className="mt-8 flex items-center text-emerald-400 font-semibold">

              Create Parent Account

              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition"
                size={18}
              />

            </div>

          </Link>

        </div>

        <div className="mt-14 text-center">

          <p className="text-slate-400">

            Already have an account?{" "}

            <Link
              href="/login"
              className="
                font-semibold
                text-cyan-400
                hover:text-cyan-300
              "
            >
              Sign In
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}
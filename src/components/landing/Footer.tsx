"use client";

import Link from "next/link";
import Logo from "@/components/branding/Logo";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-white border-t border-slate-200 py-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            Nigerian digital school platform uniting live classrooms,
            NERDC-aligned subjects, video lessons, CBT prep, and Nova AI
            tutoring.
          </p>
          <p className="mt-3 landing-mono text-xs text-slate-500">
            Lagos · Abuja · Port Harcourt · WAT (UTC+1)
          </p>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-[#0B1F3A]">
            Platform
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>
              <Link
                href="/live-classes"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Live Classes
              </Link>
            </li>
            <li>
              <Link
                href="/videos"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Video Lessons
              </Link>
            </li>
            <li>
              <Link
                href="/subjects"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                JSS &amp; SSS Subjects
              </Link>
            </li>
            <li>
              <Link
                href="/assignments"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                WAEC &amp; JAMB CBT
              </Link>
            </li>
            <li>
              <Link
                href="/nova"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Nova AI Tutor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-[#0B1F3A]">
            Portals
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>
              <Link
                href="/register/student"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Student Sign Up
              </Link>
            </li>
            <li>
              <Link
                href="/register/teacher"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Teacher Onboarding
              </Link>
            </li>
            <li>
              <Link
                href="/register/parent"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Parent Portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-[#0B1F3A]">
            Support
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>
              <Link
                href="/login"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Account Sign In
              </Link>
            </li>
            <li>
              <Link
                href="/forgot-password"
                className="hover:text-[#0B1F3A] transition-colors"
              >
                Reset Password
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          © {new Date().getFullYear()} Learnova Education Technologies. All
          rights reserved.
        </span>
        <span>Built for Nigerian learners and schools</span>
      </div>
    </footer>
  );
}
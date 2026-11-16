"use client";

import Link from "next/link";
import Logo from "@/components/branding/Logo";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-[#070D24] text-indigo-100 border-t border-indigo-950 py-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <Logo dark variant="learnova" />
          <p className="mt-4 text-sm text-indigo-200/75 leading-relaxed">
            Modern digital school ecosystem uniting structured video lessons,
            moderated live classrooms, Nova AI tutoring, CBT practice, and
            term analytics.
          </p>
          <p className="mt-3 landing-mono text-xs text-[#22D3EE]">
            Lagos · Abuja · Port Harcourt · WAT (UTC+1)
          </p>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-white">
            Platform
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-indigo-200/75">
            <li>
              <Link
                href="/videos"
                className="hover:text-white transition-colors"
              >
                Video Lessons
              </Link>
            </li>
            <li>
              <Link
                href="/live-classes"
                className="hover:text-white transition-colors"
              >
                Live Classrooms
              </Link>
            </li>
            <li>
              <Link
                href="/nova"
                className="hover:text-white transition-colors"
              >
                Nova AI Assistant
              </Link>
            </li>
            <li>
              <Link
                href="/assignments?tab=cbt"
                className="hover:text-white transition-colors"
              >
                WAEC &amp; JAMB CBT
              </Link>
            </li>
            <li>
              <Link
                href="/analytics"
                className="hover:text-white transition-colors"
              >
                Progress &amp; Report Cards
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-white">
            Portals
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-indigo-200/75">
            <li>
              <Link
                href="/register/student"
                className="hover:text-white transition-colors"
              >
                Student Sign Up
              </Link>
            </li>
            <li>
              <Link
                href="/register/teacher"
                className="hover:text-white transition-colors"
              >
                Teacher Application
              </Link>
            </li>
            <li>
              <Link
                href="/register/parent"
                className="hover:text-white transition-colors"
              >
                Parent / Guardian Portal
              </Link>
            </li>
            <li>
              <Link
                href="/subjects"
                className="hover:text-white transition-colors"
              >
                JSS 1 – SSS 3 Curriculum
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="landing-display text-sm font-bold text-white">
            Account &amp; Access
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-indigo-200/75">
            <li>
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Log In
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="hover:text-white transition-colors"
              >
                Get Started
              </Link>
            </li>
            <li>
              <Link
                href="/forgot-password"
                className="hover:text-white transition-colors"
              >
                Reset Password
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-300/70">
        <span>
          © 2026 Learnova Education Technologies. All rights reserved.
        </span>
        <span>Built for Nigerian learners, educators, and families</span>
      </div>
    </footer>
  );
}
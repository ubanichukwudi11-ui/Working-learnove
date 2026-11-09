"use client";

import Image from "next/image";

export default function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border-r border-slate-800 p-12 flex-col justify-between">

      <div>
        <Image
          src="/images/logo.png"
          alt="Learnova"
          width={220}
          height={70}
          priority
        />

        <h1 className="mt-10 text-5xl font-extrabold leading-tight">
          Learn.
          <br />
          Grow.
          <br />
          Achieve.
        </h1>

        <p className="mt-6 text-slate-400 text-lg max-w-lg leading-8">
          Africa's intelligent learning platform powered by
          Artificial Intelligence.
        </p>
      </div>

      <div className="space-y-5">

        <Feature text="🎥 Live Interactive Classes" />

        <Feature text="🤖 AI Tutor & AI Study Assistant" />

        <Feature text="📝 Smart Notes & Assignments" />

        <Feature text="📊 Learning Analytics" />

        <Feature text="🏆 Leaderboards & Achievements" />

        <Feature text="👨‍👩‍👧 Parent Monitoring Portal" />

      </div>

      <div className="text-sm text-slate-500">
        © {new Date().getFullYear()} Learnova.
        <br />
        Learn Smarter. Learn Better.
      </div>

    </div>
  );
}

function Feature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="w-2 h-2 rounded-full bg-cyan-400" />
      <span>{text}</span>
    </div>
  );
}
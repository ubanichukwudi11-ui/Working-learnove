"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Video,
  Users,
  Clock,
  Sparkles,
  Calendar,
  Play,
  Radio,
  BookOpen,
  ArrowRight,
  Shield,
  Plus,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { liveClasses, LiveClassItem } from "@/lib/liveClasses";
import { useAuth } from "@/context/AuthContext";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "live" | "scheduled">("all");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const featuredClass = liveClasses.find((c) => c.status === "live") || liveClasses[0];

  const filteredClasses = liveClasses.filter((c) => {
    if (filter === "live") return c.status === "live";
    if (filter === "scheduled") return c.status === "scheduled";
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Learnova Live Classes
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Real-Time WebRTC
              </span>
            </div>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Join interactive virtual classrooms with high-definition video, real-time screen sharing, live polls, collaborative whiteboard, and Nova AI assistant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/live-class/math-001"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-950/60 font-semibold text-xs shadow-md transition"
            >
              <span>👩‍🏫</span>
              <span>Host as Teacher</span>
            </Link>

            <Link
              href="/live-classes/math-001"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition active:scale-95"
            >
              <Video size={16} />
              <span>Join Active Room</span>
            </Link>
          </div>
        </div>

        {/* FEATURED BANNER: Mathematics Live Class (Matching Reference Design) */}
        {featuredClass && (
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170e34] via-[#101935] to-[#0d1527] border border-purple-500/30 p-6 md:p-8 shadow-2xl">
            <div className="relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    BROADCASTING LIVE NOW
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock size={13} />
                    00:23:17 Elapsed
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {featuredClass.title}
                  </h2>
                  <p className="text-purple-300 font-medium text-base mt-1">
                    {featuredClass.topic}
                  </p>
                </div>

                {/* Teacher & Students stats */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-400">
                      <Image
                        src={
                          featuredClass.teacherAvatar ||
                          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                        }
                        alt={featuredClass.teacher}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Instructor</span>
                      <span className="font-bold text-white">{featuredClass.teacher}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-cyan-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Connected</span>
                      <span className="font-bold text-white">{featuredClass.studentsCount} Students Online</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">AI Co-Pilot</span>
                      <span className="font-bold text-white">Nova AI Active</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Join as Student or Enter as Teacher */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={`/live-classes/${featuredClass.id}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/40 transition active:scale-95"
                  >
                    <Play size={15} fill="white" />
                    <span>Join Class (Student View)</span>
                  </Link>

                  <Link
                    href={`/teacher/live-class/${featuredClass.id}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition"
                  >
                    <span>Teacher Control Room</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right: Live Classroom Preview graphic */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14]/80 p-4 aspect-[16/10] hidden lg:flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-purple-300">Live Stream Stage</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    WebRTC Connected
                  </span>
                </div>

                <div className="my-auto text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/30 text-purple-400 border border-purple-500/40 mx-auto flex items-center justify-center">
                    <Radio size={24} className="animate-pulse" />
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Interactive Mathematics Lecture
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Parabolas, Cartesian graphing, and real-time live poll exercises.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Latency: ~32ms</span>
                  <span className="text-purple-300 font-bold">1080p 60fps</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Classrooms" },
              { id: "live", label: "Live Now 🔴" },
              { id: "scheduled", label: "Upcoming Classes" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === f.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {filteredClasses.length} Classes Available
          </span>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const isLive = cls.status === "live";

            return (
              <div
                key={cls.id}
                className="rounded-3xl bg-[#0c1222] border border-slate-800 p-6 flex flex-col justify-between space-y-5 hover:border-purple-500/40 transition group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-purple-300">
                      {cls.subject}
                    </span>

                    {isLive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        SCHEDULED
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition">
                      {cls.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {cls.topic}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-700">
                        <Image
                          src={
                            cls.teacherAvatar ||
                            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                          }
                          alt={cls.teacher}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-slate-300 font-medium truncate max-w-[120px]">
                        {cls.teacher}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users size={14} className="text-cyan-400" />
                      <span>{cls.studentsCount} Students</span>
                    </div>
                  </div>

                  {/* Join Classroom Button */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/live-classes/${cls.id}`}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center shadow-md shadow-purple-600/20 transition active:scale-95"
                    >
                      Join Student
                    </Link>
                    <Link
                      href={`/teacher/live-class/${cls.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold text-center transition"
                    >
                      Host Teacher
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
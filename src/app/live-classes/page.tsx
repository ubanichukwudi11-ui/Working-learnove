"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { LiveClassItem, liveClasses as fallbackClasses } from "@/lib/liveClasses";
import { CURRENT_ACADEMIC_TERM } from "@/lib/nigerianCurriculum";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  Users,
  Clock,
  Play,
  Plus,
  X,
  Wifi,
  BookOpen,
} from "lucide-react";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  const [classes, setClasses] = useState<LiveClassItem[]>(fallbackClasses);
  const [filter, setFilter] = useState<"all" | "live" | "scheduled">("all");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Schedule form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [classLevel, setClassLevel] = useState("SSS 2 Science");
  const [timeWat, setTimeWat] = useState("03:00 PM – 04:00 PM WAT");
  const [startNow, setStartNow] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/live-classes", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.classes)) {
          setClasses(data.classes);
        }
      } catch {
        // fallback stays visible
      }
    }
    load();
    const timer = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          topic: topic || "Interactive Term 2 Session",
          classLevel,
          timeWat,
          teacher: user?.fullName || "Mrs. Funke Adewale",
          startNow,
        }),
      });
      const data = await res.json();
      if (res.ok && data.classItem) {
        setClasses((prev) => [data.classItem, ...prev]);
        setIsScheduleOpen(false);
        setTitle("");
        setTopic("");
        if (startNow) {
          router.push(`/teacher/live-class/${data.classItem.id}`);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  const featuredClass = classes.find((c) => c.status === "live") || classes[0];
  const filteredClasses = classes.filter((c) => {
    if (filter === "live") return c.status === "live";
    if (filter === "scheduled") return c.status === "scheduled" || c.status === "waiting";
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM} · Africa/Lagos (WAT)
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Learnova Live Classrooms
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {isTeacher
                ? "Launch and manage your live lessons, review raised-hand requests onto the stage, and run interactive polls."
                : "Join your teacher's live lesson, download class guides, ask questions, and switch to Audio-Only Mode on low-data networks."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isTeacher && (
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold transition whitespace-nowrap"
              >
                <Plus size={15} />
                Schedule New Class
              </button>
            )}

            {featuredClass && (
              <Link
                href={
                  isTeacher
                    ? `/teacher/live-class/${featuredClass.id}`
                    : `/live-classes/${featuredClass.id}`
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
              >
                <Video size={15} />
                {isTeacher ? "Open Teacher Control Room" : "Join Active Class"}
              </Link>
            )}
          </div>
        </div>

        {/* Low-Bandwidth Friendly Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#0B1F3A]">
            <Wifi size={16} className="text-[#0D9488] shrink-0" />
            <span>
              <strong>Nigerian Bandwidth Optimization:</strong> Audio-First and 240p/360p stream modes are built into every classroom to save mobile data.
            </span>
          </div>
          <span className="text-slate-500 font-semibold whitespace-nowrap">
            Raised-Hand Stage Control Active
          </span>
        </div>

        {/* Featured Live Classroom */}
        {featuredClass && (
          <div className="rounded-2xl border border-slate-200 bg-[#0B1F3A] text-white overflow-hidden shadow-sm">
            <div className="grid lg:grid-cols-[1.2fr_0.9fr] items-stretch">
              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-teal-300 font-semibold">
                    <span>{featuredClass.status === "live" ? "Broadcasting Now" : "Next Scheduled Session"}</span>
                    <span>·</span>
                    <span>{featuredClass.classLevel}</span>
                    <span>·</span>
                    <span className="tabular-nums">{featuredClass.timeWat}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {featuredClass.title}
                  </h2>
                  <p className="text-sm text-slate-300">{featuredClass.topic}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/20 shrink-0">
                      <Image
                        src={featuredClass.teacherAvatar}
                        alt={featuredClass.teacher}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Instructor</span>
                      <span className="font-bold text-white">{featuredClass.teacher}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 tabular-nums">
                    <Users size={15} className="text-[#F59E0B]" />
                    <span>{featuredClass.studentsCount} students connected</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    href={
                      isTeacher
                        ? `/teacher/live-class/${featuredClass.id}`
                        : `/live-classes/${featuredClass.id}`
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition whitespace-nowrap"
                  >
                    <Play size={14} fill="currentColor" />
                    {isTeacher ? "Enter Host Classroom" : "Join Live Classroom"}
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[220px] lg:min-h-full bg-[#091529]">
                <Image
                  src={featuredClass.hostPoster}
                  alt={featuredClass.title}
                  fill
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/90 via-transparent to-transparent flex items-end p-5">
                  <div className="text-xs text-slate-200">
                    <p className="font-bold text-white">{featuredClass.examFocus}</p>
                    <p className="text-slate-300 mt-0.5">
                      Teacher video stage · Synced slides &amp; whiteboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200">
            {[
              { id: "all", label: "All Sessions" },
              { id: "live", label: "Live Now" },
              { id: "scheduled", label: "Upcoming" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filter === f.id
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {filteredClasses.length} classrooms available
          </span>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const isLive = cls.status === "live";
            const targetHref = isTeacher
              ? `/teacher/live-class/${cls.id}`
              : `/live-classes/${cls.id}`;

            return (
              <div
                key={cls.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-5 shadow-xs hover:border-[#0D9488] transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0D9488]">
                      {cls.subject} · {cls.classLevel}
                    </span>
                    <span className={isLive ? "text-emerald-700" : "text-[#D97706]"}>
                      {isLive ? "Live Now" : "Scheduled"}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#0B1F3A]">{cls.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{cls.topic}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <Image
                          src={cls.teacherAvatar}
                          alt={cls.teacher}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-semibold text-[#0B1F3A] truncate max-w-[140px]">
                        {cls.teacher}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 font-medium tabular-nums">
                      <Users size={13} className="text-[#0D9488]" />
                      {cls.studentsCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
                    <Clock size={12} />
                    <span>{cls.timeWat}</span>
                  </div>

                  <Link
                    href={targetHref}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition ${
                      isLive
                        ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                        : "bg-[#0B1F3A] hover:bg-[#143258] text-white"
                    }`}
                  >
                    {isTeacher
                      ? isLive
                        ? "Enter Control Room"
                        : "Launch Classroom"
                      : isLive
                      ? "Join Live Classroom"
                      : "Enter Waiting Room"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Teacher Schedule Class Modal */}
        {isScheduleOpen && isTeacher && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSchedule}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  Schedule Live Classroom
                </h3>
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SSS 3 Further Maths — Calculus Revision"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                    >
                      <option value="JSS 2 Basic">JSS 2 Basic</option>
                      <option value="JSS 3 BECE">JSS 3 BECE</option>
                      <option value="SSS 1 Science">SSS 1 Science</option>
                      <option value="SSS 2 Science">SSS 2 Science</option>
                      <option value="SSS 3 Intensive">SSS 3 Intensive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lesson Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Key syllabus objectives for this session"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WAT Schedule</label>
                  <input
                    type="text"
                    value={timeWat}
                    onChange={(e) => setTimeWat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startNow}
                    onChange={(e) => setStartNow(e.target.checked)}
                    className="accent-[#0D9488]"
                  />
                  <span className="font-semibold text-[#0B1F3A]">
                    Launch Live Control Room immediately after creating
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <BookOpen size={14} />
                  {creating ? "Creating..." : startNow ? "Create & Launch" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
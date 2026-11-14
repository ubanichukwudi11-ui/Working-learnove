"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  Users,
  Clock,
  Play,
  Wifi,
  Lock,
  MonitorCheck,
  BookOpen,
} from "lucide-react";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "live" | "scheduled">("all");

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/live-classes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setClasses(Array.isArray(data.classes) ? data.classes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    const timer = setInterval(loadClasses, 8000);
    return () => clearInterval(timer);
  }, [loadClasses]);

  const filteredClasses = classes.filter((c) => {
    if (filter === "live") return c.status === "live";
    if (filter === "scheduled") return c.status === "scheduled" || c.status === "waiting";
    return true;
  });

  const featuredClass = classes.find((c) => c.status === "live") || classes[0];

  const lifecycleLabel = (cls: any) => {
    switch (cls.lifecycleStatus) {
      case "LIVE":
        return { text: "LIVE NOW", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "PREPARED":
        return { text: "Prepared · Waiting for Teacher", badge: "bg-teal-50 text-[#0D9488] border-teal-200" };
      case "ENDED":
        return { text: "Class Ended", badge: "bg-slate-100 text-slate-600 border-slate-200" };
      case "CANCELLED":
        return { text: "Class Cancelled", badge: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { text: "Scheduled · Waiting for Teacher", badge: "bg-amber-50 text-amber-800 border-amber-200" };
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Africa/Lagos (WAT) · Group-Isolated Classrooms
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Learnova Live Classrooms
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {isAdmin
                  ? "Administrators monitor classroom operations in the Classroom Control Centre. Private audio & video streams remain restricted to assigned teachers and entitled students."
                  : isTeacher
                  ? "Open your assigned classroom groups from your official timetable, prepare lesson notes, and start live sessions."
                  : "Join only your allocated classroom group when your teacher starts the lesson. Switch to Audio-Only mode on low mobile bandwidth."}
              </p>
            </div>

            {isAdmin && (
              <Link
                href="/admin/classrooms"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold shrink-0"
              >
                <MonitorCheck size={15} />
                Open Classroom Control Centre
              </Link>
            )}
            {isTeacher && (
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shrink-0"
              >
                <BookOpen size={15} />
                Prepare &amp; Manage My Classes
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#0B1F3A]">
              <Wifi size={16} className="text-[#0D9488] shrink-0" />
              <span>
                <strong>Nigerian Bandwidth Optimization:</strong> Audio-First and 240p/360p stream
                modes are built into every classroom to save mobile data.
              </span>
            </div>
            <span className="text-slate-500 font-semibold whitespace-nowrap">
              Strict Group Allocation &amp; Subscription Gating Active
            </span>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading your allocated classrooms...
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <Video size={32} className="mx-auto text-slate-400" />
              <h2 className="text-base font-bold text-[#0F1F38]">
                No Allocated Live Classrooms Found
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isTeacher
                  ? "You do not have any published timetable lessons assigned yet. Ensure your subject applications are approved by School Admin."
                  : isAdmin
                  ? "Publish a lesson in the Official Timetable Builder to generate capacity-bounded classroom groups."
                  : "You have not been placed into a live classroom yet. Confirm your class enrolment and active subscription plan, or check once School Admin publishes your timetable."}
              </p>
              {!isTeacher && !isAdmin && (
                <div className="flex justify-center gap-2 pt-1">
                  <Link
                    href="/subscriptions"
                    className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold"
                  >
                    Manage Enrolment &amp; Subscription
                  </Link>
                  <Link
                    href="/timetable"
                    className="px-4 py-2 rounded-xl border border-slate-200 text-[#0B1F3A] text-xs font-bold"
                  >
                    View Timetable
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Featured Active / Next Classroom */}
              {featuredClass && !isAdmin && (
                <div className="rounded-2xl border border-slate-200 bg-[#0B1F3A] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-teal-300 font-semibold">
                      <span>{featuredClass.status === "live" ? "Broadcasting Now" : "Your Allocated Session"}</span>
                      <span>·</span>
                      <span>{featuredClass.classLevel}</span>
                      <span>·</span>
                      <span className="tabular-nums">{featuredClass.timeWat}</span>
                    </div>
                    <h2 className="text-2xl font-extrabold">{featuredClass.title}</h2>
                    <p className="text-sm text-slate-300">{featuredClass.topic}</p>
                    <p className="text-xs text-slate-300">
                      Instructor: <strong className="text-white">{featuredClass.teacher}</strong> ·{" "}
                      {featuredClass.studentsCount} / {featuredClass.maxCapacity} allocated
                    </p>
                  </div>

                  <div className="shrink-0">
                    {featuredClass.entitled === false ? (
                      <Link
                        href="/subscriptions"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D97706] text-white text-xs font-bold"
                      >
                        <Lock size={14} />
                        Activate Subscription to Join
                      </Link>
                    ) : (
                      <Link
                        href={
                          isTeacher
                            ? `/teacher/live-class/${featuredClass.id}`
                            : `/live-classes/${featuredClass.id}`
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold"
                      >
                        <Play size={14} fill="currentColor" />
                        {isTeacher
                          ? "Enter Host Studio"
                          : featuredClass.status === "live"
                          ? "Join Live Classroom"
                          : "Enter Waiting Room"}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200">
                  {[
                    { id: "all", label: "All Allocated" },
                    { id: "live", label: "Live Now" },
                    { id: "scheduled", label: "Waiting / Scheduled" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
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
                  {filteredClasses.length} classroom(s)
                </span>
              </div>

              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClasses.map((cls) => {
                  const statusMeta = lifecycleLabel(cls);
                  const blockedBySub = cls.entitled === false;
                  const targetHref = isTeacher
                    ? `/teacher/live-class/${cls.id}`
                    : `/live-classes/${cls.id}`;

                  return (
                    <div
                      key={cls.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0D9488]">
                            {cls.subject} · {cls.classLevel}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusMeta.badge}`}
                          >
                            {statusMeta.text}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#0B1F3A]">{cls.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{cls.topic}</p>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="font-semibold text-[#0B1F3A] truncate">
                            {cls.teacher}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Users size={13} className="text-[#0D9488]" />
                            {cls.studentsCount}/{cls.maxCapacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
                          <Clock size={12} />
                          <span>{cls.timeWat}</span>
                        </div>

                        {isAdmin ? (
                          <Link
                            href="/admin/classrooms"
                            className="w-full py-2.5 rounded-xl bg-slate-100 text-[#0B1F3A] text-xs font-bold text-center block"
                          >
                            Monitor in Control Centre
                          </Link>
                        ) : blockedBySub ? (
                          <Link
                            href="/subscriptions"
                            className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                          >
                            <Lock size={13} />
                            Subscription Required
                          </Link>
                        ) : (
                          <Link
                            href={targetHref}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition ${
                              cls.status === "live"
                                ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                                : "bg-[#0B1F3A] hover:bg-[#143258] text-white"
                            }`}
                          >
                            {isTeacher
                              ? "Open Host Control Room"
                              : cls.status === "live"
                              ? "Join Live Classroom"
                              : "Enter Waiting Room"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
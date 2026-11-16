"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  BookOpen,
  CalendarDays,
  CreditCard,
  Sparkles,
  NotebookPen,
  Clock,
  Lock,
  ArrowRight,
  PlaySquare,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolment, setEnrolment] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const loadStudentPortal = useCallback(async () => {
    try {
      const [subRes, rmRes, ttRes] = await Promise.all([
        fetch("/api/lms/subscriptions", { cache: "no-store" }),
        fetch("/api/lms/classrooms", { cache: "no-store" }),
        fetch("/api/lms/timetable", { cache: "no-store" }),
      ]);

      const subJson = subRes.ok ? await subRes.json() : {};
      const rmJson = rmRes.ok ? await rmRes.json() : {};
      const ttJson = ttRes.ok ? await ttRes.json() : {};

      setEnrolment(subJson.enrolment || null);
      setEntitlement(subJson.entitlement || null);
      setClassLevels(subJson.classLevels || []);
      setSubjects(subJson.subjects || []);
      setClassrooms(rmJson.classrooms || []);
      setTimetableEntries(ttJson.entries || []);
      setGroups(ttJson.groups || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentPortal();
  }, [loadStudentPortal]);

  const classLevelId = entitlement?.classLevelId || enrolment?.classLevelId || "";
  const levelName =
    classLevels.find((c) => c.id === classLevelId)?.name ||
    user?.classLevel ||
    "Class Level Not Selected";

  const accessStatus = entitlement?.accessStatus || enrolment?.status || "REGISTERED";
  const hasActiveEntitlement =
    accessStatus === "ACTIVE_PAID" || accessStatus === "SCHOLARSHIP_GRANTED";

  const liveNowRooms = classrooms.filter((c) => c.status === "LIVE");
  const subName = (id: string) => subjects.find((s) => s.id === id)?.name || id;

  return (
    <ProtectedRoute roles={["STUDENT"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="learnova-banner-dark learnova-ambient-stage-soft bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                Student Learning Portal · {levelName}
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight">
                Welcome back, {user?.fullName || "Learner"}
              </h1>
              <p className="text-sm text-indigo-100/80 mt-1.5 max-w-2xl leading-relaxed">
                Access your official class timetable, allocated live classroom groups,
                topic video lessons, and Nova AI tutor support.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap"
              >
                <PlaySquare size={15} className="text-[#22D3EE]" />
                Video Lessons
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap"
              >
                <CreditCard size={15} className="text-[#C4B5FD]" />
                {hasActiveEntitlement ? "Subscription Active" : "Activate Subscription"}
              </Link>
              <Link
                href="/nova"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-semibold shadow-sm transition whitespace-nowrap"
              >
                <Sparkles size={15} />
                Ask Nova AI
              </Link>
            </div>
          </div>

          {/* Entitlement Gate Banner */}
          {!loading && !hasActiveEntitlement && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  <Lock size={15} className="text-amber-700 shrink-0" />
                  Subscription Status: {accessStatus.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                  {accessStatus === "AWAITING_CONFIRMATION"
                    ? "Your bank transfer reference is awaiting School Admin verification. Your classrooms will unlock automatically once approved."
                    : "Confirm your class level and activate a Nigerian Naira (₦) term or monthly subscription to enter live classrooms."}
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shrink-0 whitespace-nowrap shadow-xs transition"
              >
                Go to Subscriptions →
              </Link>
            </div>
          )}

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading your student portal...
            </div>
          ) : (
            <>
              {/* Real KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/subscriptions"
                  className="learnova-card p-5 hover:border-[#7C3AED]/45 transition min-w-0"
                >
                  <p className="text-xs font-semibold text-[#6B6F94] uppercase tracking-wide">
                    Enrolled Class
                  </p>
                  <p className="text-lg font-extrabold text-[#0B1230] mt-2 truncate">
                    {classLevels.find((c) => c.id === classLevelId)?.code || "Unselected"}
                  </p>
                  <p className="text-xs text-[#4F46E5] font-semibold mt-1 truncate">
                    {accessStatus.replace(/_/g, " ")}
                  </p>
                </Link>

                <Link
                  href="/live-classes"
                  className="learnova-card p-5 hover:border-[#7C3AED]/45 transition min-w-0"
                >
                  <p className="text-xs font-semibold text-[#6B6F94] uppercase tracking-wide">
                    Allocated Classrooms
                  </p>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {classrooms.length}
                  </p>
                  <p className="text-xs text-[#0891B2] font-medium mt-1 tabular-nums">
                    {liveNowRooms.length} broadcasting live now
                  </p>
                </Link>

                <Link
                  href="/timetable"
                  className="learnova-card p-5 hover:border-[#7C3AED]/45 transition min-w-0"
                >
                  <p className="text-xs font-semibold text-[#6B6F94] uppercase tracking-wide">
                    Weekly Lessons
                  </p>
                  <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                    {timetableEntries.length}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">Published WAT sessions</p>
                </Link>

                <Link
                  href="/subjects"
                  className="learnova-card p-5 hover:border-[#7C3AED]/45 transition min-w-0"
                >
                  <p className="text-xs font-semibold text-[#6B6F94] uppercase tracking-wide">
                    Enrolled Subjects
                  </p>
                  <p className="text-2xl font-extrabold text-[#6D28D9] mt-2 tabular-nums">
                    {enrolment?.subjectIds?.length || 0}
                  </p>
                  <p className="text-xs text-[#6B6F94] mt-1">Selected for your level</p>
                </Link>
              </div>

              {/* Allocated Live Classrooms & Timetable */}
              <div className="grid lg:grid-cols-2 gap-6 items-start">
                <div className="learnova-card-glow p-6 space-y-4 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                      <Video size={17} className="text-[#4F46E5]" />
                      Your Allocated Classrooms
                    </h2>
                    <Link
                      href="/live-classes"
                      className="text-xs font-bold text-[#4F46E5] hover:text-[#6D28D9] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      All Rooms <ArrowRight size={13} />
                    </Link>
                  </div>

                  {classrooms.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#DCD7F5] bg-[#FAF8FF] p-8 text-center space-y-2">
                      <p className="text-sm font-bold text-[#0B1230]">
                        No Classrooms Allocated Yet
                      </p>
                      <p className="text-xs text-[#6B6F94] leading-relaxed">
                        Once you enrol with an active plan and School Admin publishes your
                        timetable, your assigned group classroom will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classrooms.map((rm) => (
                        <div
                          key={rm.id}
                          className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] hover:border-[#C4B5FD] p-4 flex items-center justify-between gap-3 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#6D28D9] truncate">
                              {rm.subjectName} · {rm.groupName} · {rm.status}
                            </p>
                            <h3 className="text-sm font-bold text-[#0B1230] mt-0.5 truncate">
                              {rm.lessonTitle}
                            </h3>
                            <p className="text-xs text-[#6B6F94] mt-0.5 truncate tabular-nums">
                              {rm.teacherName} · {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT
                            </p>
                          </div>
                          {rm.entitled ? (
                            <Link
                              href={`/live-classes/${rm.id}`}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shrink-0 whitespace-nowrap shadow-xs transition"
                            >
                              {rm.status === "LIVE" ? "Join Live" : "Open Room"}
                            </Link>
                          ) : (
                            <Link
                              href="/subscriptions"
                              className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold shrink-0 whitespace-nowrap transition"
                            >
                              Unlock
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Official Timetable & Learning Tools */}
                <div className="space-y-6 min-w-0">
                  <div className="learnova-card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                        <CalendarDays size={17} className="text-[#0891B2]" />
                        Official Class Timetable (WAT)
                      </h2>
                      <Link
                        href="/timetable"
                        className="text-xs font-bold text-[#4F46E5] hover:text-[#6D28D9] hover:underline whitespace-nowrap"
                      >
                        Full Schedule →
                      </Link>
                    </div>

                    {timetableEntries.length === 0 ? (
                      <p className="text-xs text-[#6B6F94] py-6 text-center">
                        No published timetable entries for your class level yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#E4E1F5]">
                        {timetableEntries.slice(0, 5).map((slot) => {
                          const grp = groups.find((g) => g.timetableEntryId === slot.id);
                          return (
                            <div
                              key={slot.id}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[#0B1230] truncate">
                                  {subName(slot.subjectId)} {grp ? `(${grp.groupName})` : ""}
                                </p>
                                <p className="text-[#6B6F94] truncate">
                                  {slot.dayOfWeek} · {grp?.teacherName || slot.mode}
                                </p>
                              </div>
                              <span className="font-semibold text-[#4F46E5] tabular-nums inline-flex items-center gap-1 shrink-0">
                                <Clock size={12} />
                                {slot.startTime}–{slot.endTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Study Shortcuts */}
                  <div className="grid grid-cols-3 gap-3">
                    <Link
                      href="/subjects"
                      className="learnova-card p-4 hover:border-[#7C3AED]/45 transition min-w-0"
                    >
                      <BookOpen size={17} className="text-[#4F46E5] mb-1.5" />
                      <p className="text-xs font-bold text-[#0B1230] truncate">Subjects</p>
                    </Link>
                    <Link
                      href="/notebook"
                      className="learnova-card p-4 hover:border-[#7C3AED]/45 transition min-w-0"
                    >
                      <NotebookPen size={17} className="text-[#7C3AED] mb-1.5" />
                      <p className="text-xs font-bold text-[#0B1230] truncate">Notebook</p>
                    </Link>
                    <Link
                      href="/nova"
                      className="learnova-card p-4 hover:border-[#7C3AED]/45 transition min-w-0"
                    >
                      <Sparkles size={17} className="text-[#0891B2] mb-1.5" />
                      <p className="text-xs font-bold text-[#0B1230] truncate">Nova AI</p>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
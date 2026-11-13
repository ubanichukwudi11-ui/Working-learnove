"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  CURRENT_ACADEMIC_TERM,
  NIGERIAN_ASSIGNMENTS,
  WEEKLY_TIMETABLE,
} from "@/lib/nigerianCurriculum";
import {
  CalendarCheck,
  ClipboardList,
  Trophy,
  Video,
  User,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function ParentDashboard() {
  return (
    <ProtectedRoute roles={["PARENT"]}>
      <ParentContent />
    </ProtectedRoute>
  );
}

function ParentContent() {
  const { user } = useAuth();
  const guardianName = user?.fullName || "Guardian";
  const childName = "Chukwudi Ubani";

  const stats = [
    {
      title: "Term Attendance",
      value: "96%",
      detail: "48 of 50 school days present",
      icon: CalendarCheck,
    },
    {
      title: "Assignments Pending",
      value: "2",
      detail: "Mathematics & Physics",
      icon: ClipboardList,
    },
    {
      title: "CA Average Score",
      value: "84%",
      detail: "Top 10% in SSS 2 Science",
      icon: Trophy,
    },
    {
      title: "Live Classes Joined",
      value: "18",
      detail: "Term 2 interactive sessions",
      icon: Video,
    },
  ];

  const subjectScores = [
    { subject: "Mathematics", teacher: "Mrs. Funke Adewale", ca: 26, examReadiness: "88%", grade: "A1" },
    { subject: "English Language", teacher: "Mrs. Titilayo Ojo", ca: 25, examReadiness: "84%", grade: "B2" },
    { subject: "Physics", teacher: "Mr. Chinedu Emeka", ca: 24, examReadiness: "81%", grade: "B2" },
    { subject: "Chemistry", teacher: "Dr. Ibrahim Bello", ca: 23, examReadiness: "78%", grade: "B3" },
  ];

  const activities = [
    {
      text: "Joined SSS 2 Mathematics Live Class (Quadratic Equations)",
      time: "Today · 08:30 AM WAT",
    },
    {
      text: "Scored 43/50 (86%) in WAEC Formal Letter & Summary Assignment",
      time: "Yesterday · 04:15 PM WAT",
    },
    {
      text: "Completed Cell Ultrastructure & Plasmolysis Worksheet",
      time: "Mon · 05:40 PM WAT",
    },
    {
      text: "Completed 25-question JAMB Physics CBT Practice Drill",
      time: "Sat · 11:10 AM WAT",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM} · Guardian Overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Welcome, {guardianName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track your ward&apos;s continuous assessment, daily attendance, and scheduled live classes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/timetable"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold transition whitespace-nowrap"
            >
              <Clock size={15} />
              View Class Timetable
            </Link>
            <Link
              href="/live-classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
            >
              <Video size={15} />
              View Live Schedule
            </Link>
          </div>
        </div>

        {/* Linked Student Banner */}
        <div className="rounded-2xl border border-slate-200 bg-[#0B1F3A] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#F59E0B] shrink-0">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-teal-300 font-semibold">Linked Ward</p>
              <h2 className="text-xl font-extrabold mt-0.5">{childName}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                SSS 2 Science · WAEC &amp; JAMB Track · Plan Active (₦4,500/month)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 size={16} />
            <span>Checked in for Morning Classes (WAT)</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {stat.title}
                  </span>
                  <Icon size={17} className="text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{stat.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Main Columns */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Subject CA Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Continuous Assessment Snapshot (CA / 30)
              </h2>
              <span className="text-xs text-slate-500 font-medium">Second Term</span>
            </div>

            <div className="divide-y divide-slate-100">
              {subjectScores.map((item) => (
                <div
                  key={item.subject}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-bold text-[#0B1F3A]">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.teacher}</p>
                  </div>
                  <div className="flex items-center gap-6 tabular-nums text-right">
                    <div>
                      <p className="text-xs text-slate-500">CA Score</p>
                      <p className="font-bold text-[#0B1F3A]">{item.ca}/30</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Term Est.</p>
                      <p className="font-bold text-[#0D9488]">
                        {item.examReadiness} ({item.grade})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Classes & Activity */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Upcoming Live Classes (WAT)
                </h2>
                <Link
                  href="/live-classes"
                  className="text-xs font-bold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                >
                  Schedule
                  <ArrowRight size={13} />
                </Link>
              </div>
              {WEEKLY_TIMETABLE.slice(0, 3).map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={15} className="text-[#0D9488] shrink-0" />
                    <div>
                      <p className="font-bold text-[#0B1F3A]">{slot.subject}</p>
                      <p className="text-slate-500">{slot.day} · {slot.teacher}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#0B1F3A] tabular-nums">
                    {slot.timeWat}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Recent Ward Activity &amp; Pending Work
              </h2>
              <div className="space-y-2.5">
                {activities.map((act) => (
                  <div
                    key={act.text}
                    className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 text-xs"
                  >
                    <p className="font-semibold text-[#0B1F3A]">{act.text}</p>
                    <p className="text-slate-500 mt-1 tabular-nums">{act.time}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-500 pt-1">
                  {NIGERIAN_ASSIGNMENTS.filter((a) => a.status === "Pending").length} pending assignments awaiting submission this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
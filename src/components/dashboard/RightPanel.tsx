"use client";

import Link from "next/link";
import { Calendar, Clock, Video, ClipboardList } from "lucide-react";
import { WEEKLY_TIMETABLE, NIGERIAN_ASSIGNMENTS } from "@/lib/nigerianCurriculum";

export default function RightPanel() {
  const upcomingSlots = WEEKLY_TIMETABLE.slice(0, 3);
  const pendingTasks = NIGERIAN_ASSIGNMENTS.filter((a) => a.status === "Pending");

  return (
    <aside className="space-y-6">
      {/* Upcoming Live Classes */}
      <div className="learnova-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0B1230] flex items-center gap-2">
            <Video size={16} className="text-[#4F46E5]" />
            Upcoming Live Classes
          </h3>
          <Link href="/timetable" className="text-xs font-semibold text-[#4F46E5] hover:text-[#6D28D9] hover:underline">
            Timetable
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingSlots.map((slot) => (
            <Link
              key={slot.id}
              href={`/live-classes/${slot.roomOrClassId}`}
              className="block rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] hover:bg-white hover:border-[#7C3AED]/45 p-3.5 transition"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#0B1230]">
                <span>{slot.subject}</span>
                <span className="text-[#4F46E5]">{slot.day}</span>
              </div>
              <p className="text-xs text-[#6B6F94] mt-1">{slot.teacher}</p>
              <p className="text-[11px] text-[#6B6F94] mt-1.5 flex items-center gap-1 tabular-nums">
                <Clock size={12} className="text-[#0891B2]" />
                {slot.timeWat}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Assignments Needing Attention */}
      <div className="learnova-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0B1230] flex items-center gap-2">
            <ClipboardList size={16} className="text-[#D97706]" />
            Needs Attention
          </h3>
          <Link href="/assignments" className="text-xs font-semibold text-[#4F46E5] hover:text-[#6D28D9] hover:underline">
            All tasks
          </Link>
        </div>

        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <Link
              key={task.id}
              href="/assignments"
              className="block rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 p-3.5 transition"
            >
              <p className="text-xs font-bold text-[#0B1230]">{task.title}</p>
              <p className="text-[11px] text-[#43466E] mt-1">
                {task.subject} · {task.dueDate}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Exam Readiness Calendar */}
      <div className="learnova-card p-5">
        <h3 className="text-sm font-bold text-[#0B1230] flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-[#6D28D9]" />
          Key Academic Dates
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1F5]">
            <span className="font-medium text-[#43466E]">Mid-Term CBT Check</span>
            <span className="font-semibold text-[#0B1230] tabular-nums">Week 8</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1F5]">
            <span className="font-medium text-[#43466E]">WAEC Physics Practicals</span>
            <span className="font-semibold text-[#0891B2] tabular-nums">Week 10</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="font-medium text-[#43466E]">Term 2 Examinations</span>
            <span className="font-semibold text-[#6D28D9] tabular-nums">Week 12</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
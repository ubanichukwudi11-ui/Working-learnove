"use client";

import { use, useState } from "react";
import TeacherLiveClassroom from "@/components/live-class/TeacherLiveClassroom";
import StudentLiveClassroom from "@/components/live-class/StudentLiveClassroom";

export default function TeacherLiveClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");

  return (
    <div className="relative min-h-screen bg-[#070b14]">
      {/* Floating View Switcher Pill matching reference design */}
      <div className="fixed bottom-4 right-6 z-50 flex items-center bg-[#0c1222]/95 backdrop-blur-md border border-purple-500/50 rounded-full p-1 shadow-2xl">
        <button
          onClick={() => setViewMode("teacher")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            viewMode === "teacher"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>👩‍🏫</span>
          <span>Teacher View</span>
        </button>
        <button
          onClick={() => setViewMode("student")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            viewMode === "student"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>👨‍🎓</span>
          <span>Student View</span>
        </button>
      </div>

      {viewMode === "teacher" ? (
        <TeacherLiveClassroom
          classId={id}
          onSwitchToStudentView={() => setViewMode("student")}
        />
      ) : (
        <StudentLiveClassroom
          classId={id}
          onSwitchToTeacherView={() => setViewMode("teacher")}
        />
      )}
    </div>
  );
}
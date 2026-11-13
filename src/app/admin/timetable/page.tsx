"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  CURRENT_ACADEMIC_TERM,
  TIMEZONE_LABEL,
  TimetableSlot,
  WEEKLY_TIMETABLE,
} from "@/lib/nigerianCurriculum";
import { CalendarDays, Plus, Trash2, Clock } from "lucide-react";

export default function AdminTimetablePage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <TimetableManager />
    </ProtectedRoute>
  );
}

const DAYS: TimetableSlot["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

function TimetableManager() {
  const [slots, setSlots] = useState<TimetableSlot[]>(WEEKLY_TIMETABLE);
  const [selectedDay, setSelectedDay] = useState<"ALL" | TimetableSlot["day"]>("ALL");
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState<TimetableSlot["day"]>("Monday");
  const [timeWat, setTimeWat] = useState("12:00 PM – 01:00 PM WAT");
  const [classLevel, setClassLevel] = useState("SSS 2 Science");
  const [teacher, setTeacher] = useState("Mrs. Funke Adewale");
  const [mode, setMode] = useState<TimetableSlot["mode"]>("Live Class");

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    const newSlot: TimetableSlot = {
      id: `tt-${Date.now()}`,
      day,
      timeWat,
      subject: subject.trim(),
      classLevel,
      teacher,
      roomOrClassId: "math-001",
      mode,
    };
    setSlots((prev) => [newSlot, ...prev]);
    setSubject("");
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const visibleSlots =
    selectedDay === "ALL" ? slots : slots.filter((s) => s.day === selectedDay);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            {CURRENT_ACADEMIC_TERM} · {TIMEZONE_LABEL}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
            School Timetable Scheduler
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure weekly live classes, practical labs, and CBT drills across JSS and SSS cohorts.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6 items-start">
          {/* Timetable List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <CalendarDays size={18} className="text-[#0D9488]" />
                Published Periods ({visibleSlots.length})
              </h2>

              <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#F7F8FA] border border-slate-200">
                <button
                  onClick={() => setSelectedDay("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedDay === "ALL"
                      ? "bg-[#0B1F3A] text-white"
                      : "text-slate-600 hover:text-[#0B1F3A]"
                  }`}
                >
                  All Days
                </button>
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      selectedDay === d
                        ? "bg-[#0B1F3A] text-white"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {visibleSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                      <span>{slot.day}</span>
                      <span>·</span>
                      <span>{slot.mode}</span>
                      <span>·</span>
                      <span>{slot.classLevel}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0B1F3A] mt-0.5">
                      {slot.subject}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 tabular-nums">
                      <Clock size={12} />
                      {slot.timeWat} · {slot.teacher}
                    </p>
                  </div>

                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition self-start sm:self-center shrink-0"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Period Form */}
          <form
            onSubmit={handleAddSlot}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
          >
            <h2 className="text-base font-bold text-[#0B1F3A]">Add Timetable Slot</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Further Mathematics"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A] focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as TimetableSlot["day"])}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as TimetableSlot["mode"])}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                  >
                    <option value="Live Class">Live Class</option>
                    <option value="Lab Review">Lab Review</option>
                    <option value="CBT Practice">CBT Practice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot (WAT)</label>
                <input
                  type="text"
                  required
                  value={timeWat}
                  onChange={(e) => setTimeWat(e.target.value)}
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Educator</label>
                <input
                  type="text"
                  required
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F7F8FA] text-[#0B1F3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={15} />
              Publish Period to Timetable
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
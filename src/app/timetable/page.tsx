"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import { CalendarDays, Clock, Video, CheckSquare, Plus } from "lucide-react";

type StudyGoal = { id: string; text: string; done: boolean };

export default function TimetablePlannerPage() {
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [entries, setEntries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);

  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("learnova_study_goals");
      if (saved) setGoals(JSON.parse(saved));
    } catch {}
  }, []);

  const persistGoals = (next: StudyGoal[]) => {
    setGoals(next);
    try {
      localStorage.setItem("learnova_study_goals", JSON.stringify(next));
    } catch {}
  };

  const loadTimetable = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/timetable", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setEntries(json.entries || []);
      setGroups(json.groups || []);
      setClassrooms(json.classrooms || []);
      setSubjects(json.subjects || []);
      setClassLevels(json.classLevels || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const visibleSlots =
    selectedDay === "All"
      ? entries
      : entries.filter((s) => s.dayOfWeek === selectedDay);

  const subName = (id: string) => subjects.find((s) => s.id === id)?.name || id;
  const lvlCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    persistGoals([{ id: Date.now().toString(), text: newGoal.trim(), done: false }, ...goals]);
    setNewGoal("");
  };

  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Official Timetable · {TIMEZONE_LABEL}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Class Timetable &amp; Study Planner
            </h1>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
            {/* Official Weekly Timetable */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#0D9488]" />
                  Weekly Official Schedule (WAT)
                </h2>

                <div className="flex flex-wrap gap-1.5">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedDay === day
                          ? "bg-[#0B1F3A] text-white"
                          : "bg-[#F7F8FA] text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Loading published timetable...
                </div>
              ) : visibleSlots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
                  <p className="text-sm font-bold text-[#0F1F38]">
                    No Published Lessons for Your Class Level Yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Ensure you have selected your class level and activated your subscription in{" "}
                    <Link href="/subscriptions" className="text-[#0D9488] font-bold underline">
                      Subscriptions
                    </Link>
                    . School Admin will publish your official schedule here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleSlots.map((slot) => {
                    const myGroup = groups.find((g) => g.timetableEntryId === slot.id);
                    const myRoom = classrooms.find((c) => c.timetableEntryId === slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                            <span>{slot.dayOfWeek}</span>
                            <span>·</span>
                            <span>{slot.mode}</span>
                            {myGroup && (
                              <>
                                <span>·</span>
                                <span>{myGroup.groupName}</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5">
                            {subName(slot.subjectId)} ({lvlCode(slot.classLevelId)})
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {myGroup
                              ? `Assigned Teacher: ${myGroup.teacherName}`
                              : "Teacher allocation pending"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1 tabular-nums">
                            <Clock size={14} className="text-[#D97706]" />
                            {slot.startTime}–{slot.endTime} WAT
                          </span>
                          {myRoom && (
                            <Link
                              href={`/live-classes/${myRoom.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap"
                            >
                              <Video size={13} />
                              {myRoom.status === "LIVE" ? "Join Live" : "Open Room"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Study Planner Checklist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <CheckSquare size={18} className="text-[#D97706]" />
                Personal Revision Goals
              </h2>

              <form onSubmit={addGoal} className="flex gap-2">
                <input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add study goal (e.g. Organic Chemistry notes)"
                  className="flex-1 rounded-xl border border-slate-300 bg-[#F7F8FA] px-3 py-2 text-xs text-[#0F1F38] focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>

              {goals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Add your personal study targets for this week above.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {goals.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 cursor-pointer hover:bg-white transition"
                    >
                      <input
                        type="checkbox"
                        checked={g.done}
                        onChange={() =>
                          persistGoals(
                            goals.map((item) =>
                              item.id === g.id ? { ...item, done: !item.done } : item
                            )
                          )
                        }
                        className="mt-0.5 rounded accent-[#0D9488]"
                      />
                      <span
                        className={`text-xs font-medium leading-relaxed ${
                          g.done ? "line-through text-slate-400" : "text-[#0F1F38]"
                        }`}
                      >
                        {g.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

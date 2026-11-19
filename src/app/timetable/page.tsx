"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { CardSkeleton, EmptyState, PageHeader } from "@/components/ui";
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
          <PageHeader
            kicker={`Official Timetable · ${TIMEZONE_LABEL}`}
            title="Class Timetable & Study Planner"
            description="View your weekly West Africa Time (WAT) schedule, join allocated classrooms, and organize personal revision goals."
            breadcrumbs={[{ label: "Timetable" }]}
          />

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
            {/* Official Weekly Timetable */}
            <div className="learnova-card p-6 space-y-5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                  Weekly Official Schedule (WAT)
                </h2>

                <div className="flex flex-wrap gap-1.5">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedDay === day
                          ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                          : "bg-[var(--surface-lavender)] border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-subtle)]"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <CardSkeleton rows={4} />
              ) : visibleSlots.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title="No Published Lessons for This View"
                  description="Ensure your class level and active subscription are confirmed under Subscriptions. School Admin publishes official lessons here."
                  action={
                    <Link
                      href="/subscriptions"
                      className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] underline"
                    >
                      Check Subscriptions →
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {visibleSlots.map((slot) => {
                    const myGroup = groups.find((g) => g.timetableEntryId === slot.id);
                    const myRoom = classrooms.find((c) => c.timetableEntryId === slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
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
                          <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                            {subName(slot.subjectId)} ({lvlCode(slot.classLevelId)})
                          </h3>
                          <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                            {myGroup
                              ? `Assigned Teacher: ${myGroup.teacherName}`
                              : "Teacher allocation pending"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold text-[var(--foreground-muted)] inline-flex items-center gap-1 tabular-nums">
                            <Clock size={14} className="text-[#0891B2] dark:text-[#22D3EE]" />
                            {slot.startTime}–{slot.endTime} WAT
                          </span>
                          {myRoom && (
                            <Link
                              href={`/live-classes/${myRoom.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap shadow-sm"
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
            <div className="learnova-card p-6 space-y-4">
              <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <CheckSquare size={18} className="text-[#7C3AED] dark:text-[#C4B5FD]" />
                Personal Revision Goals
              </h2>

              <form onSubmit={addGoal} className="flex gap-2">
                <input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add study goal (e.g. Organic Chemistry notes)"
                  className="learnova-input flex-1 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold inline-flex items-center gap-1 transition shadow-sm"
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>

              {goals.length === 0 ? (
                <p className="text-xs text-[var(--foreground-subtle)] text-center py-6">
                  Add your personal study targets for this week above.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {goals.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3.5 cursor-pointer hover:bg-[var(--surface)] transition"
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
                        className="mt-0.5 rounded accent-[#4F46E5]"
                      />
                      <span
                        className={`text-xs font-medium leading-relaxed ${
                          g.done
                            ? "line-through text-[var(--foreground-subtle)]"
                            : "text-[var(--foreground)]"
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

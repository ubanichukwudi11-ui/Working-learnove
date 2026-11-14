"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { NIGERIAN_ASSIGNMENTS } from "@/lib/nigerianCurriculum";
import { Plus, CheckCircle2, ClipboardList } from "lucide-react";

export default function TeacherAssignmentsPage() {
  const [tasks, setTasks] = useState(
    NIGERIAN_ASSIGNMENTS.map((a, idx) => ({
      ...a,
      submissions: idx === 0 ? 29 : 34,
      total: 38,
    }))
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [dueDate, setDueDate] = useState("Friday, 5:00 PM WAT");
  const [instructions, setInstructions] = useState("");

  const [gradingQueue, setGradingQueue] = useState([
    { id: "sub-1", student: "Chidi Nwankwo", task: "Quadratic Equations Worksheet", score: "", graded: false },
    { id: "sub-2", student: "Kelechi Okafor", task: "Quadratic Equations Worksheet", score: "", graded: false },
    { id: "sub-3", student: "Amina Yusuf", task: "Newton's Laws Calculations", score: "94", graded: true },
  ]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) return;
    setTasks((prev) => [
      {
        id: Date.now().toString(),
        title: title.trim(),
        subject,
        classLevel: "SSS 2 Science",
        teacher: "You",
        dueDate,
        marks: 100,
        status: "Pending",
        instructions: instructions.trim(),
        submissions: 0,
        total: 38,
      },
      ...prev,
    ]);
    setTitle("");
    setInstructions("");
    setShowForm(false);
  };

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Assessments &amp; Marking
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Assignments &amp; Grading Queue
              </h1>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition"
            >
              <Plus size={15} />
              Create Assignment
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs"
            >
              <h2 className="text-base font-bold text-[#0B1F3A]">New Class Assignment</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Assignment title"
                  className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm"
                />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm"
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>English Language</option>
                </select>
                <input
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Due date (WAT)"
                  className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm"
                />
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                required
                placeholder="Instructions & marking guide..."
                className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] p-3.5 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold"
                >
                  Publish to Class
                </button>
              </div>
            </form>
          )}

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
            <div className="space-y-4">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0D9488]">{t.subject} · {t.classLevel}</span>
                    <span className="text-slate-500 tabular-nums">
                      {t.submissions}/{t.total} submitted
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A] mt-1.5">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">{t.instructions}</p>
                  <p className="text-[11px] text-[#D97706] font-semibold mt-3">
                    Due: {t.dueDate}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <ClipboardList size={17} className="text-[#D97706]" />
                Submissions to Grade
              </h2>
              <div className="space-y-3">
                {gradingQueue.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#0B1F3A]">{sub.student}</p>
                        <p className="text-xs text-slate-500">{sub.task}</p>
                      </div>
                      {sub.graded && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 size={14} /> {sub.score}/100
                        </span>
                      )}
                    </div>

                    {!sub.graded && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sub.score}
                          onChange={(e) =>
                            setGradingQueue((prev) =>
                              prev.map((item) =>
                                item.id === sub.id ? { ...item, score: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Score / 100"
                          className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                        <button
                          onClick={() =>
                            setGradingQueue((prev) =>
                              prev.map((item) =>
                                item.id === sub.id && item.score
                                  ? { ...item, graded: true }
                                  : item
                              )
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold"
                        >
                          Record Grade
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

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
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Assessments &amp; Marking
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Assignments &amp; Grading Queue
              </h1>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Plus size={15} />
              Create Assignment
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleCreate}
              className="learnova-card p-6 space-y-4"
            >
              <h2 className="landing-display text-base font-bold text-[#0B1230]">
                New Class Assignment
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Assignment title"
                  className="learnova-input px-3.5 py-2.5 text-sm"
                />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="learnova-input px-3.5 py-2.5 text-sm"
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
                  className="learnova-input px-3.5 py-2.5 text-sm"
                />
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                required
                placeholder="Instructions & marking guide..."
                className="learnova-input w-full p-3.5 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#43466E] hover:bg-[#FAF8FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                >
                  Publish to Class
                </button>
              </div>
            </form>
          )}

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
            <div className="space-y-4 min-w-0">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="learnova-card p-5"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#4F46E5]">{t.subject} · {t.classLevel}</span>
                    <span className="text-[#6B6F94] tabular-nums">
                      {t.submissions}/{t.total} submitted
                    </span>
                  </div>
                  <h3 className="landing-display text-base font-bold text-[#0B1230] mt-1.5">
                    {t.title}
                  </h3>
                  <p className="text-xs text-[#43466E] mt-2 leading-relaxed">{t.instructions}</p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-3">
                    Due: {t.dueDate}
                  </p>
                </div>
              ))}
            </div>

            <div className="learnova-card p-6 space-y-4 min-w-0">
              <h2 className="landing-display text-base font-bold text-[#0B1230] flex items-center gap-2">
                <ClipboardList size={17} className="text-[#7C3AED]" />
                Submissions to Grade
              </h2>
              <div className="space-y-3">
                {gradingQueue.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0B1230] truncate">{sub.student}</p>
                        <p className="text-xs text-[#6B6F94] truncate">{sub.task}</p>
                      </div>
                      {sub.graded && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0 tabular-nums">
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
                          className="learnova-input w-28 px-2.5 py-1.5 text-xs tabular-nums"
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
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
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

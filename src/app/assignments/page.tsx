"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  NIGERIAN_ASSIGNMENTS,
  StudentAssignmentItem,
} from "@/lib/nigerianCurriculum";
import { testData } from "@/lib/testData";
import {
  CheckCircle2,
  Clock,
  Send,
  BookOpen,
  Award,
} from "lucide-react";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] =
    useState<StudentAssignmentItem[]>(NIGERIAN_ASSIGNMENTS);
  const [selectedTask, setSelectedTask] =
    useState<StudentAssignmentItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [activeTab, setActiveTab] = useState<"assignments" | "cbt">("assignments");

  // CBT Mock Practice state
  const [activeTestId, setActiveTestId] = useState<string>(testData[0].id);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);

  const activeTest =
    testData.find((t) => t.id === activeTestId) || testData[0];

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !answerText.trim()) return;
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === selectedTask.id ? { ...a, status: "Submitted" } : a
      )
    );
    setSelectedTask(null);
    setAnswerText("");
  };

  const correctCount = activeTest.questions.filter(
    (q, idx) => answers[idx] === q.answer
  ).length;

  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Continuous Assessment &amp; CBT Practice
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Assignments &amp; Daily Tests
              </h1>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={() => setActiveTab("assignments")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "assignments"
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                Written Assignments
              </button>
              <button
                onClick={() => setActiveTab("cbt")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "cbt"
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                WAEC / JAMB CBT Drills
              </button>
            </div>
          </div>

          {activeTab === "assignments" ? (
            <div className="grid md:grid-cols-2 gap-5">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-[#0D9488]">{item.subject} · {item.classLevel}</span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          item.status === "Graded"
                            ? "text-emerald-700"
                            : item.status === "Submitted"
                            ? "text-[#0B1F3A]"
                            : "text-[#D97706]"
                        }`}
                      >
                        {item.status === "Pending" ? (
                          <Clock size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {item.status}
                        {item.score !== undefined ? ` (${item.score}/${item.marks})` : ""}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[#0B1F3A] mt-2">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Teacher: {item.teacher} · Due: {item.dueDate}
                    </p>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-[#F7F8FA] rounded-xl p-3.5 border border-slate-100">
                      {item.instructions}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      Total Marks: {item.marks}
                    </span>
                    {item.status === "Pending" ? (
                      <button
                        onClick={() => setSelectedTask(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition"
                      >
                        <Send size={13} />
                        Submit Solution
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">
                        Recorded in Term Book
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {testData.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTestId(t.id);
                        setAnswers({});
                        setTestSubmitted(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        activeTestId === t.id
                          ? "bg-[#0D9488] text-white border-[#0D9488]"
                          : "bg-[#F7F8FA] text-[#0B1F3A] border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {activeTest.duration} mins · {activeTest.questions.length} Objective Questions
                </span>
              </div>

              <div className="space-y-5">
                {activeTest.questions.map((q, qIndex) => (
                  <div
                    key={q.question}
                    className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4"
                  >
                    <p className="text-sm font-bold text-[#0B1F3A]">
                      {qIndex + 1}. {q.question}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                      {q.options.map((opt) => {
                        const chosen = answers[qIndex] === opt;
                        const isCorrect = opt === q.answer;
                        return (
                          <button
                            key={opt}
                            disabled={testSubmitted}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [qIndex]: opt }))
                            }
                            className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                              testSubmitted
                                ? isCorrect
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                  : chosen
                                  ? "bg-red-50 border-red-400 text-red-700"
                                  : "bg-white border-slate-200 text-slate-500"
                                : chosen
                                ? "bg-[#0B1F3A] border-[#0B1F3A] text-white"
                                : "bg-white border-slate-200 text-[#0F1F38] hover:border-[#0D9488]"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                {testSubmitted ? (
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0D9488]">
                    <Award size={18} />
                    Score: {correctCount} / {activeTest.questions.length} (
                    {Math.round(
                      (correctCount / activeTest.questions.length) * 100
                    )}
                    %)
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <BookOpen size={14} />
                    Select an answer for each question before submitting.
                  </p>
                )}

                {testSubmitted ? (
                  <button
                    onClick={() => {
                      setAnswers({});
                      setTestSubmitted(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
                  >
                    Retake Practice Test
                  </button>
                ) : (
                  <button
                    onClick={() => setTestSubmitted(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition"
                  >
                    Submit CBT Answers
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submission Modal */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSubmitAssignment}
                className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4"
              >
                <div>
                  <p className="text-xs font-bold text-[#0D9488]">
                    {selectedTask.subject}
                  </p>
                  <h3 className="text-lg font-bold text-[#0B1F3A] mt-0.5">
                    {selectedTask.title}
                  </h3>
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={5}
                  required
                  placeholder="Write out your workings, final answer, or paste a document link..."
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] p-3.5 text-sm text-[#0F1F38] focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold"
                  >
                    Submit Assignment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

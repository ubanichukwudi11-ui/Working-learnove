"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  NIGERIAN_ASSIGNMENTS,
  StudentAssignmentItem,
} from "@/lib/nigerianCurriculum";
import {
  CheckCircle2,
  Clock,
  Send,
  BookOpen,
  Award,
  Flag,
  ChevronLeft,
  ChevronRight,
  Timer,
  Play,
  RotateCcw,
} from "lucide-react";

interface CbtQuestion {
  id: string;
  subjectId: string;
  examTag?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface TimedCbtPack {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  examBody: string;
  durationMinutes: number;
  questions: CbtQuestion[];
}

interface CbtAttemptSummary {
  id: string;
  title: string;
  subjectName: string;
  score: number;
  total: number;
  percentage: number;
  durationSeconds: number;
  createdAt: string;
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentAssignmentsPage() {
  // Written Assignments remain strictly local showcase items (no DB grading/submission changes)
  const [assignments, setAssignments] =
    useState<StudentAssignmentItem[]>(NIGERIAN_ASSIGNMENTS);
  const [selectedTask, setSelectedTask] =
    useState<StudentAssignmentItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [activeTab, setActiveTab] = useState<"assignments" | "cbt">("assignments");

  // Timed CBT Exam Simulator State
  const [cbtPacks, setCbtPacks] = useState<TimedCbtPack[]>([]);
  const [pastAttempts, setPastAttempts] = useState<CbtAttemptSummary[]>([]);
  const [activePackId, setActivePackId] = useState<string>("");
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [savingResult, setSavingResult] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("tab") === "cbt") {
        setActiveTab("cbt");
      }
    }
  }, []);

  const loadCbtData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/quizzes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const packs: TimedCbtPack[] = data.cbtPacks || [];
      setCbtPacks(packs);
      setPastAttempts(
        (data.attempts || []).filter((a: any) => a.quizType === "TIMED_CBT")
      );
      setActivePackId((prev) => prev || packs[0]?.id || "");
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadCbtData();
  }, [loadCbtData]);

  const activePack =
    cbtPacks.find((p) => p.id === activePackId) || cbtPacks[0] || null;

  const finishExam = useCallback(async () => {
    if (!activePack || examSubmitted) return;
    setExamSubmitted(true);
    setExamStarted(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const total = activePack.questions.length;
    const score = activePack.questions.filter(
      (q, idx) => answers[idx] === q.correctAnswer
    ).length;
    const elapsed = Math.max(1, activePack.durationMinutes * 60 - secondsLeft);

    setSavingResult(true);
    try {
      const res = await fetch("/api/lms/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_ATTEMPT",
          subjectId: activePack.subjectId,
          subjectName: activePack.subjectName,
          quizType: "TIMED_CBT",
          title: activePack.title,
          score,
          total,
          durationSeconds: elapsed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attempt) {
          setPastAttempts((prev) => [data.attempt, ...prev]);
        }
      }
    } finally {
      setSavingResult(false);
    }
  }, [activePack, answers, examSubmitted, secondsLeft]);

  // Live countdown ticker while exam is running
  useEffect(() => {
    if (!examStarted || examSubmitted) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [examStarted, examSubmitted]);

  // Auto-submit on timer expiration
  useEffect(() => {
    if (examStarted && !examSubmitted && secondsLeft === 0) {
      finishExam();
    }
  }, [examStarted, examSubmitted, secondsLeft, finishExam]);

  const startExam = (pack: TimedCbtPack) => {
    setActivePackId(pack.id);
    setAnswers({});
    setFlagged([]);
    setCurrentIdx(0);
    setExamSubmitted(false);
    setSecondsLeft(pack.durationMinutes * 60);
    setExamStarted(true);
  };

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

  const correctCount = activePack
    ? activePack.questions.filter((q, idx) => answers[idx] === q.correctAnswer)
        .length
    : 0;
  const activeQuestion = activePack?.questions[currentIdx] || null;

  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Continuous Assessment &amp; Timed CBT Simulator
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Assignments &amp; WAEC / JAMB CBT Lab
              </h1>
            </div>

            <div className="inline-flex rounded-2xl border border-white/15 bg-[#0D1438] p-1 shrink-0 self-start lg:self-auto">
              <button
                onClick={() => setActiveTab("assignments")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "assignments"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Written Assignments
              </button>
              <button
                onClick={() => setActiveTab("cbt")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "cbt"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Timed WAEC / JAMB CBT
              </button>
            </div>
          </div>

          {activeTab === "assignments" ? (
            <div className="grid md:grid-cols-2 gap-5">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="learnova-card p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-[#4F46E5] font-bold">
                        {item.subject} · {item.classLevel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          item.status === "Graded"
                            ? "text-emerald-700"
                            : item.status === "Submitted"
                            ? "text-[#4F46E5]"
                            : "text-amber-600"
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

                    <h2 className="landing-display text-lg font-bold text-[#0B1230] mt-2">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#6B6F94] mt-1">
                      Teacher: {item.teacher} · Due: {item.dueDate}
                    </p>
                    <p className="text-sm text-[#43466E] mt-3 leading-relaxed bg-[#FAF8FF] rounded-xl p-3.5 border border-[#E4E1F5]">
                      {item.instructions}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E4E1F5] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B6F94] tabular-nums">
                      Total Marks: {item.marks}
                    </span>
                    {item.status === "Pending" ? (
                      <button
                        onClick={() => setSelectedTask(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
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
            /* REAL TIMED JAMB / WAEC CBT SIMULATOR */
            <div className="space-y-6">
              {/* Exam Pack Selector */}
              <div className="learnova-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="landing-display text-base font-bold text-[#0B1230]">
                      Select Exam Paper
                    </h2>
                    <p className="text-xs text-[#6B6F94]">
                      Practice under real timed CBT conditions with automatic grading and worked solutions.
                    </p>
                  </div>
                  {examStarted && (
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold tabular-nums ${
                        secondsLeft <= 60
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-[#0B1230] text-white border border-[#1E2756]"
                      }`}
                    >
                      <Timer size={16} className={secondsLeft <= 60 ? "text-rose-600" : "text-[#22D3EE]"} />
                      <span>{formatTimer(secondsLeft)}</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {cbtPacks.map((pack) => {
                    const selected = activePack?.id === pack.id;
                    return (
                      <div
                        key={pack.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition ${
                          selected
                            ? "border-[#7C3AED] bg-[#F5F3FF]"
                            : "border-[#E4E1F5] bg-[#FAF8FF]"
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-bold text-[#4F46E5]">
                            {pack.examBody} · {pack.durationMinutes} mins
                          </span>
                          <p className="text-sm font-bold text-[#0B1230] mt-1">
                            {pack.title}
                          </p>
                          <p className="text-xs text-[#6B6F94] mt-1 tabular-nums">
                            {pack.questions.length} Objective Questions
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => startExam(pack)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <Play size={13} />
                          {selected && examStarted
                            ? "Restart Exam"
                            : "Start Timed CBT"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Exam Workspace or Submitted Results */}
              {activePack && (examStarted || examSubmitted) && (
                <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
                  {/* Left: Active Question or Full Solution Breakdown */}
                  <div className="learnova-card p-6 space-y-5 min-w-0">
                    {examSubmitted ? (
                      <div className="space-y-5">
                        <div className="learnova-banner-dark bg-architectural-grid-dark rounded-2xl text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
                              CBT Exam Submitted
                            </p>
                            <h3 className="landing-display text-xl font-extrabold mt-1">
                              {activePack.title}
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">
                              {savingResult
                                ? "Saving your CBT result to Analytics..."
                                : "Score saved to your Term Analytics & Report Card."}
                            </p>
                          </div>
                          <div className="text-left sm:text-right tabular-nums shrink-0">
                            <p className="text-3xl font-extrabold text-[#22D3EE]">
                              {Math.round(
                                (correctCount /
                                  Math.max(1, activePack.questions.length)) *
                                  100
                              )}
                              %
                            </p>
                            <p className="text-xs text-slate-200">
                              {correctCount} of {activePack.questions.length} Correct
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {activePack.questions.map((q, idx) => {
                            const chosen = answers[idx];
                            const isCorrect = chosen === q.correctAnswer;
                            return (
                              <div
                                key={q.id}
                                className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 space-y-2.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-[#0B1230]">
                                    Question {idx + 1} · {q.examTag}
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      isCorrect ? "text-emerald-700" : "text-rose-600"
                                    }`}
                                  >
                                    {isCorrect ? "Correct" : "Incorrect"}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-[#0B1230]">
                                  {q.prompt}
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2">
                                  {q.options.map((opt) => {
                                    const rightOpt = opt === q.correctAnswer;
                                    const picked = opt === chosen;
                                    return (
                                      <div
                                        key={opt}
                                        className={`px-3 py-2 rounded-lg border text-xs font-semibold ${
                                          rightOpt
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                                            : picked
                                            ? "bg-rose-50 border-rose-400 text-rose-700"
                                            : "bg-white border-[#E4E1F5] text-[#6B6F94]"
                                        }`}
                                      >
                                        {opt}
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-[#43466E] bg-white border border-[#E4E1F5] rounded-lg p-3">
                                  <strong className="text-[#0B1230]">
                                    Worked Explanation:
                                  </strong>{" "}
                                  {q.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => startExam(activePack)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                        >
                          <RotateCcw size={14} />
                          Retake Timed CBT
                        </button>
                      </div>
                    ) : activeQuestion ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E4E1F5]">
                          <span className="text-xs font-bold text-[#4F46E5] tabular-nums">
                            Question {currentIdx + 1} of {activePack.questions.length}
                            {activeQuestion.examTag
                              ? ` · ${activeQuestion.examTag}`
                              : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFlagged((prev) =>
                                prev.includes(currentIdx)
                                  ? prev.filter((i) => i !== currentIdx)
                                  : [...prev, currentIdx]
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                              flagged.includes(currentIdx)
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "bg-white border-[#E4E1F5] text-[#43466E] hover:text-[#0B1230]"
                            }`}
                          >
                            <Flag size={13} />
                            {flagged.includes(currentIdx)
                              ? "Flagged for Review"
                              : "Mark for Review"}
                          </button>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-[#0B1230] leading-relaxed">
                          {activeQuestion.prompt}
                        </p>

                        <div className="space-y-2.5">
                          {activeQuestion.options.map((opt, optIdx) => {
                            const letter = ["A", "B", "C", "D"][optIdx] || "";
                            const chosen = answers[currentIdx] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [currentIdx]: opt,
                                  }))
                                }
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-3 transition ${
                                  chosen
                                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] border-[#4F46E5] text-white shadow-sm"
                                    : "bg-[#FAF8FF] border-[#E4E1F5] text-[#0B1230] hover:border-[#4F46E5]"
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                    chosen
                                      ? "bg-white/20 text-white"
                                      : "bg-white border border-[#E4E1F5] text-[#4F46E5]"
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-[#E4E1F5] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#DCD7F5] bg-white text-xs font-bold text-[#0B1230] hover:bg-[#FAF8FF] disabled:opacity-40 transition"
                          >
                            <ChevronLeft size={14} /> Previous
                          </button>

                          {currentIdx < activePack.questions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentIdx((i) =>
                                  Math.min(activePack.questions.length - 1, i + 1)
                                )
                              }
                              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                            >
                              Next <ChevronRight size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={finishExam}
                              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                            >
                              <BookOpen size={14} />
                              Submit CBT Exam
                            </button>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Right: Question Navigator Grid (1..N) */}
                  <div className="learnova-card p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1230]">
                        Question Navigator
                      </h3>
                      <p className="text-[11px] text-[#6B6F94] mt-0.5 tabular-nums">
                        {Object.keys(answers).length}/{activePack.questions.length} answered ·{" "}
                        {flagged.length} flagged
                      </p>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {activePack.questions.map((q, idx) => {
                        const isCurrent = !examSubmitted && idx === currentIdx;
                        const isAnswered = Boolean(answers[idx]);
                        const isFlagged = flagged.includes(idx);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentIdx(idx)}
                            className={`h-9 rounded-lg text-xs font-bold tabular-nums border transition ${
                              isCurrent
                                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] border-[#4F46E5] text-white"
                                : isFlagged
                                ? "bg-amber-50 border-amber-400 text-amber-700"
                                : isAnswered
                                ? "bg-[#F5F3FF] border-[#7C3AED] text-[#4F46E5]"
                                : "bg-[#FAF8FF] border-[#E4E1F5] text-[#43466E] hover:border-[#4F46E5]"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {!examSubmitted && (
                      <button
                        type="button"
                        onClick={finishExam}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                      >
                        Finish &amp; Grade Exam
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Persistent CBT Score History */}
              {pastAttempts.length > 0 && (
                <div className="learnova-card p-5 space-y-3">
                  <h3 className="text-sm font-bold text-[#0B1230] flex items-center gap-1.5">
                    <Award size={15} className="text-[#4F46E5]" />
                    Recent Timed CBT Score History
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pastAttempts.slice(0, 6).map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-3.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0B1230] truncate">
                            {a.title}
                          </p>
                          <p className="text-[11px] text-[#6B6F94]">
                            {a.subjectName} · {Math.round(a.durationSeconds)}s
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-[#4F46E5] tabular-nums shrink-0">
                          {a.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission Modal for Written Assignments */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSubmitAssignment}
                className="w-full max-w-lg rounded-2xl bg-white border border-[#E4E1F5] p-6 shadow-2xl space-y-4"
              >
                <div>
                  <p className="text-xs font-bold text-[#4F46E5]">
                    {selectedTask.subject}
                  </p>
                  <h3 className="landing-display text-lg font-bold text-[#0B1230] mt-0.5">
                    {selectedTask.title}
                  </h3>
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={5}
                  required
                  placeholder="Write out your workings, final answer, or paste a document link..."
                  className="learnova-input w-full p-3.5 text-sm"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#43466E] hover:bg-[#FAF8FF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
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

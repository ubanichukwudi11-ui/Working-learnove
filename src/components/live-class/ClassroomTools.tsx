"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Send,
  BarChart3,
  HelpCircle,
  Save,
  Check,
} from "lucide-react";
import { LivePoll, LiveAssignment, SharedResource, classroomSync } from "@/lib/classroomSync";

interface ClassroomToolsProps {
  tab: "resources" | "assignments" | "notes" | "polls";
  isTeacher?: boolean;
  poll: LivePoll | null;
  onVotePoll?: (optionId: string) => void;
  onCreatePoll?: (question: string, options: string[]) => void;
  assignment: LiveAssignment | null;
  onShareAssignment?: (assignment: Partial<LiveAssignment>) => void;
  resources: SharedResource[];
  classNotes: string;
  onUpdateNotes?: (notes: string) => void;
  onAskNova?: (prompt: string) => void;
}

export default function ClassroomTools({
  tab,
  isTeacher = false,
  poll,
  onVotePoll,
  onCreatePoll,
  assignment,
  onShareAssignment,
  resources,
  classNotes,
  onUpdateNotes,
  onAskNova,
}: ClassroomToolsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [localNotes, setLocalNotes] = useState(classNotes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Poll Vote handler
  const handleVote = (optId: string) => {
    if (hasVoted) return;
    setSelectedOption(optId);
    setHasVoted(true);
    if (onVotePoll) {
      onVotePoll(optId);
    }
  };

  // Create Poll submission
  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    const validOptions = newOptions.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) return;

    if (onCreatePoll) {
      onCreatePoll(newQuestion, validOptions);
    }
    setIsCreatingPoll(false);
    setNewQuestion("");
    setNewOptions(["", ""]);
  };

  // Notes save handler
  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(localNotes);
    }
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);

    // Save to user's local notes data
    if (typeof window !== "undefined") {
      try {
        const existing = localStorage.getItem("learnova_notes");
        const parsed = existing ? JSON.parse(existing) : [];
        parsed.unshift({
          id: Date.now().toString(),
          title: "Mathematics Live Class Notes: Quadratic Equations",
          content: localNotes,
          date: new Date().toISOString(),
          folder: "Mathematics",
        });
        localStorage.setItem("learnova_notes", JSON.stringify(parsed));
      } catch (e) {
        // ignore
      }
    }
  };

  // Download resource helper
  const handleDownload = (res: SharedResource) => {
    const content = `LEARNOVA STUDY RESOURCE: ${res.title}\n\nSubject: Mathematics\nInstructor: Ms. Sarah Johnson\nTopic: Quadratic Equations (ax² + bx + c = 0)\n\nKey Concepts:\n1. Standard Form: f(x) = ax² + bx + c\n2. Vertex Formula: x = -b / (2a)\n3. Discriminant D = b² - 4ac (D > 0: 2 real roots, D = 0: 1 root, D < 0: complex roots)\n4. Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)\n\nGenerated for Learnova Live Class.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${res.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. RESOURCES TAB
  if (tab === "resources") {
    return (
      <div className="space-y-3">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                PDF
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm group-hover:text-purple-300 transition">
                  {res.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{res.size}</p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(res)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>
        ))}

        {isTeacher && (
          <button
            onClick={() => {
              alert("Resource file picker opened. Document ready to share with class.");
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 hover:border-purple-500 text-xs text-slate-400 hover:text-purple-400 transition"
          >
            <Upload size={14} />
            <span>Upload New Class Resource</span>
          </button>
        )}
      </div>
    );
  }

  // 2. ASSIGNMENTS TAB
  if (tab === "assignments") {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300">
                Current Homework
              </span>
              <h4 className="font-bold text-white text-base mt-2">
                {assignment?.title || "Quadratic Graphs Practice"}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {assignment?.description ||
                  "Plot 5 quadratic curves and calculate vertex coordinates for each equation."}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                <Clock size={12} />
                Due Today 6:00 PM
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                {assignment?.submittedCount || 18} / {assignment?.totalStudents || 24} Submitted
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            {isTeacher ? (
              <button
                onClick={() => {
                  if (onShareAssignment) {
                    onShareAssignment({
                      title: "Quadratic Graphs Practice",
                      description: "Plot 5 quadratic curves and calculate vertex coordinates.",
                    });
                    alert("Assignment pinned to all students' screens!");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
              >
                Broadcast Assignment Notice
              </button>
            ) : (
              <button
                onClick={() => setIsSubmittingModal(true)}
                disabled={assignmentSubmitted}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  assignmentSubmitted
                    ? "bg-emerald-600/30 text-emerald-400 cursor-default"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 active:scale-95"
                }`}
              >
                {assignmentSubmitted ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Submitted Successfully</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Submit Work</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onAskNova && onAskNova("How do I solve the quadratic graphing assignment?")}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            >
              <Sparkles size={12} />
              <span>Ask Nova for Homework Tips</span>
            </button>
          </div>
        </div>

        {/* Modal for student submission */}
        {isSubmittingModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">
                Submit Mathematics Assignment
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Type your answer or paste your solution for Quadratic Graphs Practice.
              </p>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your calculations, vertex coordinates, or link..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsSubmittingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setAssignmentSubmitted(true);
                    setIsSubmittingModal(false);
                    classroomSync.broadcast("CHAT_MESSAGE", {
                      id: Date.now().toString(),
                      sender: "Alex Carter",
                      role: "student",
                      text: "✅ Submitted assignment: Quadratic Graphs Practice",
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
                >
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. NOTES TAB
  if (tab === "notes") {
    return (
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            rows={4}
            placeholder="Type your notes during the lecture... (auto-synced to your Notebook)"
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => onAskNova && onAskNova(`Summarize these live class notes:\n${localNotes}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium transition"
          >
            <Sparkles size={13} />
            <span>AI Bullet Summary</span>
          </button>

          <button
            onClick={handleSaveNotes}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              notesSaved
                ? "bg-emerald-600 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 active:scale-95"
            }`}
          >
            {notesSaved ? <Check size={14} /> : <Save size={14} />}
            <span>{notesSaved ? "Saved to Notebook" : "Save to Notebook"}</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. POLLS TAB
  return (
    <div className="space-y-4">
      {poll ? (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400">
              Live Classroom Poll
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {poll.totalVotes} Votes Recorded
            </span>
          </div>

          <h4 className="font-bold text-white text-sm mb-4">{poll.question}</h4>

          <div className="space-y-2.5">
            {poll.options.map((opt) => {
              const percentage =
                poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              const isSelected = selectedOption === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => !isTeacher && handleVote(opt.id)}
                  className={`relative p-3 rounded-xl border transition cursor-pointer select-none overflow-hidden ${
                    isSelected
                      ? "border-purple-500 bg-purple-950/40"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  } ${isTeacher ? "cursor-default" : ""}`}
                >
                  {/* Progress bar background fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-purple-600/25 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{opt.text}</span>
                    <span className="font-bold text-purple-300">
                      {opt.votes} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {hasVoted && !isTeacher && (
            <p className="text-[11px] text-emerald-400 mt-3 text-center">
              ✓ Vote recorded! Live results updating in real-time.
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">No active poll right now.</p>
        </div>
      )}

      {/* Teacher: Launch new poll button */}
      {isTeacher && (
        <div>
          {!isCreatingPoll ? (
            <button
              onClick={() => setIsCreatingPoll(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Plus size={14} />
              <span>Create New Poll</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreatePollSubmit}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
            >
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Create Live Question
              </h5>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Which direction does the parabola open if a > 0?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />

              <div className="space-y-2">
                {newOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[i] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setNewOptions([...newOptions, ""])}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                >
                  + Add Option
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPoll(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
                  >
                    Launch to Class
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

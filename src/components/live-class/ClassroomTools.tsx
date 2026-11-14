"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Save,
  Check,
  HelpCircle,
  Send,
  FileText,
} from "lucide-react";
import {
  ClassQuestion,
  LiveAssignment,
  LivePoll,
  SharedResource,
} from "@/lib/classroomSync";

interface ClassroomToolsProps {
  tab: "polls" | "qa" | "resources" | "assignments" | "notes";
  isTeacher?: boolean;
  userId: string;
  userName: string;
  poll: LivePoll | null;
  onVotePoll?: (optionId: string) => void;
  onCreatePoll?: (question: string, options: string[]) => void;
  questions: ClassQuestion[];
  onAskQuestion?: (question: string) => void;
  onAnswerQuestion?: (questionId: string, answer: string) => void;
  assignment: LiveAssignment;
  onSubmitAssignment?: (answerText: string) => void;
  resources: SharedResource[];
  onShareResource?: (title: string, size: string) => void;
  classNotes: string;
  onUpdateNotes?: (notes: string) => void;
  onAskNova?: (prompt: string) => void;
}

export default function ClassroomTools({
  tab,
  isTeacher = false,
  userId,
  poll,
  onVotePoll,
  onCreatePoll,
  questions,
  onAskQuestion,
  onAnswerQuestion,
  assignment,
  onSubmitAssignment,
  resources,
  onShareResource,
  classNotes,
  onUpdateNotes,
  onAskNova,
}: ClassroomToolsProps) {
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [qaInput, setQaInput] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [localNotes, setLocalNotes] = useState(classNotes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const hasVoted = Boolean(poll?.votedUserIds.includes(userId));
  const hasSubmittedAssignment = assignment.submittedUserIds.includes(userId);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2600);
  };

  const handleDownload = (res: SharedResource) => {
    const content = `LEARNOVA STUDY MATERIAL\nTitle: ${res.title}\nSession: 2025/2026 Second Term\n\nSummary Notes:\n${localNotes}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${res.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${res.title}"`);
  };

  const handleSaveNotes = () => {
    onUpdateNotes?.(localNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2200);
    try {
      const existing = localStorage.getItem("learnova_notes");
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.unshift({
        id: Date.now().toString(),
        title: `Live Class Notes (${new Date().toLocaleDateString("en-NG")})`,
        content: localNotes,
        date: new Date().toISOString(),
        folder: "Live Classes",
      });
      localStorage.setItem("learnova_notes", JSON.stringify(parsed));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="space-y-3">
      {actionToast && (
        <div className="rounded-xl border border-[#22D3EE]/35 bg-[#06B6D4]/15 px-3 py-2 text-xs font-semibold text-[#67E8F9]">
          {actionToast}
        </div>
      )}

      {/* POLLS */}
      {tab === "polls" && (
        <div className="space-y-3">
          {poll ? (
            <div className="rounded-xl border border-white/10 bg-[#121A4A] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#22D3EE]">Live Class Poll</span>
                <span className="text-slate-400 tabular-nums">
                  {poll.totalVotes} votes
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{poll.question}</h4>
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const pct =
                    poll.totalVotes > 0
                      ? Math.round((opt.votes / poll.totalVotes) * 100)
                      : 0;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isTeacher || hasVoted}
                      onClick={() => onVotePoll?.(opt.id)}
                      className="relative w-full text-left p-2.5 rounded-lg border border-white/10 bg-[#0D1438] hover:border-[#7C3AED] disabled:hover:border-white/10 overflow-hidden transition"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[#4F46E5]/35 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between text-xs gap-3">
                        <span className="text-slate-100 font-medium">{opt.text}</span>
                        <span className="font-bold text-[#C4B5FD] tabular-nums shrink-0">
                          {opt.votes} ({pct}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {hasVoted && !isTeacher && (
                <p className="text-[11px] text-emerald-400 font-semibold">
                  Your vote has been recorded.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#121A4A] p-5 text-center text-xs text-slate-400">
              No active poll right now.
            </div>
          )}

          {isTeacher &&
            (!isCreatingPoll ? (
              <button
                onClick={() => setIsCreatingPoll(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Plus size={14} />
                Launch New Poll
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const opts = newOptions.map((o) => o.trim()).filter(Boolean);
                  if (!newQuestion.trim() || opts.length < 2) return;
                  onCreatePoll?.(newQuestion.trim(), opts);
                  setIsCreatingPoll(false);
                  setNewQuestion("");
                  setNewOptions(["", ""]);
                  showToast("Poll launched to all students.");
                }}
                className="rounded-xl border border-white/15 bg-[#121A4A] p-4 space-y-2.5"
              >
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter poll question..."
                  className="w-full h-9 px-3 rounded-lg border border-white/15 bg-[#070D24] text-xs text-white placeholder-slate-400"
                />
                {newOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const next = [...newOptions];
                      next[idx] = e.target.value;
                      setNewOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full h-8 px-3 rounded-lg border border-white/15 bg-[#070D24] text-xs text-white placeholder-slate-400"
                  />
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setNewOptions([...newOptions, ""])}
                    className="text-xs font-bold text-[#22D3EE]"
                  >
                    + Add Option
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPoll(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold"
                    >
                      Launch
                    </button>
                  </div>
                </div>
              </form>
            ))}
        </div>
      )}

      {/* Q&A TAB */}
      {tab === "qa" && (
        <div className="space-y-3">
          {!isTeacher && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!qaInput.trim()) return;
                onAskQuestion?.(qaInput.trim());
                setQaInput("");
                showToast("Question submitted to the teacher Q&A queue.");
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                placeholder="Ask a question for the teacher..."
                className="flex-1 h-9 px-3 rounded-xl border border-white/15 bg-[#121A4A] text-xs text-white placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-3.5 h-9 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Send size={13} />
                Ask
              </button>
            </form>
          )}

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-white/10 bg-[#121A4A] p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-200">{q.authorName}</span>
                  <span>
                    {q.timestamp} · {q.resolved ? "Answered" : "Open"}
                  </span>
                </div>
                <p className="text-slate-100 font-medium flex items-start gap-2">
                  <HelpCircle size={14} className="text-[#22D3EE] shrink-0 mt-0.5" />
                  <span>{q.question}</span>
                </p>

                {q.answer && (
                  <div className="rounded-lg bg-[#4F46E5]/20 border border-[#7C3AED]/40 px-3 py-2 text-slate-100">
                    <span className="font-bold text-[#22D3EE]">{q.answeredBy || "Teacher"}: </span>
                    {q.answer}
                  </div>
                )}

                {isTeacher && !q.resolved && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyDrafts[q.id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Write a short answer..."
                      className="flex-1 h-8 px-2.5 rounded-lg border border-white/15 bg-[#070D24] text-xs text-white placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const ans = (replyDrafts[q.id] || "").trim();
                        if (!ans) return;
                        onAnswerQuestion?.(q.id, ans);
                        setReplyDrafts((prev) => ({ ...prev, [q.id]: "" }));
                      }}
                      className="px-3 h-8 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-bold"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === "resources" && (
        <div className="space-y-2.5">
          {resources.map((res) => (
            <div
              key={res.id}
              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#121A4A] gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5]/20 text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{res.title}</p>
                  <p className="text-[11px] text-slate-400">{res.size}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(res)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shrink-0 whitespace-nowrap"
              >
                <Download size={13} />
                Download
              </button>
            </div>
          ))}

          {isTeacher &&
            (!isAddingResource ? (
              <button
                onClick={() => setIsAddingResource(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#7C3AED] text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
              >
                <Upload size={14} />
                Share Class Resource
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newResourceTitle.trim()) return;
                  onShareResource?.(newResourceTitle.trim(), "950 KB");
                  setNewResourceTitle("");
                  setIsAddingResource(false);
                  showToast("Material shared to all connected students.");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  placeholder="Enter document or past question title..."
                  className="flex-1 h-9 px-3 rounded-lg border border-white/15 bg-[#121A4A] text-xs text-white placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold"
                >
                  Share
                </button>
              </form>
            ))}
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {tab === "assignments" && (
        <div className="rounded-xl border border-white/10 bg-[#121A4A] p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#22D3EE]">Active Task</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{assignment.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{assignment.description}</p>
            </div>
            <div className="text-right text-[11px] text-slate-400 tabular-nums shrink-0">
              <p className="flex items-center gap-1 text-[#F59E0B] font-semibold">
                <Clock size={12} />
                {assignment.dueDate}
              </p>
              <p className="mt-1">
                {assignment.submittedUserIds.length} submitted in session
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            {isTeacher ? (
              <span className="text-xs text-[#22D3EE] font-semibold">
                Visible to all students in this classroom
              </span>
            ) : (
              <button
                onClick={() => setIsSubmittingModal(true)}
                disabled={hasSubmittedAssignment}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
                  hasSubmittedAssignment
                    ? "bg-emerald-600/25 text-emerald-300"
                    : "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white"
                }`}
              >
                {hasSubmittedAssignment ? <CheckCircle2 size={14} /> : <Upload size={14} />}
                {hasSubmittedAssignment ? "Submitted" : "Submit Answer"}
              </button>
            )}

            {onAskNova && (
              <button
                onClick={() => onAskNova(`Help me approach this task: ${assignment.title}`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#C4B5FD] hover:underline whitespace-nowrap"
              >
                <Sparkles size={13} />
                Ask Nova for Hints
              </button>
            )}
          </div>

          {isSubmittingModal && (
            <div className="fixed inset-0 z-50 bg-[#070D24]/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-[#E4E1F5] bg-white text-[#0B1230] p-6 space-y-4 shadow-2xl">
                <h3 className="landing-display text-base font-extrabold">{assignment.title}</h3>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Write your working steps and final answer..."
                  className="w-full rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] p-3 text-xs text-[#0B1230] focus:outline-none focus:border-[#7C3AED]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsSubmittingModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E4E1F5] text-xs font-bold text-[#4A5073] hover:bg-[#FAF8FF]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onSubmitAssignment?.(submissionText);
                      setIsSubmittingModal(false);
                      setSubmissionText("");
                      showToast("Assignment submitted.");
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold"
                  >
                    Submit Work
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {tab === "notes" && (
        <div className="space-y-3">
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            rows={4}
            placeholder="Write class notes here..."
            className="w-full rounded-xl border border-white/15 bg-[#121A4A] p-3.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {onAskNova && (
              <button
                onClick={() => onAskNova(`Summarize these class notes cleanly:\n${localNotes}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-[#C4B5FD] whitespace-nowrap transition"
              >
                <Sparkles size={13} />
                Summarize with Nova
              </button>
            )}
            <button
              onClick={handleSaveNotes}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                notesSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white"
              }`}
            >
              {notesSaved ? <Check size={13} /> : <Save size={13} />}
              {notesSaved ? "Saved to Notebook" : "Save Notes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  BookOpenCheck,
  Layers,
  CalendarRange,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminAcademicsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  // New class level
  const [lvlCode, setLvlCode] = useState("");
  const [lvlName, setLvlName] = useState("");
  const [lvlCat, setLvlCat] = useState<"JSS" | "SSS" | "PRIMARY" | "OTHER">("SSS");

  // New subject
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subDept, setSubDept] = useState<"Core" | "Science" | "Commercial" | "Arts">("Core");
  const [subDesc, setSubDesc] = useState("");
  const [subLevels, setSubLevels] = useState<string[]>([]);

  // New term
  const [termName, setTermName] = useState("");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");

  const loadAcademics = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/academics", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setClassLevels(json.classLevels || []);
      setSubjects(json.subjects || []);
      setSessions(json.sessions || []);
      setTerms(json.terms || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAcademics();
  }, [loadAcademics]);

  const postAction = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setFeedback({ type: "ok", text: okMessage });
      await loadAcademics();
      return true;
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleSubLevel = (id: string) => {
    setSubLevels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              Curriculum &amp; School Structure
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Class Levels, Subjects &amp; Academic Terms
            </h1>
            <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
              Configure Nigerian secondary/primary class levels (JSS1–SS3 or custom), map
              subjects to eligible class levels, and manage active academic sessions and terms.
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading academic structure...
            </div>
          ) : (
            <div className="space-y-8">
              {/* CLASS LEVELS SECTION */}
              <div className="grid lg:grid-cols-3 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await postAction(
                      {
                        action: "CREATE_CLASS_LEVEL",
                        code: lvlCode,
                        name: lvlName,
                        category: lvlCat,
                      },
                      `Class level ${lvlCode.toUpperCase()} added.`
                    );
                    if (ok) {
                      setLvlCode("");
                      setLvlName("");
                    }
                  }}
                  className="learnova-card p-5 space-y-4 h-fit"
                >
                  <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                    <Layers size={16} className="text-[#4F46E5]" />
                    Add Class Level
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Code
                      </label>
                      <input
                        required
                        value={lvlCode}
                        onChange={(e) => setLvlCode(e.target.value)}
                        placeholder="e.g. PRY6"
                        className="learnova-input text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Category
                      </label>
                      <select
                        value={lvlCat}
                        onChange={(e) => setLvlCat(e.target.value as any)}
                        className="learnova-input text-sm"
                      >
                        <option value="JSS">JSS</option>
                        <option value="SSS">SSS</option>
                        <option value="PRIMARY">PRIMARY</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Full Display Name
                    </label>
                    <input
                      required
                      value={lvlName}
                      onChange={(e) => setLvlName(e.target.value)}
                      placeholder="e.g. Primary 6 (Common Entrance)"
                      className="learnova-input text-sm"
                    />
                  </div>
                  <button
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shadow-xs"
                  >
                    Add Class Level
                  </button>
                </form>

                <div className="lg:col-span-2 learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Configured Class Levels ({classLevels.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-[#E4E1F5]">
                    {classLevels.map((lvl) => (
                      <div
                        key={lvl.id}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#0B1230]">{lvl.code}</span>
                          <span className="text-sm text-[#43466E] ml-2">{lvl.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-bold ${
                              lvl.isActive ? "text-emerald-700" : "text-[#6B6F94]"
                            }`}
                          >
                            {lvl.isActive ? "Active" : "Disabled"}
                          </span>
                          <button
                            disabled={saving}
                            onClick={() =>
                              postAction(
                                { action: "TOGGLE_CLASS_LEVEL", id: lvl.id },
                                `Updated ${lvl.code}.`
                              )
                            }
                            className="px-3 py-1 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                          >
                            {lvl.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUBJECTS SECTION */}
              <div className="grid lg:grid-cols-3 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await postAction(
                      {
                        action: "CREATE_SUBJECT",
                        name: subName,
                        code: subCode,
                        department: subDept,
                        description: subDesc,
                        classLevelIds: subLevels,
                      },
                      `Subject ${subName} created.`
                    );
                    if (ok) {
                      setSubName("");
                      setSubCode("");
                      setSubDesc("");
                      setSubLevels([]);
                    }
                  }}
                  className="learnova-card p-5 space-y-4 h-fit"
                >
                  <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                    <BookOpenCheck size={16} className="text-[#4F46E5]" />
                    Create Subject
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Subject Name
                      </label>
                      <input
                        required
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        placeholder="Agricultural Science"
                        className="learnova-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Code
                      </label>
                      <input
                        required
                        value={subCode}
                        onChange={(e) => setSubCode(e.target.value)}
                        placeholder="AGR"
                        className="learnova-input text-sm uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Department
                    </label>
                    <select
                      value={subDept}
                      onChange={(e) => setSubDept(e.target.value as any)}
                      className="learnova-input text-sm"
                    >
                      <option value="Core">Core</option>
                      <option value="Science">Science</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                      Eligible Class Levels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {classLevels.map((lvl) => (
                        <button
                          type="button"
                          key={lvl.id}
                          onClick={() => toggleSubLevel(lvl.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            subLevels.includes(lvl.id)
                              ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                              : "bg-[#FAF8FF] text-[#43466E] border-[#DCD7F5]"
                          }`}
                        >
                          {lvl.code}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Syllabus Summary
                    </label>
                    <textarea
                      rows={2}
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                      className="learnova-input text-sm"
                    />
                  </div>
                  <button
                    disabled={saving || subLevels.length === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-xs"
                  >
                    <Plus size={14} className="inline mr-1" />
                    Add Subject
                  </button>
                </form>

                <div className="lg:col-span-2 learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Subjects Registry ({subjects.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-[#E4E1F5]">
                    {subjects.map((sub) => {
                      const levelCodes = (sub.classLevelIds || [])
                        .map((id: string) => classLevels.find((c) => c.id === id)?.code)
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <div
                          key={sub.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#0B1230]">{sub.name}</span>
                              <span className="text-xs font-semibold text-[#6B6F94]">
                                ({sub.code} · {sub.department})
                              </span>
                            </div>
                            <p className="text-xs text-[#6B6F94] mt-0.5">{sub.description}</p>
                            <p className="text-xs font-semibold text-[#4F46E5] mt-1">
                              Levels: {levelCodes || "None"}
                            </p>
                          </div>
                          <button
                            disabled={saving}
                            onClick={() =>
                              postAction(
                                { action: "TOGGLE_SUBJECT", id: sub.id },
                                `Updated ${sub.name}.`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] shrink-0 transition"
                          >
                            {sub.isActive ? "Active · Disable" : "Disabled · Enable"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TERMS & SESSIONS */}
              <div className="grid lg:grid-cols-3 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await postAction(
                      {
                        action: "CREATE_TERM",
                        sessionId: sessions[0]?.id,
                        name: termName,
                        startsAt: termStart,
                        endsAt: termEnd,
                      },
                      `Term "${termName}" added.`
                    );
                    if (ok) {
                      setTermName("");
                      setTermStart("");
                      setTermEnd("");
                    }
                  }}
                  className="learnova-card p-5 space-y-4 h-fit"
                >
                  <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                    <CalendarRange size={16} className="text-[#4F46E5]" />
                    Add Academic Term
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Term Name
                    </label>
                    <input
                      required
                      value={termName}
                      onChange={(e) => setTermName(e.target.value)}
                      placeholder="e.g. Summer Revision Term"
                      className="learnova-input text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Start Date
                      </label>
                      <input
                        required
                        type="date"
                        value={termStart}
                        onChange={(e) => setTermStart(e.target.value)}
                        className="learnova-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        End Date
                      </label>
                      <input
                        required
                        type="date"
                        value={termEnd}
                        onChange={(e) => setTermEnd(e.target.value)}
                        className="learnova-input text-sm"
                      />
                    </div>
                  </div>
                  <button
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-[#0B1230] hover:bg-[#151A44] text-white text-sm font-bold transition"
                  >
                    Create Term
                  </button>
                </form>

                <div className="lg:col-span-2 learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Academic Sessions &amp; Terms
                    </h2>
                  </div>
                  <div className="divide-y divide-[#E4E1F5]">
                    {terms.map((t) => (
                      <div
                        key={t.id}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-[#0B1230]">{t.name}</p>
                          <p className="text-xs text-[#6B6F94] tabular-nums">
                            {t.startsAt} → {t.endsAt}
                          </p>
                        </div>
                        {t.isCurrent ? (
                          <span className="text-xs font-bold text-[#4F46E5]">
                            Current Active Term
                          </span>
                        ) : (
                          <button
                            disabled={saving}
                            onClick={() =>
                              postAction(
                                { action: "SET_CURRENT_TERM", termId: t.id },
                                `${t.name} set as active term.`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                          >
                            Set Current Term
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

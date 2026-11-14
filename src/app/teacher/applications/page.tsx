"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  FileBadge2,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Award,
} from "lucide-react";

export default function TeacherApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);

  // Application form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");
  const [institution, setInstitution] = useState("");
  const [experience, setExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setApplications(json.applications || []);
      setApprovals(json.approvals || []);
      setSubjects(json.subjects || []);
      setClassLevels(json.classLevels || []);
      if (!subjectId && (json.subjects || []).length > 0) {
        setSubjectId(json.subjects[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSubject = subjects.find((s) => s.id === subjectId);
  const eligibleLevelsForSubject = classLevels.filter(
    (c) => !activeSubject || (activeSubject.classLevelIds || []).includes(c.id)
  );

  const toggleLevel = (id: string) => {
    setSelectedLevels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitForm = async (action: "SAVE_DRAFT" | "SUBMIT_APPLICATION") => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          applicationId: editingId || undefined,
          subjectId,
          classLevelIds: selectedLevels,
          qualification,
          institution,
          experience,
          licenseNumber,
          bio,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save application.");
      setFeedback({
        type: "ok",
        text:
          action === "SAVE_DRAFT"
            ? "Application saved as draft."
            : "Application submitted for School Admin review.",
      });
      setEditingId(null);
      setSelectedLevels([]);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
              Educator Accreditation &amp; Teaching Scope
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold mt-1">
              Subject Teaching Applications
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Apply to teach specific Nigerian syllabus subjects across JSS or SSS class levels.
              Once School Admin approves a subject-level pair, you become eligible for official
              timetable assignment.
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
              Loading teaching applications...
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* New / Edit Application Form */}
              <div className="learnova-card p-5 space-y-4 h-fit">
                <h2 className="landing-display text-base font-bold text-[#0B1230] flex items-center gap-2">
                  <FileBadge2 size={16} className="text-[#4F46E5]" />
                  {editingId ? "Update Application" : "Apply to Teach a Subject"}
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setSelectedLevels([]);
                    }}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                    Class Levels You Can Teach
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eligibleLevelsForSubject.map((lvl) => {
                      const active = selectedLevels.includes(lvl.id);
                      return (
                        <button
                          type="button"
                          key={lvl.id}
                          onClick={() => toggleLevel(lvl.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            active
                              ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-[#4F46E5]"
                              : "bg-[#FAF8FF] text-[#43466E] border-[#E4E1F5] hover:bg-[#F5F3FF]"
                          }`}
                        >
                          {lvl.code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1">
                    Highest Qualification
                  </label>
                  <input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. B.Sc. (Ed.) Mathematics, PGDE"
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Institution
                    </label>
                    <input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="University of Lagos"
                      className="learnova-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Experience
                    </label>
                    <input
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="5 years"
                      className="learnova-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1">
                    TRCN / Teaching License Number (Optional)
                  </label>
                  <input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="TRCN/LAG/..."
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1">
                    Teaching Notes / Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || selectedLevels.length === 0}
                    onClick={() => submitForm("SAVE_DRAFT")}
                    className="flex-1 py-2.5 rounded-xl border border-[#DCD7F5] text-[#43466E] text-xs font-semibold hover:bg-[#FAF8FF] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || selectedLevels.length === 0}
                    onClick={() => submitForm("SUBMIT_APPLICATION")}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow-sm"
                  >
                    <Send size={13} /> Submit for Approval
                  </button>
                </div>
              </div>

              {/* Applications History & Approved Badges */}
              <div className="lg:col-span-2 space-y-6 min-w-0">
                {/* Approved Authorizations */}
                <div className="learnova-card p-5">
                  <h2 className="landing-display text-base font-bold text-[#0B1230] flex items-center gap-2 mb-3">
                    <Award size={16} className="text-[#4F46E5]" />
                    Approved Subjects &amp; Class Levels ({approvals.filter((a) => a.status === "APPROVED").length})
                  </h2>
                  {approvals.filter((a) => a.status === "APPROVED").length === 0 ? (
                    <p className="text-xs text-[#6B6F94]">
                      You have no approved subject-level authorizations yet. Submit an
                      application on the left for School Admin review.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {approvals
                        .filter((a) => a.status === "APPROVED")
                        .map((ap) => (
                          <div
                            key={ap.id}
                            className="px-3.5 py-2.5 rounded-xl bg-[#F5F3FF] border border-[#DCD7F5] text-[#4F46E5] text-xs font-bold"
                          >
                            {ap.subjectName} · {ap.classLevelName}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Application History */}
                <div className="learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5]">
                    <h2 className="landing-display text-base font-bold text-[#0B1230]">
                      Submitted Applications ({applications.length})
                    </h2>
                  </div>
                  {applications.length === 0 ? (
                    <div className="p-10 text-center text-xs text-[#6B6F94]">
                      No subject applications recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E4E1F5]">
                      {applications.map((app) => (
                        <div key={app.id} className="p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-[#0B1230]">{app.subjectName}</p>
                              <p className="text-xs text-[#6B6F94]">
                                Requested Levels:{" "}
                                {(app.classLevelIds || []).map(levelCode).join(", ")} ·{" "}
                                {app.qualification}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-bold shrink-0 ${
                                app.status === "APPROVED"
                                  ? "text-emerald-700"
                                  : app.status === "PENDING_REVIEW"
                                  ? "text-amber-700"
                                  : app.status === "DRAFT"
                                  ? "text-[#6B6F94]"
                                  : "text-rose-700"
                              }`}
                            >
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {app.adminExplanation && (
                            <p className="text-xs bg-[#FAF8FF] border border-[#E4E1F5] rounded-xl px-3 py-2 text-[#43466E]">
                              <strong className="text-[#0B1230]">Admin Note:</strong> {app.adminExplanation}
                            </p>
                          )}
                          {(app.status === "DRAFT" || app.status === "RESUBMISSION_REQUIRED") && (
                            <button
                              onClick={() => {
                                setEditingId(app.id);
                                setSubjectId(app.subjectId);
                                setSelectedLevels(app.classLevelIds || []);
                                setQualification(app.qualification || "");
                                setInstitution(app.institution || "");
                                setExperience(app.experience || "");
                                setLicenseNumber(app.licenseNumber || "");
                                setBio(app.bio || "");
                              }}
                              className="text-xs font-bold text-[#4F46E5] hover:underline"
                            >
                              Edit &amp; Resubmit Application →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

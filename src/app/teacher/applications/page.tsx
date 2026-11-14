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
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              Educator Accreditation & Teaching Scope
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
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
                  ? "bg-teal-50 text-[#0D9488] border-teal-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading teaching applications...
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* New / Edit Application Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
                <h2 className="text-base font-bold text-[#0F1F38] flex items-center gap-2">
                  <FileBadge2 size={16} className="text-[#0D9488]" />
                  {editingId ? "Update Application" : "Apply to Teach a Subject"}
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setSelectedLevels([]);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
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
                              ? "bg-[#0D9488] text-white border-[#0D9488]"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {lvl.code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Highest Qualification
                  </label>
                  <input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. B.Sc. (Ed.) Mathematics, PGDE"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Institution
                    </label>
                    <input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="University of Lagos"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Experience
                    </label>
                    <input
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="5 years"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    TRCN / Teaching License Number (Optional)
                  </label>
                  <input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="TRCN/LAG/..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teaching Notes / Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || selectedLevels.length === 0}
                    onClick={() => submitForm("SAVE_DRAFT")}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || selectedLevels.length === 0}
                    onClick={() => submitForm("SUBMIT_APPLICATION")}
                    className="flex-1 py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-teal-700 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} /> Submit for Approval
                  </button>
                </div>
              </div>

              {/* Applications History & Approved Badges */}
              <div className="lg:col-span-2 space-y-6">
                {/* Approved Authorizations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-[#0F1F38] flex items-center gap-2 mb-3">
                    <Award size={16} className="text-[#0D9488]" />
                    Approved Subjects & Class Levels ({approvals.filter((a) => a.status === "APPROVED").length})
                  </h2>
                  {approvals.filter((a) => a.status === "APPROVED").length === 0 ? (
                    <p className="text-xs text-slate-500">
                      You have no approved subject-level authorizations yet. Submit an
                      application on the left for School Admin review.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {approvals
                        .filter((a) => a.status === "APPROVED")
                        .map((ap) => (
                          <span
                            key={ap.id}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-bold"
                          >
                            {ap.subjectName} — {ap.classLevelName}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Application History */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-[#0F1F38]">
                      Submitted Applications ({applications.length})
                    </h2>
                  </div>
                  {applications.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      No subject applications recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {applications.map((app) => (
                        <div key={app.id} className="p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-[#0B1F3A]">{app.subjectName}</p>
                              <p className="text-xs text-slate-500">
                                Requested Levels:{" "}
                                {(app.classLevelIds || []).map(levelCode).join(", ")} ·{" "}
                                {app.qualification}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg w-fit ${
                                app.status === "APPROVED"
                                  ? "bg-teal-50 text-[#0D9488]"
                                  : app.status === "PENDING_REVIEW"
                                  ? "bg-amber-50 text-amber-800"
                                  : app.status === "DRAFT"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {app.adminExplanation && (
                            <p className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700">
                              <strong>Admin Note:</strong> {app.adminExplanation}
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
                              className="text-xs font-bold text-[#0D9488] hover:underline"
                            >
                              Edit & Resubmit Application →
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

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import DocumentPreviewModal from "@/components/admin/teacher-review/DocumentPreviewModal";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import {
  FileBadge2,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Award,
  Clock,
  ShieldAlert,
  Upload,
  Eye,
  FileCheck2,
  ArrowRight,
  History,
} from "lucide-react";

type DocField =
  | "profilePhoto"
  | "teachingCertificate"
  | "degreeCertificate"
  | "governmentId"
  | "cv";

const DOC_FIELDS: Array<{ key: DocField; label: string; accept: string }> = [
  { key: "teachingCertificate", label: "Teaching Certificate", accept: ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" },
  { key: "degreeCertificate", label: "Degree Certificate", accept: ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" },
  { key: "governmentId", label: "Government ID", accept: ".pdf,.png,.jpg,.jpeg,.webp" },
  { key: "cv", label: "CV / Resume", accept: ".pdf,.doc,.docx" },
];

export default function TeacherApplicationsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
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

  // Resubmission document updates
  const [newDocs, setNewDocs] = useState<Partial<Record<DocField, string>>>({});
  const [resubmissionNote, setResubmissionNote] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ title: string; file?: string } | null>(null);

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

  const handleUploadDoc = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: DocField
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: "err", text: "Each uploaded document must be under 10 MB." });
      return;
    }
    try {
      setUploadingField(field);
      setFeedback(null);
      const storageRef = await uploadFile(file, field);
      setNewDocs((prev) => ({ ...prev, [field]: storageRef }));
      setFeedback({ type: "ok", text: `Uploaded updated ${field}. Click Submit Updated Credentials to notify Admin.` });
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Upload failed." });
    } finally {
      setUploadingField(null);
    }
  };

  const submitResubmission = async () => {
    setResubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPLOAD_RESUBMISSION_DOCS",
          documentUrls: newDocs,
          note: resubmissionNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit documents.");
      setNewDocs({});
      setResubmissionNote("");
      setFeedback({
        type: "ok",
        text: "Updated credentials submitted and queued for administrator verification.",
      });
      await Promise.all([loadData(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Resubmission failed." });
    } finally {
      setResubmitting(false);
    }
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
          documentUrls: Object.keys(newDocs).length > 0 ? newDocs : undefined,
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
      await Promise.all([loadData(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  // Aggregate current documents across latest applications
  const currentDocs: Record<DocField, string | undefined> = {
    profilePhoto: applications.find((a) => a.documentUrls?.profilePhoto)?.documentUrls?.profilePhoto,
    teachingCertificate: applications.find((a) => a.documentUrls?.teachingCertificate)?.documentUrls?.teachingCertificate,
    degreeCertificate: applications.find((a) => a.documentUrls?.degreeCertificate)?.documentUrls?.degreeCertificate,
    governmentId: applications.find((a) => a.documentUrls?.governmentId)?.documentUrls?.governmentId,
    cv: applications.find((a) => a.documentUrls?.cv)?.documentUrls?.cv,
  };

  const hasUnderReview = applications.some((a) => a.status === "UNDER_REVIEW");
  const hasResubmissionReq = applications.some((a) => a.status === "RESUBMISSION_REQUIRED");
  const approvedList = approvals.filter((a) => a.status === "APPROVED");
  const isVerifiedAccount = user?.status === "ACTIVE";

  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            kicker="Educator Accreditation & Verification Portal"
            title="Verification Status & Subject Applications"
            description="Track your educator approval status, update verification credentials if requested by School Administration, and manage your approved subject-level scope."
            actions={
              isVerifiedAccount ? (
                <Link
                  href="/teacher"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold shadow-xs transition"
                >
                  Open Educator Dashboard <ArrowRight size={14} />
                </Link>
              ) : undefined
            }
          />

          {/* Account Verification Banner */}
          <div
            className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isVerifiedAccount
                ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30"
                : user?.status === "SUSPENDED" || user?.status === "REJECTED"
                ? "border-rose-300 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/30"
                : "border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isVerifiedAccount
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : user?.status === "SUSPENDED" || user?.status === "REJECTED"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isVerifiedAccount ? (
                  <CheckCircle2 size={20} />
                ) : user?.status === "SUSPENDED" || user?.status === "REJECTED" ? (
                  <ShieldAlert size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-[var(--foreground)]">
                  {isVerifiedAccount
                    ? "Educator Account Verified & Active"
                    : user?.status === "SUSPENDED"
                    ? "Account Suspended by Administration"
                    : user?.status === "REJECTED"
                    ? "Verification Not Approved"
                    : hasResubmissionReq
                    ? "Additional Documents or Clarification Requested"
                    : hasUnderReview
                    ? "Application Currently Under Review"
                    : "Application Pending Administrator Verification"}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed max-w-2xl">
                  {isVerifiedAccount
                    ? `You hold ${approvedList.length} approved subject-level teaching authorization(s). You have full access to your Educator Dashboard, classrooms, and lesson publishing.`
                    : user?.status === "SUSPENDED"
                    ? "Your teaching access is temporarily suspended. Please review administrator notes below or contact school leadership."
                    : hasResubmissionReq
                    ? "School Administration requested updated verification details or clearer documents. Upload updated files below and submit for re-review."
                    : "Your Educator Dashboard and classroom tools remain locked until School Administration completes document verification and approves your first subject assignment."}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] shrink-0 self-start md:self-center">
              Status: {user?.status || "PENDING"}
            </span>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <CardSkeleton lines={6} />
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Subject Application + Document Resubmission */}
              <div className="space-y-6">
                {/* Submitted Credentials & Resubmission */}
                <div className="learnova-card p-6 space-y-4">
                  <div>
                    <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                      Verification Credentials
                    </h2>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                      Preview uploaded files or attach updated documents for administrator re-review.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {DOC_FIELDS.map((doc) => {
                      const existingUrl = currentDocs[doc.key];
                      const stagedNew = Boolean(newDocs[doc.key]);
                      return (
                        <div
                          key={doc.key}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--foreground)]">
                              {doc.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {stagedNew ? (
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                  <FileCheck2 size={12} /> Staged
                                </span>
                              ) : existingUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({ title: doc.label, file: existingUrl })
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                                >
                                  <Eye size={12} /> Preview
                                </button>
                              ) : (
                                <span className="text-[11px] text-[var(--foreground-subtle)]">
                                  Missing
                                </span>
                              )}
                            </div>
                          </div>
                          <input
                            type="file"
                            accept={doc.accept}
                            disabled={uploadingField === doc.key}
                            onChange={(e) => handleUploadDoc(e, doc.key)}
                            className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] p-1.5 text-[11px] text-[var(--foreground-muted)] file:mr-2 file:rounded-md file:border-0 file:bg-indigo-500/12 file:px-2.5 file:py-1 file:text-[11px] file:font-bold file:text-[#4F46E5] dark:file:text-[#A5B4FC]"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Note for Reviewer (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={resubmissionNote}
                      onChange={(e) => setResubmissionNote(e.target.value)}
                      placeholder="Explain any newly attached certificate or clarification..."
                      className="learnova-input w-full px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={
                      resubmitting ||
                      Boolean(uploadingField) ||
                      (Object.keys(newDocs).length === 0 && !resubmissionNote.trim())
                    }
                    onClick={submitResubmission}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow-sm"
                  >
                    <Send size={13} />
                    {resubmitting ? "Submitting..." : "Submit Updated Credentials"}
                  </button>
                </div>

                {/* New / Edit Subject Application Form */}
                <div className="learnova-card p-6 space-y-4">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <FileBadge2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    {editingId ? "Update Subject Application" : "Apply for Additional Subject"}
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
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
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap ${
                              active
                                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-indigo-600"
                                : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--surface-subtle)]"
                            }`}
                          >
                            {lvl.code}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
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
                      <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
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
                      <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
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
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      TRCN / License Number (Optional)
                    </label>
                    <input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="TRCN/LAG/..."
                      className="learnova-input w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
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
                      className="flex-1 py-2.5 rounded-xl border border-[var(--border-strong)] text-[var(--foreground-muted)] text-xs font-semibold hover:bg-[var(--surface-lavender)] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition whitespace-nowrap"
                    >
                      <Save size={13} /> Save Draft
                    </button>
                    <button
                      type="button"
                      disabled={saving || selectedLevels.length === 0}
                      onClick={() => submitForm("SUBMIT_APPLICATION")}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
                    >
                      <Send size={13} /> Submit
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Approved Badges + Application History & Timeline */}
              <div className="lg:col-span-2 space-y-6 min-w-0">
                <div className="learnova-card p-6">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
                    <Award size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Approved Subjects &amp; Class Levels ({approvedList.length})
                  </h2>
                  {approvedList.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      No approved subject-level authorizations yet. Once School Administration verifies your documents and approves your requested levels, they appear here.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {approvedList.map((ap) => (
                        <div
                          key={ap.id}
                          className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border-strong)] text-indigo-600 dark:text-indigo-300 text-xs font-bold"
                        >
                          {ap.subjectName} · {ap.classLevelName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="learnova-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                      Submitted Applications ({applications.length})
                    </h2>
                  </div>
                  {applications.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={FileBadge2}
                        title="No subject applications recorded yet"
                        description="Submit an application using the form on the left to request subject-level verification."
                      />
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {applications.map((app) => (
                        <div key={app.id} className="p-5 sm:px-6 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-[var(--foreground)]">{app.subjectName}</p>
                              <p className="text-xs text-[var(--foreground-subtle)]">
                                Requested Levels:{" "}
                                {(app.classLevelIds || []).map(levelCode).join(", ")} ·{" "}
                                {app.qualification}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-bold shrink-0 ${
                                app.status === "APPROVED"
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : app.status === "PENDING_REVIEW" || app.status === "UNDER_REVIEW"
                                  ? "text-amber-700 dark:text-amber-300"
                                  : app.status === "DRAFT"
                                  ? "text-[var(--foreground-subtle)]"
                                  : "text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          {app.adminExplanation && (
                            <p className="text-xs bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--foreground-muted)]">
                              <strong className="text-[var(--foreground)]">Administrator Feedback:</strong>{" "}
                              {app.adminExplanation}
                            </p>
                          )}

                          {Array.isArray(app.statusHistory) && app.statusHistory.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[11px] font-bold text-[var(--foreground-subtle)] flex items-center gap-1">
                                <History size={12} /> Review Progress Timeline
                              </p>
                              <div className="space-y-1 pl-2 border-l border-[var(--border)]">
                                {app.statusHistory.map((h: any, idx: number) => (
                                  <div key={idx} className="text-[11px] text-[var(--foreground-muted)] flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-[var(--foreground)]">
                                      {String(h.status).replace(/_/g, " ")}
                                    </span>
                                    <span>· by {h.actorName}</span>
                                    {h.note && <span>— {h.note}</span>}
                                    <span className="text-[var(--foreground-subtle)] tabular-nums">
                                      ({new Date(h.at).toLocaleDateString()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(app.status === "DRAFT" || app.status === "RESUBMISSION_REQUIRED") && (
                            <button
                              type="button"
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
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Edit &amp; Resubmit Subject Details →
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

        <DocumentPreviewModal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title || "Verification Document"}
          file={previewDoc?.file}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

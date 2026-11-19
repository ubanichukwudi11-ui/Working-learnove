"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import DocumentPreviewModal from "@/components/admin/teacher-review/DocumentPreviewModal";
import {
  formatApplicationStatusLabel,
  getStatusTextColor,
} from "@/lib/teacherStatus";
import {
  FileBadge2,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Award,
  Clock,
  ShieldAlert,
  Eye,
  UploadCloud,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function TeacherApplicationsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);

  // Application form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");
  const [institution, setInstitution] = useState("");
  const [experience, setExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");
  const [docRefs, setDocRefs] = useState<Record<string, string>>({});
  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>({});

  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    file: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      setApplications(json.applications || []);
      setApprovals(json.approvals || []);
      setTeacherProfile(json.teacherProfile || null);
      setSubjects(json.subjects || []);
      setClassLevels(json.classLevels || []);

      if (!subjectId && (json.subjects || []).length > 0) {
        setSubjectId(json.subjects[0].id);
      }
      if (json.teacherProfile) {
        setQualification((prev) => prev || json.teacherProfile.qualification || "");
        setInstitution((prev) => prev || json.teacherProfile.institution || "");
        setExperience((prev) => prev || json.teacherProfile.experience || "");
        setLicenseNumber((prev) => prev || json.teacherProfile.licenseNumber || "");
        setBio((prev) => prev || json.teacherProfile.bio || "");
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

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key:
      | "teachingCertificate"
      | "degreeCertificate"
      | "cv"
      | "governmentId"
      | "profilePhoto"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(key);
      setFeedback(null);
      const ref = await uploadFile(file, key);
      setDocRefs((prev) => ({ ...prev, [key]: ref }));
      setUploadedNames((prev) => ({ ...prev, [key]: file.name }));
    } catch (err: unknown) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Document upload failed.",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const submitForm = async (
    action: "SAVE_DRAFT" | "SUBMIT_APPLICATION" | "RESUBMIT_APPLICATION"
  ) => {
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
          documentUrls: docRefs,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save application.");
      setFeedback({
        type: "ok",
        text:
          action === "SAVE_DRAFT"
            ? "Application saved as draft."
            : action === "RESUBMIT_APPLICATION"
            ? "Updated application and credentials resubmitted for School Admin review."
            : "Application submitted for School Admin review.",
      });
      setEditingId(null);
      setSelectedLevels([]);
      setDocRefs({});
      setUploadedNames({});
      await Promise.all([loadData(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) =>
    classLevels.find((c) => c.id === id)?.code || id;

  const isSuspended = user?.status === "SUSPENDED";
  const isApprovedAccount = user?.status === "ACTIVE";
  const needsInfoApp = applications.find(
    (a) => a.status === "RESUBMISSION_REQUIRED"
  );
  const underReviewApp = applications.find((a) => a.status === "UNDER_REVIEW");

  const credentialsOnFile = [
    {
      label: "Teaching Certificate",
      url:
        teacherProfile?.teachingCertificate ||
        teacherProfile?.certificate ||
        applications.find((a) => a.documentUrls?.teachingCertificate)
          ?.documentUrls?.teachingCertificate,
    },
    {
      label: "Degree Certificate",
      url:
        teacherProfile?.degreeCertificate ||
        applications.find((a) => a.documentUrls?.degreeCertificate)?.documentUrls
          ?.degreeCertificate,
    },
    {
      label: "Curriculum Vitae (CV)",
      url:
        teacherProfile?.cv ||
        applications.find((a) => a.documentUrls?.cv)?.documentUrls?.cv,
    },
    {
      label: "Government ID / TRCN",
      url:
        teacherProfile?.governmentId ||
        applications.find((a) => a.documentUrls?.governmentId)?.documentUrls
          ?.governmentId,
    },
  ];

  const approvedList = approvals.filter((a) => a.status === "APPROVED");

  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Educator Accreditation & Verification Portal"
            title="Teacher Verification & Applications"
            description="Track your educator verification status, inspect submitted credentials, respond to administrator feedback, or apply for additional subjects."
            actions={
              isApprovedAccount ? (
                <Link
                  href="/teacher"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
                >
                  Open Teacher Dashboard
                  <ArrowRight size={14} />
                </Link>
              ) : null
            }
          />

          {/* Account Verification Status Banner */}
          <div
            className={`learnova-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
              isSuspended
                ? "border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/30"
                : isApprovedAccount
                ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/25"
                : needsInfoApp
                ? "border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30"
                : "border-[var(--border-strong)] bg-[var(--surface-lavender)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSuspended || user?.status === "REJECTED"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : isApprovedAccount
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isSuspended || user?.status === "REJECTED" ? (
                  <ShieldAlert size={20} />
                ) : isApprovedAccount ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-[var(--foreground)]">
                  {isSuspended
                    ? "Account Status: Suspended"
                    : isApprovedAccount
                    ? "Account Status: Verified & Approved Educator"
                    : needsInfoApp
                    ? "Action Required: Additional Information Requested"
                    : user?.status === "REJECTED"
                    ? "Account Status: Application Not Approved"
                    : underReviewApp
                    ? "Account Status: Credentials Under Review"
                    : "Account Status: Pending School Admin Approval"}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                  {isSuspended
                    ? "Your teaching access is temporarily paused. Please reach out to your School Administrator for clarification."
                    : isApprovedAccount
                    ? `You are authorized to teach across ${approvedList.length} subject-class slot(s). Timetable classrooms and lesson tools are unlocked.`
                    : needsInfoApp
                    ? `School Admin requested updates on your ${needsInfoApp.subjectName} application: "${needsInfoApp.adminExplanation || "Please review and upload updated documents."}"`
                    : user?.status === "REJECTED"
                    ? "Review administrator notes below and submit updated credentials if you wish to be reconsidered."
                    : "Your account and certificates are queued for verification. Classroom tools and timetable access will unlock automatically once an administrator approves your profile."}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold shrink-0 tabular-nums text-[var(--foreground-subtle)]">
              {approvedList.length} Approved · {applications.length} Application(s)
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {feedback.type === "ok" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {feedback.text}
            </div>
          )}

          {loading ? (
            <CardSkeleton lines={6} />
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* New / Edit Application Form */}
              <div className="learnova-card p-6 space-y-4 h-fit">
                <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <FileBadge2
                    size={16}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  {editingId
                    ? "Update & Resubmit Application"
                    : "Apply for a Subject"}
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    disabled={isSuspended}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setSelectedLevels([]);
                    }}
                    className="learnova-input w-full px-3 py-2 text-sm disabled:opacity-60"
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
                          disabled={isSuspended}
                          key={lvl.id}
                          onClick={() => toggleLevel(lvl.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap disabled:opacity-50 ${
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
                    disabled={isSuspended}
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
                      disabled={isSuspended}
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
                      disabled={isSuspended}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="5 years"
                      className="learnova-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                    TRCN / Teaching License Number (Optional)
                  </label>
                  <input
                    value={licenseNumber}
                    disabled={isSuspended}
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
                    disabled={isSuspended}
                    onChange={(e) => setBio(e.target.value)}
                    className="learnova-input w-full px-3 py-2 text-sm"
                  />
                </div>

                {/* Upload or Replace Documents */}
                <div className="border-t border-[var(--border)] pt-3 space-y-2.5">
                  <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <UploadCloud size={14} className="text-[#4F46E5]" />
                    Attach or Update Credentials
                  </p>
                  {[
                    { key: "teachingCertificate" as const, label: "Teaching Certificate" },
                    { key: "degreeCertificate" as const, label: "Degree Certificate" },
                    { key: "cv" as const, label: "CV / Resume" },
                    { key: "governmentId" as const, label: "TRCN / ID Document" },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[var(--foreground-muted)]">
                        {item.label}
                      </label>
                      <input
                        type="file"
                        disabled={isSuspended || Boolean(uploadingField)}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        onChange={(e) => handleDocUpload(e, item.key)}
                        className="w-full rounded-lg bg-[var(--surface-lavender)] border border-[var(--border)] p-1.5 text-[11px] text-[var(--foreground-muted)]"
                      />
                      {uploadingField === item.key ? (
                        <p className="text-[11px] text-[#4F46E5] flex items-center gap-1">
                          <Loader2 size={11} className="animate-spin" />
                          Uploading...
                        </p>
                      ) : uploadedNames[item.key] ? (
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Ready: {uploadedNames[item.key]}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || isSuspended || selectedLevels.length === 0}
                    onClick={() => submitForm("SAVE_DRAFT")}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border-strong)] text-[var(--foreground-muted)] text-xs font-semibold hover:bg-[var(--surface-lavender)] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition whitespace-nowrap"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={
                      saving ||
                      isSuspended ||
                      Boolean(uploadingField) ||
                      selectedLevels.length === 0
                    }
                    onClick={() =>
                      submitForm(
                        editingId ? "RESUBMIT_APPLICATION" : "SUBMIT_APPLICATION"
                      )
                    }
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
                  >
                    <Send size={13} /> {editingId ? "Resubmit" : "Submit"}
                  </button>
                </div>
              </div>

              {/* Right Column: Credentials, Approved Scope, & Application History */}
              <div className="lg:col-span-2 space-y-6 min-w-0">
                {/* Approved Authorizations */}
                <div className="learnova-card p-6">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
                    <Award
                      size={16}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    Assigned Subjects &amp; Class Levels ({approvedList.length})
                  </h2>
                  {approvedList.length === 0 ? (
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      No subject-level authorizations have been assigned yet. Once School Admin verifies your credentials, your assigned subjects and cohorts appear here.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {approvedList.map((ap) => (
                        <div
                          key={ap.id}
                          className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border-strong)] text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                        >
                          {ap.subjectName} · {ap.classLevelName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submitted Documents On File */}
                <div className="learnova-card p-6 space-y-3">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                    Submitted Verification Documents
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {credentialsOnFile.map((doc) => (
                      <div
                        key={doc.label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] px-4 py-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">
                            {doc.label}
                          </p>
                          <p className="text-[11px] text-[var(--foreground-subtle)]">
                            {doc.url ? "Uploaded & Stored Privately" : "Not uploaded"}
                          </p>
                        </div>
                        {doc.url && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({ title: doc.label, file: doc.url! })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] text-xs font-bold text-[var(--foreground)] hover:border-[#4F46E5] transition shrink-0"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application History */}
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
                        description="Complete the form on the left to request subject-level approval."
                      />
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {applications.map((app) => (
                        <div key={app.id} className="p-5 sm:px-6 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-[var(--foreground)]">
                                {app.subjectName}
                              </p>
                              <p className="text-xs text-[var(--foreground-subtle)]">
                                Requested Levels:{" "}
                                {(app.classLevelIds || []).map(levelCode).join(", ")}{" "}
                                · {app.qualification}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-bold shrink-0 ${getStatusTextColor(
                                app.status
                              )}`}
                            >
                              {formatApplicationStatusLabel(app.status)}
                            </span>
                          </div>
                          {app.adminExplanation && (
                            <p className="text-xs bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--foreground-muted)]">
                              <strong className="text-[var(--foreground)]">
                                Administrator Feedback:
                              </strong>{" "}
                              {app.adminExplanation}
                            </p>
                          )}
                          {(app.status === "DRAFT" ||
                            app.status === "RESUBMISSION_REQUIRED" ||
                            app.status === "REJECTED") &&
                            !isSuspended && (
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

        <DocumentPreviewModal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title || "Document Preview"}
          file={previewDoc?.file}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

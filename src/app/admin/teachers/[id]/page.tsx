"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DocumentPreviewModal from "@/components/admin/teacher-review/DocumentPreviewModal";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Save,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Clock,
  History,
  UserCog,
} from "lucide-react";

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const teacherId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [teacher, setTeacher] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Dossier editing state
  const [dossierForm, setDossierForm] = useState({
    fullName: "",
    phone: "",
    country: "",
    state: "",
    address: "",
    qualification: "",
    institution: "",
    experience: "",
    licenseNumber: "",
    bio: "",
    internalNotes: "",
  });

  // Direct Subject & Class-Level Assignment Matrix: subjectId -> Set of classLevelIds
  const [assignmentMatrix, setAssignmentMatrix] = useState<Record<string, string[]>>({});
  const [assignmentNote, setAssignmentNote] = useState("");
  const [statusReason, setStatusReason] = useState("");

  // Modals
  const [previewDoc, setPreviewDoc] = useState<{ title: string; file?: string } | null>(null);
  const [confirmLifecycle, setConfirmLifecycle] = useState<{
    nextStatus: "ACTIVE" | "SUSPENDED" | "REJECTED" | "PENDING";
    title: string;
    description: string;
    variant: "danger" | "warning" | "default";
    confirmLabel: string;
  } | null>(null);

  const loadTeacher = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();

      const foundTeacher = (json.teachers || []).find((t: any) => t.id === teacherId) || null;
      const teacherApps = (json.applications || []).filter(
        (a: any) => a.teacherUserId === teacherId
      );
      const teacherApprovals = (json.approvals || []).filter(
        (a: any) => a.teacherUserId === teacherId
      );
      const teacherRooms = (json.classrooms || []).filter(
        (c: any) => c.teacherUserId === teacherId
      );
      const appIds = new Set(teacherApps.map((a: any) => a.id));
      const approvalIds = new Set(teacherApprovals.map((a: any) => a.id));
      const relevantLogs = (json.auditLogs || []).filter(
        (l: any) =>
          l.entityId === teacherId ||
          appIds.has(l.entityId) ||
          approvalIds.has(l.entityId) ||
          l.metadata?.teacherUserId === teacherId
      );

      setTeacher(foundTeacher);
      setApps(teacherApps);
      setApprovals(teacherApprovals);
      setSubjects(json.subjects || []);
      setClassLevels(json.classLevels || []);
      setClassrooms(teacherRooms);
      setAuditLogs(relevantLogs);

      if (foundTeacher) {
        setDossierForm({
          fullName: foundTeacher.fullName || "",
          phone: foundTeacher.phone || "",
          country: foundTeacher.country || "",
          state: foundTeacher.state || "",
          address: foundTeacher.address || "",
          qualification: foundTeacher.qualification || "",
          institution: foundTeacher.institution || "",
          experience: foundTeacher.experience || "",
          licenseNumber: foundTeacher.licenseNumber || "",
          bio: foundTeacher.bio || teacherApps[0]?.bio || "",
          internalNotes:
            foundTeacher.adminNotes || teacherApps[0]?.internalNotes || "",
        });
      }

      const matrix: Record<string, string[]> = {};
      for (const ap of teacherApprovals) {
        if (ap.status !== "APPROVED") continue;
        const curr = matrix[ap.subjectId] || [];
        if (!curr.includes(ap.classLevelId)) {
          matrix[ap.subjectId] = [...curr, ap.classLevelId];
        }
      }
      setAssignmentMatrix(matrix);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  const toggleAssignmentSlot = (subjectId: string, levelId: string) => {
    setAssignmentMatrix((prev) => {
      const current = prev[subjectId] || [];
      const next = current.includes(levelId)
        ? current.filter((x) => x !== levelId)
        : [...current, levelId];
      return { ...prev, [subjectId]: next };
    });
  };

  const saveAssignments = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const assignments = Object.entries(assignmentMatrix)
        .filter(([, levels]) => levels.length > 0)
        .map(([subjectId, classLevelIds]) => ({ subjectId, classLevelIds }));

      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_TEACHER_SUBJECTS",
          teacherUserId: teacherId,
          assignments,
          note: assignmentNote || "Administrator updated teaching assignments",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update assignments.");
      setFeedback({
        type: "ok",
        text: "Subject & class-level teaching assignments saved.",
      });
      setAssignmentNote("");
      await loadTeacher();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const saveDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TEACHER_DOSSIER",
          teacherUserId: teacherId,
          ...dossierForm,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile.");
      setFeedback({ type: "ok", text: "Educator dossier details updated." });
      await loadTeacher();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  const changeAccountStatus = async (
    nextStatus: "ACTIVE" | "SUSPENDED" | "REJECTED" | "PENDING"
  ) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_TEACHER_STATUS",
          teacherUserId: teacherId,
          nextStatus,
          reason: statusReason || `Administrator set account status to ${nextStatus}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status.");
      setFeedback({
        type: "ok",
        text: `Educator account status updated to ${nextStatus}.`,
      });
      setConfirmLifecycle(null);
      setStatusReason("");
      await loadTeacher();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Status update failed." });
    } finally {
      setSaving(false);
    }
  };

  const reviewApp = async (
    applicationId: string,
    decision: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED",
    approvedClassLevelIds: string[]
  ) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_APPLICATION",
          applicationId,
          decision,
          approvedClassLevelIds,
          internalNotes: dossierForm.internalNotes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update.");
      setFeedback({ type: "ok", text: `Application marked ${decision.replace(/_/g, " ")}.` });
      await loadTeacher();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  const totalSelectedSlots = useMemo(
    () => Object.values(assignmentMatrix).reduce((sum, arr) => sum + arr.length, 0),
    [assignmentMatrix]
  );

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Teacher Verification Centre
          </Link>

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
          ) : !teacher ? (
            <EmptyState
              icon={FileText}
              title="Educator record not found"
              description="The requested educator dossier could not be located."
              action={{ label: "Return to Approvals", href: "/admin/teachers" }}
            />
          ) : (
            <div className="space-y-6">
              <PageHeader
                kicker="Educator Dossier & Authorization Control"
                title={teacher.fullName}
                description={`${teacher.email} · Qualification: ${teacher.qualification || "—"} · Institution: ${teacher.institution || "—"} · TRCN: ${teacher.licenseNumber || "—"}`}
                actions={
                  <span className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-[#22D3EE] shrink-0">
                    Account Status: {teacher.status}
                  </span>
                }
              />

              {/* Lifecycle Controls Panel */}
              <div className="learnova-glass-panel rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                    Account Verification &amp; Access Controls
                  </p>
                  <input
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Optional reason or note (recorded in audit trail & teacher notification)..."
                    className="learnova-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {teacher.status !== "ACTIVE" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmLifecycle({
                          nextStatus: "ACTIVE",
                          title: `Activate ${teacher.fullName}?`,
                          description:
                            "This unlocks the Educator Dashboard and teaching workspaces for this account.",
                          variant: "default",
                          confirmLabel: "Approve & Activate",
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-xs transition"
                    >
                      Approve / Activate Account
                    </button>
                  )}

                  {teacher.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmLifecycle({
                          nextStatus: "PENDING",
                          title: `Return ${teacher.fullName} to Pending Review?`,
                          description:
                            "This temporarily restricts dashboard access until verification finishes.",
                          variant: "warning",
                          confirmLabel: "Mark Pending",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-bold transition"
                    >
                      <Clock size={13} /> Mark Pending
                    </button>
                  )}

                  {teacher.status !== "SUSPENDED" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmLifecycle({
                          nextStatus: "SUSPENDED",
                          title: `Suspend ${teacher.fullName}?`,
                          description:
                            "Suspending immediately revokes dashboard, live classroom, and video publishing access while preserving history.",
                          variant: "danger",
                          confirmLabel: "Suspend Educator",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold transition"
                    >
                      <ShieldAlert size={13} /> Suspend Account
                    </button>
                  )}

                  {teacher.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmLifecycle({
                          nextStatus: "REJECTED",
                          title: `Reject ${teacher.fullName}?`,
                          description:
                            "This marks the educator account rejected and locks teaching access.",
                          variant: "danger",
                          confirmLabel: "Reject Account",
                        })
                      }
                      className="px-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)] text-xs font-bold hover:text-rose-600 transition"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Uploaded Credentials */}
              <div className="learnova-card p-6 space-y-4">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Submitted Verification Documents
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: "Profile Photo", url: teacher.profilePhoto },
                    { label: "Teaching Certificate", url: teacher.teachingCertificate },
                    { label: "Degree Certificate", url: teacher.degreeCertificate },
                    { label: "Government ID", url: teacher.governmentId },
                    { label: "Curriculum Vitae (CV)", url: teacher.cv },
                  ].map((doc) => {
                    const dlHref = doc.url
                      ? `${doc.url}${doc.url.includes("?") ? "&" : "?"}download=1`
                      : undefined;
                    return (
                      <div
                        key={doc.label}
                        className="border border-[var(--border)] bg-[var(--surface-lavender)] rounded-xl p-3.5 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-[var(--foreground)] flex items-center gap-1.5 min-w-0">
                          <FileText size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{doc.label}</span>
                        </span>
                        {doc.url ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: `${teacher.fullName} — ${doc.label}`,
                                  file: doc.url,
                                })
                              }
                              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-bold hover:underline"
                            >
                              <Eye size={13} /> Preview
                            </button>
                            <a
                              href={dlHref}
                              download
                              aria-label={`Download ${doc.label}`}
                              className="text-emerald-700 dark:text-emerald-300 hover:opacity-80"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[var(--foreground-subtle)] shrink-0">Not uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direct Subject & Class-Level Assignment Manager */}
              <div className="learnova-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <BookOpen size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                      Subject &amp; Class-Level Assignment Manager ({totalSelectedSlots} active slots)
                    </h2>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                      Directly assign, update, or remove which Nigerian curriculum subjects and JSS/SSS levels this educator is authorized to teach.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {subjects.map((sub) => {
                    const selectedForSub = assignmentMatrix[sub.id] || [];
                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              {sub.name} ({sub.code})
                            </p>
                            <p className="text-[11px] text-[var(--foreground-subtle)]">
                              {sub.department}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 tabular-nums">
                            {selectedForSub.length} level(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {classLevels.map((lvl) => {
                            const active = selectedForSub.includes(lvl.id);
                            return (
                              <button
                                key={lvl.id}
                                type="button"
                                onClick={() => toggleAssignmentSlot(sub.id, lvl.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  active
                                    ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                    : "bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[#4F46E5]"
                                }`}
                              >
                                {active ? "✓ " : ""}
                                {lvl.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    placeholder="Assignment note (e.g. Promoted to Senior Sciences team)..."
                    className="flex-1 learnova-input px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveAssignments}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <Save size={14} />
                    Save Subject &amp; Level Assignments
                  </button>
                </div>

                {classrooms.length > 0 && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--foreground)] mb-2">
                      Allocated Timetable Classrooms ({classrooms.length})
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {classrooms.map((rm) => (
                        <div
                          key={rm.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
                        >
                          <p className="font-bold text-[var(--foreground)]">
                            {rm.subjectName} · {rm.classLevelName} ({rm.groupName})
                          </p>
                          <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5 tabular-nums">
                            {rm.dayOfWeek} {rm.startTime}–{rm.endTime} WAT · {rm.studentCount} students ·{" "}
                            {rm.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Dossier Form */}
              <form onSubmit={saveDossier} className="learnova-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <UserCog size={17} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                    Edit Educator Dossier &amp; Internal Notes
                  </h2>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <Save size={13} /> Save Details
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <DossierField
                    label="Full Name"
                    value={dossierForm.fullName}
                    onChange={(v) => setDossierForm((p) => ({ ...p, fullName: v }))}
                  />
                  <DossierField
                    label="Phone"
                    value={dossierForm.phone}
                    onChange={(v) => setDossierForm((p) => ({ ...p, phone: v }))}
                  />
                  <DossierField
                    label="State / Country"
                    value={dossierForm.state}
                    onChange={(v) => setDossierForm((p) => ({ ...p, state: v }))}
                  />
                  <DossierField
                    label="Highest Qualification"
                    value={dossierForm.qualification}
                    onChange={(v) => setDossierForm((p) => ({ ...p, qualification: v }))}
                  />
                  <DossierField
                    label="Institution"
                    value={dossierForm.institution}
                    onChange={(v) => setDossierForm((p) => ({ ...p, institution: v }))}
                  />
                  <DossierField
                    label="Teaching Experience"
                    value={dossierForm.experience}
                    onChange={(v) => setDossierForm((p) => ({ ...p, experience: v }))}
                  />
                  <DossierField
                    label="TRCN / License Number"
                    value={dossierForm.licenseNumber}
                    onChange={(v) => setDossierForm((p) => ({ ...p, licenseNumber: v }))}
                  />
                  <DossierField
                    label="Address"
                    value={dossierForm.address}
                    onChange={(v) => setDossierForm((p) => ({ ...p, address: v }))}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[var(--foreground)] mb-1">
                      Teaching Bio
                    </label>
                    <textarea
                      rows={3}
                      value={dossierForm.bio}
                      onChange={(e) => setDossierForm((p) => ({ ...p, bio: e.target.value }))}
                      className="learnova-input w-full p-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--foreground)] mb-1">
                      Internal Admin Notes (Private)
                    </label>
                    <textarea
                      rows={3}
                      value={dossierForm.internalNotes}
                      onChange={(e) =>
                        setDossierForm((p) => ({ ...p, internalNotes: e.target.value }))
                      }
                      placeholder="Private verification remarks visible only to School Administrators..."
                      className="learnova-input w-full p-2.5 text-xs"
                    />
                  </div>
                </div>
              </form>

              {/* Subject Applications */}
              <div className="learnova-card p-6 space-y-4">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Submitted Subject Applications ({apps.length})
                </h2>
                {apps.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    No applications submitted yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="border border-[var(--border)] bg-[var(--surface-lavender)] rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-[var(--foreground)]">{app.subjectName}</p>
                            <p className="text-xs text-[var(--foreground-subtle)]">
                              Levels requested: {(app.classLevelIds || []).map(levelCode).join(", ")} ·{" "}
                              Status:{" "}
                              <strong className="text-[var(--foreground)]">
                                {app.status.replace(/_/g, " ")}
                              </strong>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => reviewApp(app.id, "UNDER_REVIEW", [])}
                              className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition whitespace-nowrap"
                            >
                              Under Review
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => reviewApp(app.id, "APPROVED", app.classLevelIds)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
                            >
                              Approve All Levels
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => reviewApp(app.id, "RESUBMISSION_REQUIRED", [])}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold transition whitespace-nowrap"
                            >
                              Request Info
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => reviewApp(app.id, "REJECTED", [])}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        {Array.isArray(app.statusHistory) && app.statusHistory.length > 0 && (
                          <div className="pl-3 border-l border-[var(--border)] space-y-1 text-[11px] text-[var(--foreground-muted)]">
                            {app.statusHistory.map((h: any, idx: number) => (
                              <p key={idx}>
                                <strong className="text-[var(--foreground)]">
                                  {String(h.status).replace(/_/g, " ")}
                                </strong>{" "}
                                by {h.actorName} ({h.actorRole})
                                {h.note ? ` — ${h.note}` : ""} ·{" "}
                                <span className="tabular-nums">
                                  {new Date(h.at).toLocaleString()}
                                </span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviewer Audit Trail */}
              <div className="learnova-card p-6 space-y-3">
                <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <History size={16} className="text-indigo-600 dark:text-indigo-400" />
                  Verification &amp; Assignment Audit Trail ({auditLogs.length})
                </h2>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    No administrative actions recorded for this educator yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {auditLogs.slice(0, 20).map((log) => (
                      <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div>
                          <span className="font-bold text-[var(--foreground)]">
                            {log.action.replace(/_/g, " ")}
                          </span>{" "}
                          <span className="text-[var(--foreground-muted)]">
                            by {log.actorEmail} ({log.actorRole})
                          </span>
                          {log.reason && (
                            <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                              Note: {log.reason}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--foreground-subtle)] tabular-nums shrink-0">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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

        <ConfirmDialog
          open={Boolean(confirmLifecycle)}
          onCancel={() => setConfirmLifecycle(null)}
          onConfirm={() => {
            if (confirmLifecycle) changeAccountStatus(confirmLifecycle.nextStatus);
          }}
          loading={saving}
          variant={confirmLifecycle?.variant || "default"}
          title={confirmLifecycle?.title || "Confirm Action"}
          description={confirmLifecycle?.description}
          confirmLabel={confirmLifecycle?.confirmLabel || "Confirm"}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

function DossierField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block font-bold text-[var(--foreground)] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="learnova-input w-full px-3 py-2 text-xs"
      />
    </div>
  );
}
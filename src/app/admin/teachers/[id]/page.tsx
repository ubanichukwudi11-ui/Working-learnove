"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton, EmptyState, ConfirmDialog } from "@/components/ui";
import DocumentsGrid from "@/components/admin/teacher-review/DocumentsGrid";
import {
  formatApplicationStatusLabel,
  getStatusTextColor,
} from "@/lib/teacherStatus";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Save,
  Clock,
  History,
  UserCog,
} from "lucide-react";

type StatusActionConfirm = {
  nextStatus: "ACTIVE" | "SUSPENDED" | "REJECTED";
  title: string;
  description: string;
};

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const teacherId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [teacher, setTeacher] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Subject -> selected classLevelIds map for Multi-Subject Assignment Manager
  const [assignmentMap, setAssignmentMap] = useState<Record<string, string[]>>(
    {}
  );
  const [assignmentReason, setAssignmentReason] = useState("");

  // Editable educator profile details
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    qualification: "",
    institution: "",
    experience: "",
    licenseNumber: "",
    bio: "",
    adminNotes: "",
  });

  const [confirmStatus, setConfirmStatus] =
    useState<StatusActionConfirm | null>(null);

  const loadTeacher = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();

      const foundTeacher =
        (json.teachers || []).find((t: any) => t.id === teacherId) || null;
      const teacherApps = (json.applications || []).filter(
        (a: any) => a.teacherUserId === teacherId
      );
      const teacherApprovals = (json.approvals || []).filter(
        (a: any) => a.teacherUserId === teacherId
      );
      const teacherRooms = (json.classrooms || []).filter(
        (c: any) => c.teacherUserId === teacherId
      );

      setTeacher(foundTeacher);
      setApps(teacherApps);
      setApprovals(teacherApprovals);
      setSubjects(json.subjects || []);
      setClassLevels(json.classLevels || []);
      setClassrooms(teacherRooms);
      setAuditLogs(json.auditLogs || []);

      if (foundTeacher) {
        setProfileForm({
          fullName: foundTeacher.fullName || "",
          phone: foundTeacher.phone || "",
          qualification: foundTeacher.qualification || "",
          institution: foundTeacher.institution || "",
          experience: foundTeacher.experience || "",
          licenseNumber: foundTeacher.licenseNumber || "",
          bio: foundTeacher.bio || "",
          adminNotes: foundTeacher.adminNotes || "",
        });
      }

      const nextAssign: Record<string, string[]> = {};
      for (const ap of teacherApprovals) {
        if (ap.status === "APPROVED") {
          const list = nextAssign[ap.subjectId] || [];
          if (!list.includes(ap.classLevelId)) {
            list.push(ap.classLevelId);
          }
          nextAssign[ap.subjectId] = list;
        }
      }
      setAssignmentMap(nextAssign);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  const mutate = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update.");
      setFeedback({ type: "ok", text: okMessage });
      await loadTeacher();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
    } finally {
      setSaving(false);
    }
  };

  const toggleSubjectLevel = (subjectId: string, levelId: string) => {
    setAssignmentMap((prev) => {
      const current = prev[subjectId] || [];
      const next = current.includes(levelId)
        ? current.filter((x) => x !== levelId)
        : [...current, levelId];
      const updated = { ...prev };
      if (next.length === 0) {
        delete updated[subjectId];
      } else {
        updated[subjectId] = next;
      }
      return updated;
    });
  };

  const saveAssignments = async () => {
    const assignments = Object.entries(assignmentMap)
      .filter(([, levels]) => levels.length > 0)
      .map(([subjectId, classLevelIds]) => ({
        subjectId,
        classLevelIds,
      }));

    await mutate(
      {
        action: "SAVE_TEACHER_ASSIGNMENTS",
        teacherUserId: teacherId,
        assignments,
        reason: assignmentReason.trim() || undefined,
      },
      "Teaching subjects and class levels saved. Educator notified."
    );
    setAssignmentReason("");
  };

  const saveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate(
      {
        action: "UPDATE_TEACHER_PROFILE",
        teacherUserId: teacherId,
        ...profileForm,
      },
      "Educator profile details updated."
    );
  };

  const handleStatusUpdate = async (
    nextStatus: "ACTIVE" | "SUSPENDED" | "REJECTED"
  ) => {
    await mutate(
      {
        action: "UPDATE_TEACHER_STATUS",
        teacherUserId: teacherId,
        status: nextStatus,
        reason: assignmentReason.trim() || undefined,
      },
      `Educator account marked ${formatApplicationStatusLabel(nextStatus)}.`
    );
    setConfirmStatus(null);
  };

  const levelCode = (id: string) =>
    classLevels.find((c) => c.id === id)?.code || id;

  const activeSubjectSummary = useMemo(() => {
    const names = new Set<string>();
    const levels = new Set<string>();
    for (const ap of approvals) {
      if (ap.status === "APPROVED") {
        names.add(ap.subjectName);
        levels.add(ap.classLevelName);
      }
    }
    return {
      subjectNames: Array.from(names),
      levelNames: Array.from(levels),
    };
  }, [approvals]);

  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      detail: string;
      actor: string;
      timestamp: string;
    }> = [];

    for (const app of apps) {
      for (const h of app.history || []) {
        events.push({
          id: h.id,
          title: `${app.subjectName} · ${String(h.action || "").replace(/_/g, " ")}`,
          detail:
            h.note ||
            `Status changed ${h.fromStatus ? `from ${h.fromStatus} ` : ""}to ${formatApplicationStatusLabel(h.toStatus)}`,
          actor: h.actorName || "System",
          timestamp: h.timestamp,
        });
      }
      if (!app.history?.length) {
        events.push({
          id: `app-${app.id}`,
          title: `${app.subjectName} Application`,
          detail: `Current status: ${formatApplicationStatusLabel(app.status)}`,
          actor: app.reviewedBy || app.teacherName,
          timestamp: app.updatedAt || app.createdAt,
        });
      }
    }

    for (const log of auditLogs) {
      const targetMatch =
        log.entityId === teacherId ||
        log.metadata?.teacherUserId === teacherId;
      if (!targetMatch) continue;
      events.push({
        id: log.id,
        title: log.action.replace(/_/g, " "),
        detail: log.reason || log.actorEmail || "Audit entry",
        actor: log.actorEmail || log.actorRole,
        timestamp: log.createdAt,
      });
    }

    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [apps, auditLogs, teacherId]);

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
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
                eyebrow="Individual Educator Management"
                title={teacher.fullName}
                description={`${teacher.email} · Qualification: ${teacher.qualification || "—"} · Institution: ${teacher.institution || "—"} · TRCN: ${teacher.licenseNumber || "—"}`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-[#22D3EE] shrink-0">
                      Status: {formatApplicationStatusLabel(teacher.status)}
                    </span>
                    {teacher.status === "SUSPENDED" ||
                    teacher.status === "REJECTED" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          setConfirmStatus({
                            nextStatus: "ACTIVE",
                            title: `Reactivate ${teacher.fullName}?`,
                            description:
                              "Reactivating restores educator access and any previously suspended subject authorizations.",
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                      >
                        <ShieldCheck size={14} />
                        Reactivate Educator
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          setConfirmStatus({
                            nextStatus: "SUSPENDED",
                            title: `Suspend ${teacher.fullName}?`,
                            description:
                              "Suspending disables dashboard and live classroom access without deleting classroom or attendance history.",
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition"
                      >
                        <ShieldAlert size={14} />
                        Suspend Access
                      </button>
                    )}
                  </div>
                }
              />

              {/* Assigned Summary Strip */}
              <div className="learnova-card p-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                    Assigned Subjects ({activeSubjectSummary.subjectNames.length})
                  </p>
                  <p className="text-sm font-bold text-[var(--foreground)] mt-1">
                    {activeSubjectSummary.subjectNames.length > 0
                      ? activeSubjectSummary.subjectNames.join(", ")
                      : "No active subject assignments yet"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                    Assigned Class Levels ({activeSubjectSummary.levelNames.length})
                  </p>
                  <p className="text-sm font-bold text-[var(--foreground)] mt-1">
                    {activeSubjectSummary.levelNames.length > 0
                      ? activeSubjectSummary.levelNames.join(", ")
                      : "No class levels assigned yet"}
                  </p>
                </div>
              </div>

              {/* Uploaded Credentials (Private Authenticated Preview + Download) */}
              <DocumentsGrid teacher={teacher} />

              {/* Multi-Subject & Multi-Class Assignment Manager */}
              <div className="learnova-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="landing-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                      <BookOpen size={18} className="text-[#4F46E5]" />
                      Subject &amp; Class-Level Assignment Manager
                    </h2>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                      Assign multiple subjects and select exact JSS / SSS class levels. Deselecting all levels for a subject revokes that assignment.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving || teacher.status === "SUSPENDED"}
                    onClick={saveAssignments}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 shrink-0"
                  >
                    <Save size={14} />
                    Save Subject Assignments
                  </button>
                </div>

                {teacher.status === "SUSPENDED" && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Reactivate this educator account before modifying active teaching assignments.
                  </p>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {subjects.map((sub) => {
                    const selectedForSub = assignmentMap[sub.id] || [];
                    return (
                      <div
                        key={sub.id}
                        className={`rounded-xl border p-4 space-y-2.5 transition ${
                          selectedForSub.length > 0
                            ? "border-[#4F46E5]/50 bg-[var(--surface-lavender)]"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[var(--foreground)]">
                            {sub.name}
                          </p>
                          <span className="text-[11px] font-bold text-[var(--foreground-subtle)] tabular-nums">
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
                                disabled={saving || teacher.status === "SUSPENDED"}
                                onClick={() => toggleSubjectLevel(sub.id, lvl.id)}
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

                <input
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="Optional reason or note logged in assignment history..."
                  className="learnova-input w-full text-xs py-2.5"
                />
              </div>

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
                        className="border border-[var(--border)] bg-[var(--surface-lavender)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[var(--foreground)]">
                              {app.subjectName}
                            </p>
                            <span
                              className={`text-xs font-bold ${getStatusTextColor(
                                app.status
                              )}`}
                            >
                              {formatApplicationStatusLabel(app.status)}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                            Requested Levels:{" "}
                            {(app.classLevelIds || []).map(levelCode).join(", ")}
                          </p>
                          {app.adminExplanation && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              Feedback: {app.adminExplanation}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {app.status === "PENDING_REVIEW" && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                mutate(
                                  {
                                    action: "MARK_UNDER_REVIEW",
                                    applicationId: app.id,
                                  },
                                  "Marked Under Review."
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition whitespace-nowrap"
                            >
                              <Clock size={12} />
                              Start Review
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              mutate(
                                {
                                  action: "REVIEW_APPLICATION",
                                  applicationId: app.id,
                                  decision: "APPROVED",
                                  approvedClassLevelIds: app.classLevelIds,
                                },
                                `${app.subjectName} application approved.`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
                          >
                            Approve Requested Levels
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              mutate(
                                {
                                  action: "REVIEW_APPLICATION",
                                  applicationId: app.id,
                                  decision: "RESUBMISSION_REQUIRED",
                                  approvedClassLevelIds: [],
                                },
                                "Requested additional information from educator."
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold transition whitespace-nowrap"
                          >
                            Request Info
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              mutate(
                                {
                                  action: "REVIEW_APPLICATION",
                                  applicationId: app.id,
                                  decision: "REJECTED",
                                  approvedClassLevelIds: [],
                                },
                                `${app.subjectName} application marked rejected.`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Classrooms & Teaching Activity */}
              <div className="learnova-card p-6 space-y-4">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Assigned Classrooms &amp; Activity ({classrooms.length})
                </h2>
                {classrooms.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    No timetable classroom groups are assigned to this educator yet.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classrooms.map((rm) => (
                      <div
                        key={rm.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#4F46E5] dark:text-[#A5B4FC]">
                            {rm.classLevelName} · {rm.subjectName}
                          </span>
                          <span className="font-bold text-[var(--foreground)]">
                            {rm.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[var(--foreground)]">
                          {rm.groupName}
                        </p>
                        <p className="text-[11px] text-[var(--foreground-subtle)] tabular-nums">
                          {rm.dayOfWeek} · {rm.startTime}–{rm.endTime} WAT ·{" "}
                          {rm.studentCount}/{rm.maxCapacity} students
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Educator Profile Editor */}
              <form
                onSubmit={saveProfileDetails}
                className="learnova-card p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <UserCog size={17} className="text-[#4F46E5]" />
                    Edit Educator Profile &amp; Admin Notes
                  </h2>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-lavender)] border border-[var(--border-strong)] hover:border-[#4F46E5] text-xs font-bold text-[var(--foreground)] transition"
                  >
                    <Save size={13} />
                    Save Profile Details
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Full Name
                    </label>
                    <input
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Phone
                    </label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Qualification
                    </label>
                    <input
                      value={profileForm.qualification}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          qualification: e.target.value,
                        }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Institution
                    </label>
                    <input
                      value={profileForm.institution}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          institution: e.target.value,
                        }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      Experience
                    </label>
                    <input
                      value={profileForm.experience}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          experience: e.target.value,
                        }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                      TRCN / License Number
                    </label>
                    <input
                      value={profileForm.licenseNumber}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          licenseNumber: e.target.value,
                        }))
                      }
                      className="learnova-input w-full text-sm py-2"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                        Educator Bio
                      </label>
                      <textarea
                        rows={2}
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, bio: e.target.value }))
                        }
                        className="learnova-input w-full text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                        Internal Admin Notes
                      </label>
                      <textarea
                        rows={2}
                        value={profileForm.adminNotes}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            adminNotes: e.target.value,
                          }))
                        }
                        className="learnova-input w-full text-sm py-2"
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Approval & Assignment History Timeline */}
              <div className="learnova-card p-6 space-y-4">
                <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <History size={17} className="text-[#4F46E5]" />
                  Approval &amp; Assignment History ({timelineEvents.length})
                </h2>
                {timelineEvents.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    No verification or assignment history events recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {timelineEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[var(--foreground)]">
                            {ev.title}
                          </p>
                          <p className="text-[var(--foreground-muted)] mt-0.5">
                            {ev.detail} · By {ev.actor}
                          </p>
                        </div>
                        <span className="text-[11px] text-[var(--foreground-subtle)] tabular-nums shrink-0">
                          {new Date(ev.timestamp).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={Boolean(confirmStatus)}
          title={confirmStatus?.title || ""}
          description={confirmStatus?.description || ""}
          confirmLabel={
            confirmStatus?.nextStatus === "ACTIVE"
              ? "Reactivate Educator"
              : "Confirm Suspend"
          }
          tone={confirmStatus?.nextStatus === "ACTIVE" ? "primary" : "danger"}
          loading={saving}
          onClose={() => setConfirmStatus(null)}
          onConfirm={() => {
            if (confirmStatus) {
              handleStatusUpdate(confirmStatus.nextStatus);
            }
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
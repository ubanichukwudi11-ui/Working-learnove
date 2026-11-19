"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, EmptyState, CardSkeleton, StatCard } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DocumentPreviewModal from "@/components/admin/teacher-review/DocumentPreviewModal";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Search,
  Eye,
  Clock,
  Award,
  Users,
  FileSearch,
} from "lucide-react";

type ReviewDecision =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED"
  | "SUSPENDED";

export default function AdminTeachersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Per-application review selection state
  const [levelSelectionMap, setLevelSelectionMap] = useState<Record<string, string[]>>({});
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});
  const [internalNotesMap, setInternalNotesMap] = useState<Record<string, string>>({});

  // Modals
  const [previewDoc, setPreviewDoc] = useState<{ title: string; file?: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    appId: string;
    teacherName: string;
    subjectName: string;
    decision: "REJECTED" | "SUSPENDED";
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setApplications(json.applications || []);
      setApprovals(json.approvals || []);
      setTeachers(json.teachers || []);
      setClassLevels(json.classLevels || []);

      const initSel: Record<string, string[]> = {};
      for (const app of json.applications || []) {
        initSel[app.id] = app.classLevelIds || [];
      }
      setLevelSelectionMap((prev) => ({ ...initSel, ...prev }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleLevelForApp = (appId: string, levelId: string) => {
    setLevelSelectionMap((prev) => {
      const current = prev[appId] || [];
      return {
        ...prev,
        [appId]: current.includes(levelId)
          ? current.filter((x) => x !== levelId)
          : [...current, levelId],
      };
    });
  };

  const handleReview = async (appId: string, decision: ReviewDecision) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_APPLICATION",
          applicationId: appId,
          decision,
          approvedClassLevelIds: levelSelectionMap[appId] || [],
          explanation: explanationMap[appId] || "",
          internalNotes: internalNotesMap[appId] || "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to review application.");
      setFeedback({
        type: "ok",
        text: `Application updated to ${decision.replace(/_/g, " ")}. Teacher notified.`,
      });
      setConfirmState(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Review failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleApproval = async (
    approvalId: string,
    nextStatus: "APPROVED" | "SUSPENDED" | "REVOKED"
  ) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_SUBJECT_APPROVAL",
          approvalId,
          status: nextStatus,
          reason: `Administrator marked approval ${nextStatus.toLowerCase()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setFeedback({ type: "ok", text: `Approval status changed to ${nextStatus}.` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to update approval." });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: applications.length,
      PENDING_REVIEW: 0,
      UNDER_REVIEW: 0,
      RESUBMISSION_REQUIRED: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
    };
    for (const app of applications) {
      if (counts[app.status] !== undefined) counts[app.status] += 1;
    }
    return counts;
  }, [applications]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (filter !== "ALL" && a.status !== filter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${a.teacherName} ${a.teacherEmail} ${a.subjectName} ${a.qualification}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [applications, filter, normalizedQuery]);

  const filteredTeachers = useMemo(() => {
    if (!normalizedQuery) return teachers;
    return teachers.filter((t) =>
      `${t.fullName} ${t.email} ${t.subject || ""} ${t.qualification || ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [teachers, normalizedQuery]);

  const activeApprovals = approvals.filter((a) => a.status === "APPROVED");

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            kicker="Educator Vetting & Subject Authorization"
            title="Teacher Verification Centre"
            description="Review educator credentials, preview uploaded certificates, mark applications under review, approve specific subjects and class levels, or manage faculty authorizations."
          />

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending Review"
              value={statusCounts.PENDING_REVIEW + statusCounts.RESUBMISSION_REQUIRED}
              sublabel="Awaiting admin action"
              icon={Clock}
              tone="assignments"
            />
            <StatCard
              label="Under Review"
              value={statusCounts.UNDER_REVIEW}
              sublabel="In active vetting"
              icon={FileSearch}
              tone="timetable"
            />
            <StatCard
              label="Active Educators"
              value={teachers.filter((t) => t.status === "ACTIVE").length}
              sublabel={`Out of ${teachers.length} accounts`}
              icon={Users}
              tone="attendance"
            />
            <StatCard
              label="Approved Subject Slots"
              value={activeApprovals.length}
              sublabel="Eligible for timetable"
              icon={Award}
              tone="learning"
            />
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

          {/* Search & Status Filter Bar */}
          <div className="learnova-glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search educator by name, email, subject, or qualification..."
                  className="learnova-input w-full pl-9 pr-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "ALL",
                  "PENDING_REVIEW",
                  "UNDER_REVIEW",
                  "RESUBMISSION_REQUIRED",
                  "APPROVED",
                  "REJECTED",
                  "SUSPENDED",
                ].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap tabular-nums ${
                      filter === f
                        ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-xs"
                        : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[#4F46E5]"
                    }`}
                  >
                    {f.replace(/_/g, " ")} ({statusCounts[f] ?? 0})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <CardSkeleton lines={4} />
              <CardSkeleton lines={4} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Applications Queue */}
              {filteredApps.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No Matching Teacher Applications"
                  description="Adjust your search filter or wait for new educator registrations to enter the verification queue."
                />
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const selectedLevels = levelSelectionMap[app.id] || app.classLevelIds || [];
                    const docs = app.documentUrls || {};
                    const docEntries = [
                      { label: "Teaching Cert", url: docs.teachingCertificate },
                      { label: "Degree Cert", url: docs.degreeCertificate },
                      { label: "Gov ID", url: docs.governmentId },
                      { label: "CV", url: docs.cv },
                    ].filter((d) => Boolean(d.url));

                    return (
                      <div key={app.id} className="learnova-card p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                                {app.teacherName}
                              </h2>
                              <span className="text-xs font-semibold text-[var(--foreground-subtle)]">
                                ({app.teacherEmail})
                              </span>
                              <span aria-hidden="true" className="text-[var(--foreground-subtle)]">
                                ·
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  app.status === "APPROVED"
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : app.status === "UNDER_REVIEW"
                                    ? "text-indigo-600 dark:text-indigo-300"
                                    : app.status === "PENDING_REVIEW"
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-rose-700 dark:text-rose-400"
                                }`}
                              >
                                {app.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-[#4F46E5] dark:text-indigo-400 mt-1">
                              Subject Requested: {app.subjectName}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              Qualification: <strong>{app.qualification || "—"}</strong> · Institution:{" "}
                              {app.institution || "—"} · Experience: {app.experience || "—"}
                              {app.licenseNumber ? ` · TRCN: ${app.licenseNumber}` : ""}
                            </p>
                            {app.bio && (
                              <p className="text-xs text-[var(--foreground-subtle)] mt-1.5 line-clamp-2">
                                {app.bio}
                              </p>
                            )}
                          </div>

                          <Link
                            href={`/admin/teachers/${app.teacherUserId}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-strong)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-lavender)] shrink-0 transition"
                          >
                            Manage Dossier &amp; Subjects
                            <ExternalLink size={12} />
                          </Link>
                        </div>

                        {/* Inline Verified Documents Preview Strip */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-[var(--foreground-subtle)] mr-1">
                            Documents:
                          </span>
                          {docEntries.length === 0 ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              No documents attached
                            </span>
                          ) : (
                            docEntries.map((doc) => (
                              <button
                                key={doc.label}
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    title: `${app.teacherName} — ${doc.label}`,
                                    file: doc.url,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-lavender)] hover:border-[#4F46E5] text-[11px] font-bold text-[var(--foreground)] transition"
                              >
                                <Eye size={12} className="text-[#4F46E5] dark:text-[#A5B4FC]" />
                                {doc.label}
                              </button>
                            ))
                          )}
                        </div>

                        {/* Granular Class Level Approval Selector */}
                        <div className="bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-[var(--foreground-muted)]">
                            Select Class Levels Approved to Teach {app.subjectName}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {classLevels.map((lvl) => {
                              const checked = selectedLevels.includes(lvl.id);
                              const requested = (app.classLevelIds || []).includes(lvl.id);
                              return (
                                <button
                                  type="button"
                                  key={lvl.id}
                                  onClick={() => toggleLevelForApp(app.id, lvl.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    checked
                                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                      : requested
                                      ? "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border-strong)] hover:border-[#4F46E5]"
                                      : "bg-transparent text-[var(--foreground-subtle)] border-[var(--border)] opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  {checked ? "✓ " : ""}
                                  {lvl.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Feedback & Internal Notes */}
                        <div className="grid md:grid-cols-2 gap-3">
                          <input
                            value={explanationMap[app.id] ?? app.adminExplanation ?? ""}
                            onChange={(e) =>
                              setExplanationMap((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Message visible to educator (decision feedback)..."
                            className="learnova-input text-xs py-2 px-3"
                          />
                          <input
                            value={internalNotesMap[app.id] ?? app.internalNotes ?? ""}
                            onChange={(e) =>
                              setInternalNotesMap((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Internal admin review note (private to admins)..."
                            className="learnova-input text-xs py-2 px-3"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleReview(app.id, "UNDER_REVIEW")}
                            className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                          >
                            Mark Under Review
                          </button>
                          <button
                            type="button"
                            disabled={saving || selectedLevels.length === 0}
                            onClick={() => handleReview(app.id, "APPROVED")}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold disabled:opacity-50 transition shadow-xs"
                          >
                            Approve Selected Levels
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleReview(app.id, "RESUBMISSION_REQUIRED")}
                            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/70 transition"
                          >
                            Request Info
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              setConfirmState({
                                appId: app.id,
                                teacherName: app.teacherName,
                                subjectName: app.subjectName,
                                decision: "REJECTED",
                              })
                            }
                            className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              setConfirmState({
                                appId: app.id,
                                teacherName: app.teacherName,
                                subjectName: app.subjectName,
                                decision: "SUSPENDED",
                              })
                            }
                            className="px-3 py-2 rounded-xl border border-[var(--border-strong)] text-[var(--foreground-muted)] text-xs font-semibold hover:bg-[var(--surface-lavender)] transition"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Registered Faculty Directory */}
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-lavender)] flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Registered Educators Directory ({filteredTeachers.length})
                  </h2>
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    Open any educator profile to edit dossier or manage subject/class assignments
                  </span>
                </div>
                {filteredTeachers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--foreground-subtle)]">
                    No educator accounts match your current search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[var(--surface-lavender)] text-xs text-[var(--foreground-subtle)] uppercase border-b border-[var(--border)]">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Educator</th>
                          <th className="px-5 py-3 font-semibold">Primary Qualification</th>
                          <th className="px-5 py-3 font-semibold">Account Status</th>
                          <th className="px-5 py-3 font-semibold">Approved Levels</th>
                          <th className="px-5 py-3 font-semibold text-right">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredTeachers.map((t) => {
                          const tApprovals = activeApprovals.filter(
                            (ap) => ap.teacherUserId === t.id
                          );
                          return (
                            <tr key={t.id} className="hover:bg-[var(--surface-lavender)] transition">
                              <td className="px-5 py-3">
                                <p className="font-bold text-[var(--foreground)]">{t.fullName}</p>
                                <p className="text-xs text-[var(--foreground-subtle)]">{t.email}</p>
                              </td>
                              <td className="px-5 py-3 text-xs text-[var(--foreground-muted)]">
                                {t.qualification || t.subject || "—"}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`text-xs font-bold ${
                                    t.status === "ACTIVE"
                                      ? "text-emerald-700 dark:text-emerald-400"
                                      : t.status === "PENDING"
                                      ? "text-amber-700 dark:text-amber-400"
                                      : "text-rose-700 dark:text-rose-400"
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-[var(--foreground-muted)] tabular-nums">
                                {tApprovals.length} slot(s)
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Link
                                  href={`/admin/teachers/${t.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] hover:border-[#4F46E5] text-xs font-bold text-[var(--foreground)] transition"
                                >
                                  Open Dossier <ExternalLink size={11} />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Active Authorizations Matrix */}
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-lavender)]">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Subject &amp; Class-Level Authorizations ({approvals.length})
                  </h2>
                </div>
                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--foreground-subtle)]">
                    No approved teacher-subject-level authorizations yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[var(--surface-lavender)] text-xs text-[var(--foreground-subtle)] uppercase border-b border-[var(--border)]">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Educator</th>
                          <th className="px-5 py-3.5 font-semibold">Subject</th>
                          <th className="px-5 py-3.5 font-semibold">Class Level</th>
                          <th className="px-5 py-3.5 font-semibold">Status</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {approvals.map((ap) => (
                          <tr key={ap.id} className="hover:bg-[var(--surface-lavender)] transition">
                            <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">
                              <Link
                                href={`/admin/teachers/${ap.teacherUserId}`}
                                className="hover:underline"
                              >
                                {ap.teacherName}
                              </Link>
                            </td>
                            <td className="px-5 py-3.5 text-[var(--foreground-muted)]">
                              {ap.subjectName}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-[var(--foreground)]">
                              {ap.classLevelName}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`text-xs font-bold ${
                                  ap.status === "APPROVED"
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-rose-700 dark:text-rose-400"
                                }`}
                              >
                                {ap.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              {ap.status === "APPROVED" ? (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleToggleApproval(ap.id, "REVOKED")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <ShieldAlert size={12} />
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleToggleApproval(ap.id, "APPROVED")}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold"
                                >
                                  Restore
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

        <ConfirmDialog
          open={Boolean(confirmState)}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState) {
              handleReview(confirmState.appId, confirmState.decision);
            }
          }}
          loading={saving}
          variant="danger"
          title={
            confirmState?.decision === "SUSPENDED"
              ? `Suspend ${confirmState?.teacherName}?`
              : `Reject ${confirmState?.teacherName}'s application?`
          }
          description={
            confirmState?.decision === "SUSPENDED"
              ? `This will suspend ${confirmState?.teacherName}'s ${confirmState?.subjectName} authorization and lock classroom access if no other active authorizations remain.`
              : `This will reject ${confirmState?.teacherName}'s ${confirmState?.subjectName} application and notify the applicant.`
          }
          confirmLabel={
            confirmState?.decision === "SUSPENDED" ? "Confirm Suspend" : "Confirm Reject"
          }
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
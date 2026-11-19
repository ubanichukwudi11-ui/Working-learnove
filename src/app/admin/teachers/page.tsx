"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, EmptyState, CardSkeleton, ConfirmDialog } from "@/components/ui";
import DocumentPreviewModal from "@/components/admin/teacher-review/DocumentPreviewModal";
import {
  formatApplicationStatusLabel,
  getStatusTextColor,
} from "@/lib/teacherStatus";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Search,
  Eye,
  Clock,
  Users,
} from "lucide-react";

type PendingConfirmAction = {
  appId: string;
  teacherName: string;
  subjectName: string;
  decision: "REJECTED" | "SUSPENDED";
};

export default function AdminTeachersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Per-application review selection state
  const [levelSelectionMap, setLevelSelectionMap] = useState<
    Record<string, string[]>
  >({});
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>(
    {}
  );
  const [internalNotesMap, setInternalNotesMap] = useState<
    Record<string, string>
  >({});

  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    file: string;
  } | null>(null);

  const [confirmAction, setConfirmAction] = useState<PendingConfirmAction | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        cache: "no-store",
      });
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

  const handleMarkUnderReview = async (appId: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/teacher-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MARK_UNDER_REVIEW",
          applicationId: appId,
          internalNotes: internalNotesMap[appId] ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to start review.");
      setFeedback({
        type: "ok",
        text: "Application marked Under Review. Educator notified.",
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "Failed to start review.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (
    appId: string,
    decision: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED" | "SUSPENDED"
  ) => {
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
          internalNotes: internalNotesMap[appId] ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to review application.");
      setFeedback({
        type: "ok",
        text: `Application updated to ${formatApplicationStatusLabel(decision)}. Educator notified.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Review failed." });
    } finally {
      setSaving(false);
      setConfirmAction(null);
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
      setFeedback({
        type: "ok",
        text: `Authorization updated to ${nextStatus}.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "Failed to update approval.",
      });
    } finally {
      setSaving(false);
    }
  };

  const levelCode = (id: string) =>
    classLevels.find((c) => c.id === id)?.code || id;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: applications.length };
    for (const app of applications) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return counts;
  }, [applications]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (filter !== "ALL" && a.status !== filter) return false;
      if (!normalizedQuery) return true;
      return (
        String(a.teacherName || "").toLowerCase().includes(normalizedQuery) ||
        String(a.teacherEmail || "").toLowerCase().includes(normalizedQuery) ||
        String(a.subjectName || "").toLowerCase().includes(normalizedQuery) ||
        String(a.qualification || "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [applications, filter, normalizedQuery]);

  const filteredTeachers = useMemo(() => {
    if (!normalizedQuery) return teachers;
    return teachers.filter(
      (t) =>
        String(t.fullName || "").toLowerCase().includes(normalizedQuery) ||
        String(t.email || "").toLowerCase().includes(normalizedQuery) ||
        String(t.subject || "").toLowerCase().includes(normalizedQuery)
    );
  }, [teachers, normalizedQuery]);

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            kicker="Educator Vetting & Subject Authorization"
            title="Teacher Verification & Management"
            description="Review submitted teaching certificates, mark applications Under Review, approve subjects across specific class levels, or open an educator dossier for full assignment control."
          />

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

          {/* Search & Filter Strip */}
          <div className="learnova-card p-4 space-y-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search educators or applications by name, email, subject, or qualification..."
                className="learnova-input w-full pl-9 pr-4 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "ALL", label: "All Applications" },
                { key: "PENDING_REVIEW", label: "Pending Approval" },
                { key: "UNDER_REVIEW", label: "Under Review" },
                { key: "RESUBMISSION_REQUIRED", label: "Additional Info Required" },
                { key: "APPROVED", label: "Approved" },
                { key: "REJECTED", label: "Rejected" },
                { key: "SUSPENDED", label: "Suspended" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap tabular-nums ${
                    filter === f.key
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-xs"
                      : "bg-[var(--surface-lavender)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[#4F46E5]"
                  }`}
                >
                  {f.label} ({statusCounts[f.key] || 0})
                </button>
              ))}
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
                  description="Try clearing your search or status filter, or inspect the Registered Educators Directory below."
                />
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const selectedLevels =
                      levelSelectionMap[app.id] || app.classLevelIds || [];
                    const docList = [
                      {
                        label: "Teaching Certificate",
                        url: app.documentUrls?.teachingCertificate,
                      },
                      {
                        label: "Degree Certificate",
                        url: app.documentUrls?.degreeCertificate,
                      },
                      { label: "CV / Resume", url: app.documentUrls?.cv },
                      {
                        label: "TRCN / ID",
                        url: app.documentUrls?.governmentId,
                      },
                      {
                        label: "Photo",
                        url: app.documentUrls?.profilePhoto,
                      },
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
                              <span
                                aria-hidden="true"
                                className="text-[var(--foreground-subtle)]"
                              >
                                ·
                              </span>
                              <span
                                className={`text-xs font-bold ${getStatusTextColor(
                                  app.status
                                )}`}
                              >
                                {formatApplicationStatusLabel(app.status)}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-[#4F46E5] dark:text-indigo-400 mt-1">
                              Subject Requested: {app.subjectName}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              Qualification: <strong>{app.qualification}</strong>{" "}
                              · Institution: {app.institution || "—"} ·
                              Experience: {app.experience || "—"}
                              {app.licenseNumber
                                ? ` · TRCN: ${app.licenseNumber}`
                                : ""}
                            </p>
                          </div>

                          <Link
                            href={`/admin/teachers/${app.teacherUserId}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] text-xs font-bold text-[var(--foreground)] hover:border-[#4F46E5] shrink-0 transition"
                          >
                            Manage Teacher &amp; Subjects
                            <ExternalLink size={12} />
                          </Link>
                        </div>

                        {/* Quick Document Preview Strip */}
                        {docList.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-[var(--foreground-subtle)]">
                              Credentials:
                            </span>
                            {docList.map((doc) => (
                              <button
                                key={doc.label}
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    title: `${app.teacherName} — ${doc.label}`,
                                    file: doc.url,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--foreground)] hover:border-[#4F46E5] transition"
                              >
                                <Eye size={12} className="text-[#4F46E5]" />
                                {doc.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Granular Class Level Approval Selector */}
                        <div className="bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-[var(--foreground-muted)]">
                            Select Class Levels Approved for {app.subjectName}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {classLevels.map((lvl) => {
                              const requested = (
                                app.classLevelIds || []
                              ).includes(lvl.id);
                              const checked = selectedLevels.includes(lvl.id);
                              return (
                                <button
                                  type="button"
                                  key={lvl.id}
                                  onClick={() =>
                                    toggleLevelForApp(app.id, lvl.id)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    checked
                                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                      : requested
                                      ? "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border-strong)] hover:border-[#4F46E5]"
                                      : "bg-[var(--surface)] text-[var(--foreground-subtle)] border-[var(--border)] opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  {checked ? "✓ " : ""}
                                  {lvl.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notes & Decision Actions */}
                        <div className="grid md:grid-cols-2 gap-3">
                          <input
                            value={
                              explanationMap[app.id] ??
                              app.adminExplanation ??
                              ""
                            }
                            onChange={(e) =>
                              setExplanationMap((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Feedback sent to educator (visible on teacher portal)..."
                            className="learnova-input text-xs py-2"
                          />
                          <input
                            value={
                              internalNotesMap[app.id] ??
                              app.internalNotes ??
                              ""
                            }
                            onChange={(e) =>
                              setInternalNotesMap((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Internal admin verification notes (admins only)..."
                            className="learnova-input text-xs py-2"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {app.status === "PENDING_REVIEW" && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleMarkUnderReview(app.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                            >
                              <Clock size={12} />
                              Start Review
                            </button>
                          )}
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
                            onClick={() =>
                              handleReview(app.id, "RESUBMISSION_REQUIRED")
                            }
                            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/70 transition"
                          >
                            Request Info
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              setConfirmAction({
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
                              setConfirmAction({
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

              {/* Registered Educators Directory */}
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-lavender)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#4F46E5]" />
                    <h2 className="text-base font-bold text-[var(--foreground)]">
                      Educators Directory ({filteredTeachers.length})
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    Click Manage to edit profile, subjects, and class assignments
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
                          <th className="px-5 py-3.5 font-semibold">Educator</th>
                          <th className="px-5 py-3.5 font-semibold">
                            Qualification
                          </th>
                          <th className="px-5 py-3.5 font-semibold">
                            Approved Slots
                          </th>
                          <th className="px-5 py-3.5 font-semibold">Status</th>
                          <th className="px-5 py-3.5 font-semibold text-right">
                            Manage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredTeachers.map((t) => {
                          const approvedCount = approvals.filter(
                            (a) =>
                              a.teacherUserId === t.id &&
                              a.status === "APPROVED"
                          ).length;
                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-[var(--surface-lavender)] transition"
                            >
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-[var(--foreground)]">
                                  {t.fullName}
                                </p>
                                <p className="text-xs text-[var(--foreground-subtle)]">
                                  {t.email}
                                </p>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-[var(--foreground-muted)]">
                                {t.qualification || t.subject || "—"}
                              </td>
                              <td className="px-5 py-3.5 text-xs font-bold tabular-nums text-[var(--foreground)]">
                                {approvedCount} active
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`text-xs font-bold ${getStatusTextColor(
                                    t.status
                                  )}`}
                                >
                                  {formatApplicationStatusLabel(t.status)}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/admin/teachers/${t.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border-strong)] text-xs font-bold text-[var(--foreground)] hover:border-[#4F46E5] transition"
                                >
                                  Manage
                                  <ExternalLink size={11} />
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
                    Approved Subject &amp; Class-Level Authorizations (
                    {approvals.length})
                  </h2>
                </div>
                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--foreground-subtle)]">
                    No approved teacher-subject-level authorizations yet.
                    Approve an application above before scheduling that educator
                    on the timetable.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[var(--surface-lavender)] text-xs text-[var(--foreground-subtle)] uppercase border-b border-[var(--border)]">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Educator</th>
                          <th className="px-5 py-3.5 font-semibold">Subject</th>
                          <th className="px-5 py-3.5 font-semibold">
                            Class Level
                          </th>
                          <th className="px-5 py-3.5 font-semibold">Status</th>
                          <th className="px-5 py-3.5 font-semibold text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {approvals.map((ap) => (
                          <tr
                            key={ap.id}
                            className="hover:bg-[var(--surface-lavender)] transition"
                          >
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
                                  onClick={() =>
                                    handleToggleApproval(ap.id, "REVOKED")
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <ShieldAlert size={12} />
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleToggleApproval(ap.id, "APPROVED")
                                  }
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
          open={Boolean(confirmAction)}
          title={
            confirmAction?.decision === "SUSPENDED"
              ? `Suspend ${confirmAction.teacherName}?`
              : `Reject ${confirmAction?.subjectName} application?`
          }
          description={
            confirmAction?.decision === "SUSPENDED"
              ? "Suspending this application revokes teaching privileges for this subject and locks classroom access if no other approvals remain active."
              : "Rejecting this application will notify the educator with your feedback notes."
          }
          confirmLabel={
            confirmAction?.decision === "SUSPENDED"
              ? "Confirm Suspend"
              : "Confirm Reject"
          }
          tone="danger"
          loading={saving}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction) {
              handleReview(confirmAction.appId, confirmAction.decision);
            }
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
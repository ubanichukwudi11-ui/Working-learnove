"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, EmptyState, CardSkeleton } from "@/components/ui";
import Link from "next/link";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function AdminTeachersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");

  // Per-application review selection state
  const [levelSelectionMap, setLevelSelectionMap] = useState<Record<string, string[]>>({});
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setApplications(json.applications || []);
      setApprovals(json.approvals || []);
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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to review application.");
      setFeedback({
        type: "ok",
        text: `Application updated to ${decision.replace(/_/g, " ")}. Teacher notified.`,
      });
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

  const filteredApps = applications.filter((a) =>
    filter === "ALL" ? true : a.status === filter
  );

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            kicker="Educator Vetting & Subject Authorization"
            title="Teacher Approval Centre"
            description="Review educator credentials, approve specific subjects for chosen class levels (e.g. Mathematics for JSS1–JSS3 or SS1–SS3), request resubmissions, or revoke approvals. Only approved subject-level pairs can be placed on official timetables."
          />

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

          {/* Filter Strip */}
          <div className="flex flex-wrap gap-2">
            {[
              "ALL",
              "PENDING_REVIEW",
              "APPROVED",
              "RESUBMISSION_REQUIRED",
              "REJECTED",
              "SUSPENDED",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  filter === f
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-xs"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[#4F46E5]"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
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
                  title="No Teacher Applications Found"
                  description="When teachers submit subject teaching applications, they will appear here for verification and level-by-level approval."
                />
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const selectedLevels = levelSelectionMap[app.id] || app.classLevelIds || [];
                    return (
                      <div
                        key={app.id}
                        className="learnova-card p-6 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                                {app.teacherName}
                              </h2>
                              <span className="text-xs font-semibold text-[var(--foreground-subtle)]">
                                ({app.teacherEmail})
                              </span>
                              <span aria-hidden="true" className="text-[var(--foreground-subtle)]">·</span>
                              <span
                                className={`text-xs font-bold ${
                                  app.status === "APPROVED"
                                    ? "text-emerald-700 dark:text-emerald-400"
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
                              Qualification: <strong>{app.qualification}</strong> · Institution:{" "}
                              {app.institution || "—"} · Experience: {app.experience || "—"}
                              {app.licenseNumber ? ` · TRCN: ${app.licenseNumber}` : ""}
                            </p>
                          </div>

                          <Link
                            href={`/admin/teachers/${app.teacherUserId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-lavender)] shrink-0 transition"
                          >
                            Full Profile &amp; Documents
                            <ExternalLink size={12} />
                          </Link>
                        </div>

                        {/* Granular Class Level Approval Selector */}
                        <div className="bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-[var(--foreground-muted)]">
                            Select Class Levels Approved to Teach {app.subjectName}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(app.classLevelIds || []).map((lvlId: string) => {
                              const checked = selectedLevels.includes(lvlId);
                              return (
                                <button
                                  type="button"
                                  key={lvlId}
                                  onClick={() => toggleLevelForApp(app.id, lvlId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    checked
                                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                      : "bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border-strong)] hover:border-[#4F46E5]"
                                  }`}
                                >
                                  {checked ? "✓ " : ""}
                                  {levelCode(lvlId)}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation & Decision Actions */}
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                          <input
                            value={explanationMap[app.id] ?? app.adminExplanation ?? ""}
                            onChange={(e) =>
                              setExplanationMap((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Explanation or feedback for teacher (recommended)..."
                            className="flex-1 learnova-input text-xs py-2"
                          />
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                              disabled={saving || selectedLevels.length === 0}
                              onClick={() => handleReview(app.id, "APPROVED")}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold disabled:opacity-50 transition shadow-xs"
                            >
                              Approve Selected Levels
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "RESUBMISSION_REQUIRED")}
                              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/70 transition"
                            >
                              Request Info
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "REJECTED")}
                              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              Reject
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "SUSPENDED")}
                              className="px-3 py-2 rounded-xl border border-[var(--border-strong)] text-[var(--foreground-muted)] text-xs font-semibold hover:bg-[var(--surface-lavender)] transition"
                            >
                              Suspend
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Authorizations Matrix */}
              <div className="learnova-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-lavender)]">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Approved Subject &amp; Class-Level Authorizations ({approvals.length})
                  </h2>
                </div>
                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--foreground-subtle)]">
                    No approved teacher-subject-level authorizations yet. Approve an
                    application above before scheduling that educator on the timetable.
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
                              {ap.teacherName}
                            </td>
                            <td className="px-5 py-3.5 text-[var(--foreground-muted)]">{ap.subjectName}</td>
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
                                  disabled={saving}
                                  onClick={() => handleToggleApproval(ap.id, "REVOKED")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <ShieldAlert size={12} />
                                  Revoke
                                </button>
                              ) : (
                                <button
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
      </AppLayout>
    </ProtectedRoute>
  );
}
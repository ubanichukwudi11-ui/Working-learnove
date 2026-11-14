"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
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
        <div className="space-y-6">
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              Educator Vetting & Subject Authorization
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Teacher Approval Centre
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Review educator credentials, approve specific subjects for chosen class levels
              (e.g. Mathematics for JSS1–JSS3 or SS1–SS3), request resubmissions, or revoke
              approvals. Only approved subject-level pairs can be placed on official timetables.
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === f
                    ? "bg-[#0B1F3A] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading teacher applications...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Applications Queue */}
              {filteredApps.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-2">
                  <GraduationCap size={30} className="mx-auto text-slate-400" />
                  <p className="font-bold text-[#0F1F38]">No Teacher Applications Found</p>
                  <p className="text-xs text-slate-500">
                    When teachers submit subject teaching applications, they will appear here for
                    verification and level-by-level approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const selectedLevels = levelSelectionMap[app.id] || app.classLevelIds || [];
                    return (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-extrabold text-[#0B1F3A]">
                                {app.teacherName}
                              </h2>
                              <span className="text-xs font-semibold text-slate-500">
                                ({app.teacherEmail})
                              </span>
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                                  app.status === "APPROVED"
                                    ? "bg-teal-50 text-[#0D9488]"
                                    : app.status === "PENDING_REVIEW"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {app.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-[#0D9488] mt-1">
                              Subject Requested: {app.subjectName}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Qualification: <strong>{app.qualification}</strong> · Institution:{" "}
                              {app.institution || "—"} · Experience: {app.experience || "—"}
                              {app.licenseNumber ? ` · TRCN: ${app.licenseNumber}` : ""}
                            </p>
                          </div>

                          <Link
                            href={`/admin/teachers/${app.teacherUserId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 shrink-0"
                          >
                            Full Profile & Documents
                            <ExternalLink size={12} />
                          </Link>
                        </div>

                        {/* Granular Class Level Approval Selector */}
                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-bold text-slate-700">
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
                                      ? "bg-[#0D9488] text-white border-[#0D9488]"
                                      : "bg-white text-slate-600 border-slate-200"
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
                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                          />
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                              disabled={saving || selectedLevels.length === 0}
                              onClick={() => handleReview(app.id, "APPROVED")}
                              className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
                            >
                              Approve Selected Levels
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "RESUBMISSION_REQUIRED")}
                              className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100"
                            >
                              Request Info
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "REJECTED")}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                            >
                              Reject
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => handleReview(app.id, "SUSPENDED")}
                              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
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
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#0F1F38]">
                    Approved Subject & Class-Level Authorizations ({approvals.length})
                  </h2>
                </div>
                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No approved teacher-subject-level authorizations yet. Approve an
                    application above before scheduling that educator on the timetable.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Educator</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Class Level</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {approvals.map((ap) => (
                          <tr key={ap.id}>
                            <td className="px-4 py-3 font-semibold text-[#0F1F38]">
                              {ap.teacherName}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{ap.subjectName}</td>
                            <td className="px-4 py-3 font-bold text-[#0B1F3A]">
                              {ap.classLevelName}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                                  ap.status === "APPROVED"
                                    ? "bg-teal-50 text-[#0D9488]"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {ap.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              {ap.status === "APPROVED" ? (
                                <button
                                  disabled={saving}
                                  onClick={() => handleToggleApproval(ap.id, "REVOKED")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                                >
                                  <ShieldAlert size={12} />
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  disabled={saving}
                                  onClick={() => handleToggleApproval(ap.id, "APPROVED")}
                                  className="px-2.5 py-1 rounded-lg bg-[#0D9488] text-white text-xs font-semibold"
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
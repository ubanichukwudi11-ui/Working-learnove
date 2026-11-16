"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const teacherId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);

  const loadTeacher = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/teacher-applications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setTeacher((json.teachers || []).find((t: any) => t.id === teacherId) || null);
      setApps((json.applications || []).filter((a: any) => a.teacherUserId === teacherId));
      setApprovals((json.approvals || []).filter((a: any) => a.teacherUserId === teacherId));
      setClassLevels(json.classLevels || []);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  const reviewApp = async (
    applicationId: string,
    decision: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED",
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

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#4F46E5] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Teacher Approval Centre
          </Link>

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
              Loading educator credentials...
            </div>
          ) : !teacher ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Educator record not found.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                    Educator Dossier
                  </p>
                  <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                    {teacher.fullName}
                  </h1>
                  <p className="text-sm text-[#C4B5FD]">{teacher.email}</p>
                  <p className="text-xs text-[#C4B5FD] mt-2">
                    Qualification: {teacher.qualification || "—"} · Institution:{" "}
                    {teacher.institution || "—"} · TRCN: {teacher.licenseNumber || "—"}
                  </p>
                </div>
                <div className="text-xs font-bold text-[#22D3EE] shrink-0">
                  Account Status: {teacher.status}
                </div>
              </div>

              {/* Uploaded Credentials */}
              <div className="learnova-card p-5">
                <h2 className="text-base font-bold text-[#0B1230] mb-3">
                  Submitted Documents
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: "Teaching Certificate", url: teacher.teachingCertificate },
                    { label: "Degree Certificate", url: teacher.degreeCertificate },
                    { label: "Government ID", url: teacher.governmentId },
                    { label: "Curriculum Vitae (CV)", url: teacher.cv },
                  ].map((doc) => (
                    <div
                      key={doc.label}
                      className="border border-[#E4E1F5] bg-[#FAF8FF] rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-[#0B1230] flex items-center gap-1.5">
                        <FileText size={14} className="text-[#4F46E5] shrink-0" />
                        {doc.label}
                      </span>
                      {doc.url ? (
                        <span className="text-emerald-700 font-bold shrink-0">On File</span>
                      ) : (
                        <span className="text-[#6B6F94] shrink-0">Not uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Applications */}
              <div className="learnova-card p-5 space-y-4">
                <h2 className="text-base font-bold text-[#0B1230]">
                  Subject Applications ({apps.length})
                </h2>
                {apps.length === 0 ? (
                  <p className="text-xs text-[#6B6F94]">No applications submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="border border-[#E4E1F5] bg-[#FAF8FF] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-[#0B1230]">{app.subjectName}</p>
                          <p className="text-xs text-[#6B6F94]">
                            Levels requested: {(app.classLevelIds || []).map(levelCode).join(", ")} ·
                            Status: <strong className="text-[#0B1230]">{app.status}</strong>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={saving}
                            onClick={() => reviewApp(app.id, "APPROVED", app.classLevelIds)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold transition"
                          >
                            Approve All Levels
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => reviewApp(app.id, "RESUBMISSION_REQUIRED", [])}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold transition"
                          >
                            Request Info
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => reviewApp(app.id, "REJECTED", [])}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Authorizations */}
              <div className="learnova-card p-5">
                <h2 className="text-base font-bold text-[#0B1230] mb-3">
                  Authorized Teaching Assignments ({approvals.length})
                </h2>
                {approvals.length === 0 ? (
                  <p className="text-xs text-[#6B6F94]">No approved subject-level slots yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {approvals.map((ap) => (
                      <div
                        key={ap.id}
                        className="px-3.5 py-2.5 rounded-xl bg-[#FAF8FF] border border-[#E4E1F5] flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-[#0B1230]">
                          {ap.subjectName} — {ap.classLevelName}
                        </span>
                        <span
                          className={`font-bold ${
                            ap.status === "APPROVED" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {ap.status}
                        </span>
                      </div>
                    ))}
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
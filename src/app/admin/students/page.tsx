"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { Users, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [enrolments, setEnrolments] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/subscriptions", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setStudents(json.students || []);
      setEnrolments(json.enrolments || []);
      setEntitlements(json.entitlements || []);
      setClassLevels(json.classLevels || []);
      setSubjects(json.subjects || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignLevel = async (student: any, classLevelId: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const levelSubjects = subjects
        .filter((s) => s.classLevelIds.includes(classLevelId))
        .map((s) => s.id);
      const res = await fetch("/api/lms/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ENROLMENT",
          studentUserId: student.id,
          studentName: student.fullName,
          studentEmail: student.email,
          classLevelId,
          subjectIds: levelSubjects.length > 0 ? levelSubjects : subjects.map((s) => s.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setFeedback({ type: "ok", text: `Updated class level for ${student.fullName}.` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to update student." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Student Enrolment Registry
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Students &amp; Class Level Placement
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                View all registered students, verify their assigned class levels (JSS1–SS3), and
                inspect subscription entitlement status.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shrink-0 shadow-xs"
            >
              Manage Payments &amp; Scholarships
            </Link>
          </div>

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
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="learnova-card border-dashed p-12 text-center space-y-2">
              <Users size={30} className="mx-auto text-[#6B6F94]" />
              <p className="font-bold text-[#0B1230]">No Registered Students Yet</p>
              <p className="text-xs text-[#6B6F94]">
                Students who create accounts will appear here automatically for enrolment and
                classroom placement.
              </p>
            </div>
          ) : (
            <div className="learnova-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FAF8FF] text-xs text-[#6B6F94] uppercase border-b border-[#E4E1F5]">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Student</th>
                      <th className="px-4 py-3.5 font-semibold">Enrolled Class Level</th>
                      <th className="px-4 py-3.5 font-semibold">Access Status</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Place / Reassign Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1F5]">
                    {students.map((st) => {
                      const enr = enrolments.find((e) => e.studentUserId === st.id);
                      const ent = entitlements.find((e) => e.studentUserId === st.id);
                      const activeStatus = ent?.accessStatus || enr?.status || "REGISTERED";
                      const currentLevelId = enr?.classLevelId || ent?.classLevelId || "";
                      const lvlCode =
                        classLevels.find((c) => c.id === currentLevelId)?.code ||
                        st.classLevel ||
                        "Unassigned";

                      return (
                        <tr key={st.id} className="hover:bg-[#FAF8FF]/70 transition">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#0B1230]">{st.fullName}</p>
                            <p className="text-xs text-[#6B6F94]">{st.email}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#0B1230]">{lvlCode}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold ${
                                activeStatus === "ACTIVE_PAID" ||
                                activeStatus === "SCHOLARSHIP_GRANTED"
                                  ? "text-emerald-700"
                                  : activeStatus === "AWAITING_CONFIRMATION"
                                  ? "text-amber-700"
                                  : "text-[#6B6F94]"
                              }`}
                            >
                              {activeStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <select
                              aria-label={`Class level for ${st.email}`}
                              value={currentLevelId}
                              disabled={saving}
                              onChange={(e) => {
                                if (e.target.value) handleAssignLevel(st, e.target.value);
                              }}
                              className="learnova-input w-auto text-xs font-semibold py-1.5 px-2.5"
                            >
                              <option value="">Select Class Level...</option>
                              {classLevels.map((lvl) => (
                                <option key={lvl.id} value={lvl.id}>
                                  {lvl.code} · {lvl.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
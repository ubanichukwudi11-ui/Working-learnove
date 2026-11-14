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
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                Student Enrolment Registry
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Students & Class Level Placement
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                View all registered students, verify their assigned class levels (JSS1–SS3), and
                inspect subscription entitlement status.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold transition shrink-0"
            >
              Manage Payments & Scholarships
            </Link>
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

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-2">
              <Users size={30} className="mx-auto text-slate-400" />
              <p className="font-bold text-[#0F1F38]">No Registered Students Yet</p>
              <p className="text-xs text-slate-500">
                Students who create accounts will appear here automatically for enrolment and
                classroom placement.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Enrolled Class Level</th>
                      <th className="px-4 py-3">Access Status</th>
                      <th className="px-4 py-3 text-right">Place / Reassign Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        <tr key={st.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#0F1F38]">{st.fullName}</p>
                            <p className="text-xs text-slate-500">{st.email}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#0B1F3A]">{lvlCode}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                activeStatus === "ACTIVE_PAID" ||
                                activeStatus === "SCHOLARSHIP_GRANTED"
                                  ? "bg-teal-50 text-[#0D9488]"
                                  : activeStatus === "AWAITING_CONFIRMATION"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
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
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold bg-white"
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
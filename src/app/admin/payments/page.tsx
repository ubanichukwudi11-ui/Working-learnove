"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Gift,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Grant Scholarship form
  const [schStudentId, setSchStudentId] = useState("");
  const [schLevelId, setSchLevelId] = useState("lvl-ss1");
  const [schAllSubjects, setSchAllSubjects] = useState(true);
  const [schSubjectIds, setSchSubjectIds] = useState<string[]>([]);
  const [schDays, setSchDays] = useState("90");
  const [schReason, setSchReason] = useState("Merit Scholarship / Institutional Waiver");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/subscriptions", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setStudents(json.students || []);
      setPayments(json.payments || []);
      setEntitlements(json.entitlements || []);
      setClassLevels(json.classLevels || []);
      setSubjects(json.subjects || []);
      if (!schStudentId && (json.students || []).length > 0) {
        setSchStudentId(json.students[0].id);
      }
      if (!schLevelId && (json.classLevels || []).length > 0) {
        setSchLevelId(json.classLevels[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [schStudentId, schLevelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const postAction = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed.");
      setFeedback({ type: "ok", text: okMessage });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
    } finally {
      setSaving(false);
    }
  };

  const filteredEntitlements = entitlements.filter((e) =>
    statusFilter === "ALL" ? true : e.accessStatus === statusFilter
  );

  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                Student Enrolment, Revenue &amp; Access Governance
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Payments &amp; Subscription Access Control
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Verify student bank transfers, inspect confirmed Paystack receipts, grant
                authorized scholarships, or expire/revoke unpaid access.
              </p>
            </div>
            <button
              disabled={saving}
              onClick={() =>
                postAction({ action: "RUN_EXPIRY_CHECK" }, "Subscription expiry scan complete.")
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition shrink-0"
            >
              <RefreshCw size={15} />
              Run Expiry Check
            </button>
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
              Loading payments and entitlements...
            </div>
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* GRANT SCHOLARSHIP / AUTHORIZED ACCESS */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    postAction(
                      {
                        action: "GRANT_SCHOLARSHIP",
                        studentUserId: schStudentId,
                        classLevelId: schLevelId,
                        allSubjects: schAllSubjects,
                        subjectIds: schSubjectIds,
                        durationDays: Number(schDays),
                        reason: schReason,
                      },
                      "Scholarship / authorized access activated."
                    );
                  }}
                  className="learnova-card p-5 space-y-4 h-fit"
                >
                  <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                    <Gift size={16} className="text-[#4F46E5]" />
                    Grant Scholarship / Access
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Student Account
                    </label>
                    <select
                      required
                      value={schStudentId}
                      onChange={(e) => setSchStudentId(e.target.value)}
                      className="learnova-input text-sm"
                    >
                      {students.length === 0 && <option value="">No registered students</option>}
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.fullName} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Class Level
                      </label>
                      <select
                        value={schLevelId}
                        onChange={(e) => setSchLevelId(e.target.value)}
                        className="learnova-input text-sm"
                      >
                        {classLevels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Validity (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={schDays}
                        onChange={(e) => setSchDays(e.target.value)}
                        className="learnova-input text-sm tabular-nums"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#43466E]">
                    <input
                      type="checkbox"
                      checked={schAllSubjects}
                      onChange={(e) => setSchAllSubjects(e.target.checked)}
                      className="accent-[#4F46E5]"
                    />
                    Grant access to all subjects in class level
                  </label>
                  {!schAllSubjects && (
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() =>
                            setSchSubjectIds((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((x) => x !== s.id)
                                : [...prev, s.id]
                            )
                          }
                          className={`px-2 py-1 rounded text-xs font-semibold border transition ${
                            schSubjectIds.includes(s.id)
                              ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                              : "bg-[#FAF8FF] text-[#43466E] border-[#DCD7F5]"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Authorization Reason (Required)
                    </label>
                    <input
                      required
                      value={schReason}
                      onChange={(e) => setSchReason(e.target.value)}
                      className="learnova-input text-sm"
                    />
                  </div>
                  <button
                    disabled={saving || !schStudentId}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-xs"
                  >
                    Activate Authorized Access
                  </button>
                </form>

                {/* PAYMENT VERIFICATION QUEUE */}
                <div className="lg:col-span-2 learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF] flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                      <CreditCard size={16} className="text-[#4F46E5]" />
                      Payment Records &amp; Bank Transfer Verification ({payments.length})
                    </h2>
                  </div>
                  {payments.length === 0 ? (
                    <div className="p-10 text-center text-sm text-[#6B6F94]">
                      No payment transactions submitted yet. Student Paystack checkouts and bank
                      transfer references will appear here.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E4E1F5]">
                      {payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#0B1230]">{pay.studentName}</p>
                              <span className="text-xs font-bold text-[#0B1230] tabular-nums">
                                ₦{Number(pay.amountNgn).toLocaleString()}
                              </span>
                              <span aria-hidden="true" className="text-[#6B6F94]">·</span>
                              <span
                                className={`text-xs font-bold ${
                                  pay.status === "VERIFIED"
                                    ? "text-emerald-700"
                                    : pay.status === "AWAITING_CONFIRMATION"
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {pay.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B6F94] mt-1">
                              {pay.planName} · {levelCode(pay.classLevelId)} · {pay.provider} · Ref:{" "}
                              <span className="font-mono font-semibold text-[#0B1230]">{pay.reference}</span>
                            </p>
                          </div>
                          {pay.status === "AWAITING_CONFIRMATION" && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                disabled={saving}
                                onClick={() =>
                                  postAction(
                                    { action: "VERIFY_PAYMENT", paymentId: pay.id, approve: true },
                                    `Verified payment for ${pay.studentName}.`
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold hover:from-[#4338CA] hover:to-[#6D28D9] transition"
                              >
                                Verify &amp; Activate
                              </button>
                              <button
                                disabled={saving}
                                onClick={() =>
                                  postAction(
                                    {
                                      action: "VERIFY_PAYMENT",
                                      paymentId: pay.id,
                                      approve: false,
                                      notes: "Reference not matched on bank statement.",
                                    },
                                    `Declined payment reference ${pay.reference}.`
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STUDENT ENTITLEMENTS TABLE */}
              <div className="learnova-card overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-[#0B1230]">
                    Student Access Entitlements ({filteredEntitlements.length})
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "ALL",
                      "ACTIVE_PAID",
                      "SCHOLARSHIP_GRANTED",
                      "AWAITING_CONFIRMATION",
                      "ENROLLED",
                      "EXPIRED",
                    ].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          statusFilter === st
                            ? "bg-[#0B1230] text-white"
                            : "bg-white text-[#43466E] border border-[#E4E1F5] hover:border-[#4F46E5]"
                        }`}
                      >
                        {st.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredEntitlements.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#6B6F94]">
                    No student entitlements match this filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#FAF8FF] text-xs text-[#6B6F94] uppercase border-b border-[#E4E1F5]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Student</th>
                          <th className="px-4 py-3 font-semibold">Class Level</th>
                          <th className="px-4 py-3 font-semibold">Access Status</th>
                          <th className="px-4 py-3 font-semibold">Expires</th>
                          <th className="px-4 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E1F5]">
                        {filteredEntitlements.map((ent) => (
                          <tr key={ent.id} className="hover:bg-[#FAF8FF]/70 transition">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0B1230]">{ent.studentName}</p>
                              <p className="text-xs text-[#6B6F94]">{ent.studentEmail}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs text-[#0B1230]">
                              {levelCode(ent.classLevelId)} ·{" "}
                              {ent.allSubjects
                                ? "All Subjects"
                                : `${ent.subjectIds?.length || 0} subjects`}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-bold ${
                                  ent.accessStatus === "ACTIVE_PAID" ||
                                  ent.accessStatus === "SCHOLARSHIP_GRANTED"
                                    ? "text-emerald-700"
                                    : ent.accessStatus === "AWAITING_CONFIRMATION"
                                    ? "text-amber-700"
                                    : ent.accessStatus === "EXPIRED"
                                    ? "text-rose-700"
                                    : "text-[#6B6F94]"
                                }`}
                              >
                                {ent.accessStatus.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B6F94] tabular-nums">
                              {ent.expiresAt
                                ? new Date(ent.expiresAt).toLocaleDateString("en-NG")
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(ent.accessStatus === "ACTIVE_PAID" ||
                                ent.accessStatus === "SCHOLARSHIP_GRANTED") && (
                                <button
                                  disabled={saving}
                                  onClick={() =>
                                    postAction(
                                      {
                                        action: "REVOKE_ACCESS",
                                        studentUserId: ent.studentUserId,
                                        status: "EXPIRED",
                                        reason: "Access expired or revoked by School Admin.",
                                      },
                                      `Revoked classroom access for ${ent.studentName}.`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition"
                                >
                                  <ShieldAlert size={13} />
                                  Revoke / Expire
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
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

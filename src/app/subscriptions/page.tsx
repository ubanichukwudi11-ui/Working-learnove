"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function StudentSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [enrolment, setEnrolment] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [gatewayInfo, setGatewayInfo] = useState({
    paystackServerEnabled: false,
    allowManualBankTransfer: true,
  });

  // Enrolment state
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Payment checkout state
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [paystackRef, setPaystackRef] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/subscriptions", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setEnrolment(json.enrolment || null);
      setEntitlement(json.entitlement || null);
      setPayments(json.payments || []);
      setPlans(json.plans || []);
      setClassLevels(json.classLevels || []);
      setSubjects(json.subjects || []);
      setGatewayInfo({
        paystackServerEnabled: Boolean(json.paystackServerEnabled),
        allowManualBankTransfer: Boolean(json.allowManualBankTransfer),
      });

      const defLvl =
        json.enrolment?.classLevelId ||
        json.entitlement?.classLevelId ||
        json.classLevels?.[0]?.id ||
        "";
      if (!selectedLevelId && defLvl) setSelectedLevelId(defLvl);

      if (selectedSubjectIds.length === 0 && (json.enrolment?.subjectIds || []).length > 0) {
        setSelectedSubjectIds(json.enrolment.subjectIds);
      }
      if (!selectedPlanId && (json.plans || []).length > 0) {
        setSelectedPlanId(json.plans[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLevelId, selectedPlanId, selectedSubjectIds.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const levelSubjects = subjects.filter(
    (s) => !selectedLevelId || (s.classLevelIds || []).includes(selectedLevelId)
  );

  const toggleSubject = (sid: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const handleSaveEnrolment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const subList =
        selectedSubjectIds.length > 0
          ? selectedSubjectIds
          : levelSubjects.map((s) => s.id);
      const res = await fetch("/api/lms/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ENROLMENT",
          classLevelId: selectedLevelId,
          subjectIds: subList,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update enrolment.");
      setFeedback({ type: "ok", text: "Class level and enrolled subjects updated." });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Enrolment failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_BANK_TRANSFER",
          planId: selectedPlanId,
          classLevelId: selectedLevelId,
          subjectIds:
            selectedSubjectIds.length > 0
              ? selectedSubjectIds
              : levelSubjects.map((s) => s.id),
          reference: transferRef,
          notes: transferNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed.");
      setFeedback({
        type: "ok",
        text: "Transfer reference submitted (Awaiting Confirmation). School Admin has been notified.",
      });
      setTransferRef("");
      setTransferNotes("");
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Submission failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paystackRef,
          planId: selectedPlanId,
          classLevelId: selectedLevelId,
          subjectIds: selectedSubjectIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Paystack verification failed.");
      setFeedback({
        type: "ok",
        text: "Payment verified with Paystack! Your live classrooms are now unlocked.",
      });
      setPaystackRef("");
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Paystack verification failed." });
    } finally {
      setSaving(false);
    }
  };

  const statusText = entitlement?.accessStatus || enrolment?.status || "REGISTERED";
  const levelName =
    classLevels.find((c) => c.id === (entitlement?.classLevelId || enrolment?.classLevelId))
      ?.name || "Not Selected";

  return (
    <ProtectedRoute roles={["STUDENT"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                Enrolment &amp; Term Subscription Access (₦)
              </p>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold mt-1">
                My Class Enrolment &amp; Subscription Plan
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Confirm your secondary class level (JSS1–SS3), select your subjects, and
                activate a term or monthly pass to unlock scheduled live classrooms.
              </p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 shrink-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">
                Current Access Status
              </p>
              <p className="text-sm font-extrabold text-[#22D3EE] mt-0.5">
                {statusText.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{levelName}</p>
            </div>
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
              Loading your enrolment &amp; subscription plans...
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Step 1: Class Level & Subject Enrolment */}
              <form
                onSubmit={handleSaveEnrolment}
                className="learnova-card p-6 space-y-4"
              >
                <h2 className="landing-display text-base font-bold text-[#0B1230] flex items-center gap-2">
                  <BookOpen size={17} className="text-[#4F46E5]" />
                  Step 1: Confirm Class Level &amp; Subjects
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-1">
                    Your Class Level
                  </label>
                  <select
                    value={selectedLevelId}
                    onChange={(e) => {
                      setSelectedLevelId(e.target.value);
                      setSelectedSubjectIds([]);
                    }}
                    className="learnova-input w-full px-3 py-2.5 text-sm font-semibold"
                  >
                    {classLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.code} · {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43466E] mb-2">
                    Subjects You Offer ({selectedSubjectIds.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {levelSubjects.map((s) => {
                      const active = selectedSubjectIds.includes(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            active
                              ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-[#4F46E5]"
                              : "bg-[#FAF8FF] text-[#43466E] border-[#E4E1F5] hover:bg-[#F5F3FF]"
                          }`}
                        >
                          {active ? "✓ " : ""}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  disabled={saving || !selectedLevelId}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-semibold transition shadow-sm"
                >
                  {saving ? "Saving..." : "Save Class Enrolment"}
                </button>
              </form>

              {/* Step 2: Subscription Plans & Payment Verification */}
              <div className="learnova-card p-6 space-y-5">
                <h2 className="landing-display text-base font-bold text-[#0B1230] flex items-center gap-2">
                  <CreditCard size={17} className="text-[#7C3AED]" />
                  Step 2: Choose Subscription Plan (₦)
                </h2>

                <div className="space-y-2.5">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className={`block border rounded-2xl p-4 cursor-pointer transition ${
                        selectedPlanId === p.id
                          ? "border-[#7C3AED] bg-[#F5F3FF]"
                          : "border-[#E4E1F5] bg-[#FAF8FF] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="plan"
                            checked={selectedPlanId === p.id}
                            onChange={() => setSelectedPlanId(p.id)}
                            className="accent-[#4F46E5]"
                          />
                          <div>
                            <p className="font-bold text-[#0B1230] text-sm">{p.name}</p>
                            <p className="text-xs text-[#6B6F94]">
                              {p.billingCycle} · {p.durationDays} days
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-extrabold text-[#4F46E5] tabular-nums">
                          ₦{Number(p.priceNgn).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#43466E] mt-1.5 ml-6">{p.description}</p>
                    </label>
                  ))}
                </div>

                {/* Paystack Reference Verification (if configured) */}
                {gatewayInfo.paystackServerEnabled && (
                  <form
                    onSubmit={handleVerifyPaystack}
                    className="border-t border-[#E4E1F5] pt-4 space-y-3"
                  >
                    <p className="text-xs font-bold text-[#0B1230] flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#4F46E5]" />
                      Paystack Server-Verified Reference
                    </p>
                    <div className="flex gap-2">
                      <input
                        required
                        value={paystackRef}
                        onChange={(e) => setPaystackRef(e.target.value)}
                        placeholder="Enter Paystack transaction reference..."
                        className="learnova-input flex-1 px-3 py-2 text-xs"
                      />
                      <button
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                      >
                        Verify Paystack
                      </button>
                    </div>
                  </form>
                )}

                {/* Bank Transfer Submission */}
                {gatewayInfo.allowManualBankTransfer && (
                  <form
                    onSubmit={handleBankTransferSubmit}
                    className="border-t border-[#E4E1F5] pt-4 space-y-3"
                  >
                    <p className="text-xs font-bold text-[#0B1230] flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-600" />
                      Bank Transfer Confirmation (Verified by School Admin)
                    </p>
                    <input
                      required
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="Bank Transfer Reference / Teller ID (e.g. NIP-2026-...)"
                      className="learnova-input w-full px-3 py-2 text-xs"
                    />
                    <input
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      placeholder="Sender bank name or account name (optional)"
                      className="learnova-input w-full px-3 py-2 text-xs"
                    />
                    <button
                      disabled={saving || !selectedPlanId || !selectedLevelId}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold disabled:opacity-50 transition shadow-sm"
                    >
                      {saving ? "Submitting..." : "Submit Payment Reference for Verification"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Student Payment History */}
          {payments.length > 0 && (
            <div className="learnova-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E1F5]">
                <h2 className="landing-display text-base font-bold text-[#0B1230]">
                  Payment History
                </h2>
              </div>
              <div className="divide-y divide-[#E4E1F5]">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#0B1230] tabular-nums">
                        {p.planName} · ₦{Number(p.amountNgn).toLocaleString()}
                      </p>
                      <p className="text-[#6B6F94]">
                        {p.provider} · Ref: <span className="font-mono">{p.reference}</span>
                      </p>
                    </div>
                    <span
                      className={`font-bold shrink-0 ${
                        p.status === "VERIFIED"
                          ? "text-emerald-700"
                          : p.status === "AWAITING_CONFIRMATION"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

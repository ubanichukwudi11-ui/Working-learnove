"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, CardSkeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
} from "lucide-react";

type PaymentStage = "idle" | "initializing" | "checkout" | "verifying";

type SuccessReceipt = {
  planName: string;
  amountNgn: number;
  accessStatus: string;
  expiresAt?: string;
  reference: string;
};

export default function StudentSubscriptionsPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("idle");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<SuccessReceipt | null>(null);

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

  // Enrolment & plan selection state
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [paystackRef, setPaystackRef] = useState("");
  const [showManualVerify, setShowManualVerify] = useState(false);

  // Active subscription collapsible managers
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [showEnrolmentEditor, setShowEnrolmentEditor] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  const paystackInFlightRef = useRef(false);
  const processedCallbackRefs = useRef<Set<string>>(new Set());

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
      setNowMs(Date.now());
      setGatewayInfo({
        paystackServerEnabled: Boolean(json.paystackServerEnabled),
        allowManualBankTransfer: Boolean(json.allowManualBankTransfer),
      });

      const defLvl =
        json.enrolment?.classLevelId ||
        json.entitlement?.classLevelId ||
        json.classLevels?.[0]?.id ||
        "";
      setSelectedLevelId((prev) => prev || defLvl);

      if ((json.enrolment?.subjectIds || []).length > 0) {
        setSelectedSubjectIds((prev) =>
          prev.length > 0 ? prev : json.enrolment.subjectIds
        );
      }
      if ((json.plans || []).length > 0) {
        setSelectedPlanId((prev) => prev || json.plans[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const verifyReferenceOnServer = useCallback(
    async (reference: string) => {
      if (!reference.trim()) return;
      setPaymentStage("verifying");
      setSaving(true);
      setFeedback(null);
      try {
        const res = await fetch("/api/lms/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: reference.trim(),
            planId: selectedPlanId || undefined,
            classLevelId: selectedLevelId || undefined,
            subjectIds: selectedSubjectIds,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Paystack verification failed.");
        }

        const verifiedPlanName =
          json.planName || json.payment?.planName || "Learnova Subscription";
        const verifiedAmount = Number(
          json.amountNgn || json.payment?.amountNgn || 0
        );
        const verifiedStatus =
          json.accessStatus || json.entitlement?.accessStatus || "ACTIVE_PAID";
        const verifiedExpiry =
          json.expiresAt || json.entitlement?.expiresAt || undefined;

        setSuccessReceipt({
          planName: verifiedPlanName,
          amountNgn: verifiedAmount,
          accessStatus: verifiedStatus,
          expiresAt: verifiedExpiry,
          reference: reference.trim(),
        });
        setFeedback({
          type: "ok",
          text: `Payment verified (${verifiedPlanName}). Your subscription access is now active.`,
        });
        setPaystackRef("");
        setShowUpgradePanel(false);
        await Promise.all([loadData(), refreshUser()]);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Paystack verification failed.";
        setFeedback({ type: "err", text: msg });
      } finally {
        setSaving(false);
        setPaymentStage("idle");
        paystackInFlightRef.current = false;
      }
    },
    [selectedPlanId, selectedLevelId, selectedSubjectIds, loadData, refreshUser]
  );

  // Automatic server-side verification when returning from Paystack hosted checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref && !processedCallbackRefs.current.has(ref)) {
      processedCallbackRefs.current.add(ref);
      window.history.replaceState({}, "", window.location.pathname);
      verifyReferenceOnServer(ref);
    }
  }, [verifyReferenceOnServer]);

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
      setShowEnrolmentEditor(false);
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

  const handleStartPaystackCheckout = async () => {
    if (paystackInFlightRef.current || paymentStage !== "idle") {
      return;
    }
    if (!selectedPlanId || !selectedLevelId) {
      setFeedback({
        type: "err",
        text: "Please select your class level and subscription plan first.",
      });
      return;
    }

    paystackInFlightRef.current = true;
    setPaymentStage("initializing");
    setSaving(true);
    setFeedback(null);
    try {
      const subList =
        selectedSubjectIds.length > 0
          ? selectedSubjectIds
          : levelSubjects.map((s) => s.id);
      const res = await fetch("/api/lms/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          classLevelId: selectedLevelId,
          subjectIds: subList,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not start Paystack checkout.");
      }

      if (json.accessCode) {
        try {
          setPaymentStage("checkout");
          const PaystackPop = (await import("@paystack/inline-js")).default;
          const popup = new PaystackPop();
          popup.resumeTransaction(json.accessCode, {
            onSuccess: (trx) => {
              verifyReferenceOnServer(trx.reference || json.reference);
            },
            onCancel: () => {
              paystackInFlightRef.current = false;
              setPaymentStage("idle");
              setSaving(false);
              setFeedback({
                type: "err",
                text: "Payment was cancelled before completion. No charge was applied.",
              });
            },
            onError: (err) => {
              paystackInFlightRef.current = false;
              setPaymentStage("idle");
              setSaving(false);
              setFeedback({
                type: "err",
                text: err?.message || "Paystack checkout encountered an error.",
              });
            },
          });
          return;
        } catch {
          // Fall back to hosted Paystack checkout URL below
        }
      }

      if (json.authorizationUrl) {
        window.location.assign(json.authorizationUrl);
        return;
      }

      throw new Error("Paystack checkout URL was not returned.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to launch Paystack checkout.";
      setFeedback({ type: "err", text: msg });
      setSaving(false);
      setPaymentStage("idle");
      paystackInFlightRef.current = false;
    }
  };

  const handleVerifyPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paystackInFlightRef.current) return;
    paystackInFlightRef.current = true;
    await verifyReferenceOnServer(paystackRef);
  };

  const statusText = entitlement?.accessStatus || enrolment?.status || "REGISTERED";
  const isExpired =
    statusText === "EXPIRED" ||
    (Boolean(entitlement?.expiresAt) &&
      nowMs > 0 &&
      new Date(entitlement.expiresAt).getTime() < nowMs);
  const isActiveSubscription =
    !isExpired &&
    (statusText === "ACTIVE_PAID" || statusText === "SCHOLARSHIP_GRANTED");

  const levelName =
    classLevels.find((c) => c.id === (entitlement?.classLevelId || enrolment?.classLevelId))
      ?.name || "Not Selected";

  const latestVerifiedPayment = payments.find((p) => p.status === "VERIFIED");
  const activePlanName =
    latestVerifiedPayment?.planName ||
    (statusText === "SCHOLARSHIP_GRANTED"
      ? "School Scholarship Access"
      : "Active Term Subscription");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const payButtonLabel =
    paymentStage === "initializing"
      ? "Preparing Paystack Checkout..."
      : paymentStage === "checkout"
      ? "Complete Payment in Paystack..."
      : paymentStage === "verifying"
      ? "Verifying Payment with Server..."
      : `Pay Securely with Paystack (₦${Number(selectedPlan?.priceNgn || 0).toLocaleString()})`;

  return (
    <ProtectedRoute roles={["STUDENT"]}>
      <AppLayout>
        <div className="space-y-7">
          <PageHeader
            kicker="Enrolment & Subscription Access (₦)"
            title={
              isActiveSubscription
                ? "Subscription & Enrolment Details"
                : "Class Enrolment & Subscription Plan"
            }
            description={
              isActiveSubscription
                ? "Your Learnova learning access is verified and active. Manage your enrolled subjects or inspect payment receipts below."
                : "Confirm your secondary class level (JSS1–SS3), select your subjects, and activate a Nigerian Naira plan to unlock live classrooms."
            }
            actions={
              <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 shrink-0 min-w-[200px]">
                <p className="text-[11px] uppercase tracking-wider text-indigo-200/80">
                  Access Status
                </p>
                <p
                  className={`text-sm font-extrabold mt-0.5 ${
                    isActiveSubscription
                      ? "text-emerald-300"
                      : isExpired
                      ? "text-rose-300"
                      : "text-[#22D3EE]"
                  }`}
                >
                  {isExpired ? "EXPIRED" : statusText.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-indigo-100/80 mt-0.5">{levelName}</p>
              </div>
            }
          />

          {feedback && (
            <div
              className={`rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center gap-2.5 border ${
                feedback.type === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {feedback.type === "ok" ? (
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Expired Renewal Notification */}
          {!loading && isExpired && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/90 dark:bg-rose-950/35 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <RefreshCw size={16} />
                  Your Subscription Has Expired
                </p>
                <p className="text-xs text-rose-800/85 dark:text-rose-300/85 leading-relaxed">
                  {entitlement?.expiresAt
                    ? `Your previous access ended on ${new Date(
                        entitlement.expiresAt
                      ).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}. Choose a plan below to renew live classes and study recordings.`
                    : "Your previous term pass has ended. Select a plan below to restore full access."}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <CardSkeleton lines={5} />
              <CardSkeleton lines={5} />
            </div>
          ) : isActiveSubscription ? (
            <div className="space-y-6">
              {/* Active Subscription Summary Card (no permanent purchase prompt) */}
              <div className="learnova-card p-6 sm:p-7 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        Active Subscription
                      </span>
                      <h2 className="landing-display text-xl font-extrabold text-[var(--foreground)] mt-1">
                        {activePlanName}
                      </h2>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        Class Level: <strong>{levelName}</strong>
                        {entitlement?.expiresAt
                          ? ` · Valid until ${new Date(
                              entitlement.expiresAt
                            ).toLocaleDateString("en-NG", { dateStyle: "long" })}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEnrolmentEditor((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)] text-xs font-bold transition"
                    >
                      <BookOpen size={14} className="text-[#4F46E5] dark:text-indigo-400" />
                      Edit Class &amp; Subjects
                      {showEnrolmentEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpgradePanel((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-xs"
                    >
                      <Sparkles size={14} />
                      Upgrade or Extend Plan
                      {showUpgradePanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                      Access Scope
                    </p>
                    <p className="text-sm font-bold text-[var(--foreground)] mt-1">
                      {entitlement?.allSubjects
                        ? "All Subjects Unlocked"
                        : `${(entitlement?.subjectIds || []).length} Subject(s) Unlocked`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                      Valid Until
                    </p>
                    <p className="text-sm font-bold text-[var(--foreground)] mt-1">
                      {entitlement?.expiresAt
                        ? new Date(entitlement.expiresAt).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Current Term"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                      Verification
                    </p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {entitlement?.grantedBy || "Server Verified"}
                    </p>
                  </div>
                </div>
              </div>

              {showEnrolmentEditor && (
                <form onSubmit={handleSaveEnrolment} className="learnova-card p-6 space-y-4">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <BookOpen size={17} className="text-[#4F46E5] dark:text-indigo-400" />
                    Update Class Level &amp; Offered Subjects
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                        Class Level
                      </label>
                      <select
                        value={selectedLevelId}
                        onChange={(e) => {
                          setSelectedLevelId(e.target.value);
                          setSelectedSubjectIds([]);
                        }}
                        className="learnova-input text-sm font-semibold"
                      >
                        {classLevels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.code} · {lvl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
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
                                : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--surface-subtle)]"
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
                  >
                    {saving ? "Saving..." : "Save Class Enrolment"}
                  </button>
                </form>
              )}

              {showUpgradePanel && (
                <div className="learnova-card p-6 space-y-5">
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <CreditCard size={17} className="text-[#7C3AED] dark:text-violet-400" />
                    Upgrade or Renew Ahead of Expiry (₦)
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {plans.map((p) => (
                      <label
                        key={p.id}
                        className={`block border rounded-2xl p-4 cursor-pointer transition ${
                          selectedPlanId === p.id
                            ? "border-[#7C3AED] bg-[var(--surface-subtle)]"
                            : "border-[var(--border)] bg-[var(--surface-lavender)] hover:bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="plan-upgrade"
                              checked={selectedPlanId === p.id}
                              onChange={() => setSelectedPlanId(p.id)}
                              className="accent-[#4F46E5]"
                            />
                            <div>
                              <p className="font-bold text-[var(--foreground)] text-sm">{p.name}</p>
                              <p className="text-xs text-[var(--foreground-subtle)]">
                                {p.billingCycle} · {p.durationDays} days
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-extrabold text-[#4F46E5] dark:text-indigo-400 tabular-nums">
                            ₦{Number(p.priceNgn).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1.5 ml-6">{p.description}</p>
                      </label>
                    ))}
                  </div>
                  {gatewayInfo.paystackServerEnabled && (
                    <button
                      type="button"
                      disabled={paymentStage !== "idle" || !selectedPlanId || !selectedLevelId}
                      onClick={handleStartPaystackCheckout}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-md shadow-[#4F46E5]/20"
                    >
                      {payButtonLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Step 1: Class Level & Subject Enrolment */}
              <form
                onSubmit={handleSaveEnrolment}
                className="learnova-card p-6 space-y-5"
              >
                <div>
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <BookOpen size={17} className="text-[#4F46E5] dark:text-indigo-400" />
                    Step 1: Confirm Class Level &amp; Subjects
                  </h2>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                    Choose your secondary level and select the subjects you plan to study.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                    Your Class Level
                  </label>
                  <select
                    value={selectedLevelId}
                    onChange={(e) => {
                      setSelectedLevelId(e.target.value);
                      setSelectedSubjectIds([]);
                    }}
                    className="learnova-input text-sm font-semibold"
                  >
                    {classLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.code} · {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
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
                              : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--surface-subtle)]"
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
                <div>
                  <h2 className="landing-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <CreditCard size={17} className="text-[#7C3AED] dark:text-violet-400" />
                    Step 2: Choose Subscription Plan (₦)
                  </h2>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                    Access unlocks automatically as soon as your payment is verified on the server.
                  </p>
                </div>

                <div className="space-y-3">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className={`block border rounded-2xl p-4 cursor-pointer transition ${
                        selectedPlanId === p.id
                          ? "border-[#7C3AED] bg-[var(--surface-subtle)]"
                          : "border-[var(--border)] bg-[var(--surface-lavender)] hover:bg-[var(--surface)]"
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
                            <p className="font-bold text-[var(--foreground)] text-sm">{p.name}</p>
                            <p className="text-xs text-[var(--foreground-subtle)]">
                              {p.billingCycle} · {p.durationDays} days
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-extrabold text-[#4F46E5] dark:text-indigo-400 tabular-nums">
                          ₦{Number(p.priceNgn).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1.5 ml-6">{p.description}</p>
                    </label>
                  ))}
                </div>

                {/* Paystack Instant Checkout + Callback Verification */}
                {gatewayInfo.paystackServerEnabled && (
                  <div className="border-t border-[var(--border)] pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#4F46E5] dark:text-indigo-400" />
                        Pay Instantly via Paystack (Card / Bank / USSD)
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowManualVerify((v) => !v)}
                        className="text-[11px] font-semibold text-[#6D28D9] dark:text-violet-400 hover:underline shrink-0"
                      >
                        {showManualVerify ? "Hide manual verify" : "Verify ref"}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={paymentStage !== "idle" || !selectedPlanId || !selectedLevelId}
                      onClick={handleStartPaystackCheckout}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-md shadow-[#4F46E5]/20"
                    >
                      {payButtonLabel}
                    </button>

                    {showManualVerify && (
                      <form onSubmit={handleVerifyPaystack} className="flex gap-2 pt-1">
                        <input
                          required
                          value={paystackRef}
                          onChange={(e) => setPaystackRef(e.target.value)}
                          placeholder="Already paid? Enter Paystack reference..."
                          className="learnova-input flex-1 text-xs"
                        />
                        <button
                          disabled={paymentStage !== "idle"}
                          className="px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] hover:bg-[var(--surface-subtle)] text-[#4F46E5] dark:text-indigo-300 text-xs font-bold transition"
                        >
                          Verify
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Bank Transfer Submission */}
                {gatewayInfo.allowManualBankTransfer && (
                  <form
                    onSubmit={handleBankTransferSubmit}
                    className="border-t border-[var(--border)] pt-4 space-y-3"
                  >
                    <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                      Bank Transfer Confirmation (Verified by School Admin)
                    </p>
                    <input
                      required
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="Bank Transfer Reference / Teller ID (e.g. NIP-2026-...)"
                      className="learnova-input text-xs"
                    />
                    <input
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      placeholder="Sender bank name or account name (optional)"
                      className="learnova-input text-xs"
                    />
                    <button
                      disabled={saving || paymentStage !== "idle" || !selectedPlanId || !selectedLevelId}
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
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="landing-display text-base font-bold text-[var(--foreground)]">
                  Payment History
                </h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[var(--foreground)] tabular-nums">
                        {p.planName} · ₦{Number(p.amountNgn).toLocaleString()}
                      </p>
                      <p className="text-[var(--foreground-subtle)]">
                        {p.provider} · Ref: <span className="font-mono">{p.reference}</span>
                      </p>
                    </div>
                    <span
                      className={`font-bold shrink-0 ${
                        p.status === "VERIFIED"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : p.status === "AWAITING_CONFIRMATION"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-rose-700 dark:text-rose-400"
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

        {/* Server-Verified Payment Success Modal */}
        {successReceipt && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#070D24]/70 backdrop-blur-xs p-4"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] p-7 shadow-2xl space-y-5">
              <button
                type="button"
                onClick={() => setSuccessReceipt(null)}
                aria-label="Close modal"
                className="absolute right-4 top-4 p-2 rounded-xl text-[var(--foreground-subtle)] hover:bg-[var(--surface-lavender)] hover:text-[var(--foreground)] transition"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2.5 pt-1">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={30} />
                </div>
                <h2
                  id="payment-success-title"
                  className="landing-display text-2xl font-extrabold text-[var(--foreground)]"
                >
                  Payment Successful
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Your transaction has been verified on the Learnova server and your subscription access is now live.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--foreground-subtle)]">Plan Name</span>
                  <span className="font-bold text-[var(--foreground)] text-right">
                    {successReceipt.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--foreground-subtle)]">Amount Paid</span>
                  <span className="font-extrabold text-[#4F46E5] dark:text-indigo-400 tabular-nums">
                    ₦{Number(successReceipt.amountNgn).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--foreground-subtle)]">Access Status</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {successReceipt.accessStatus.replace(/_/g, " ")}
                  </span>
                </div>
                {successReceipt.expiresAt && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--foreground-subtle)]">Valid Until</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {new Date(successReceipt.expiresAt).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessReceipt(null);
                    router.push("/dashboard");
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#4F46E5]/20 transition"
                >
                  Continue to Dashboard
                  <ArrowRight size={15} />
                </button>
                <Link
                  href="/live-classes"
                  onClick={() => setSuccessReceipt(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] px-4 py-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
                >
                  Open Live Classes
                </Link>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

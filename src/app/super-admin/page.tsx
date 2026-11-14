"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Settings,
  FileClock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowRight,
} from "lucide-react";

type TabId = "overview" | "schools" | "roles" | "plans" | "settings" | "audit";

export default function SuperAdminPage() {
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [data, setData] = useState<any>({
    schools: [],
    plans: [],
    settings: {},
    users: [],
    stats: {},
    auditLogs: [],
  });

  // Create School form
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolState, setSchoolState] = useState("Lagos");
  const [schoolAddress, setSchoolAddress] = useState("");

  // Create / Upsert Plan form
  const [planName, setPlanName] = useState("");
  const [planCycle, setPlanCycle] = useState<"MONTHLY" | "TERM" | "SESSION">("TERM");
  const [planPrice, setPlanPrice] = useState("15000");
  const [planDays, setPlanDays] = useState("90");
  const [planAllSubjects, setPlanAllSubjects] = useState(true);
  const [planDesc, setPlanDesc] = useState("");

  // Platform settings
  const [platformName, setPlatformName] = useState("Learnova Nigeria");
  const [defaultCap, setDefaultCap] = useState("50");
  const [allowTransfer, setAllowTransfer] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/super-admin", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      if (json.settings) {
        setPlatformName(json.settings.platformName || "Learnova Nigeria");
        setDefaultCap(String(json.settings.defaultRoomCapacity || 50));
        setAllowTransfer(Boolean(json.settings.allowManualBankTransfer));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const postAction = async (payload: Record<string, unknown>, okMessage: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed.");
      setFeedback({ type: "ok", text: okMessage });
      await loadData();
      return true;
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await postAction(
      {
        action: "CREATE_SCHOOL",
        name: schoolName,
        code: schoolCode,
        state: schoolState,
        address: schoolAddress,
      },
      "School registered successfully."
    );
    if (ok) {
      setSchoolName("");
      setSchoolCode("");
      setSchoolAddress("");
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await postAction(
      {
        action: "UPSERT_PLAN",
        name: planName,
        billingCycle: planCycle,
        priceNgn: Number(planPrice),
        durationDays: Number(planDays),
        allSubjectsIncluded: planAllSubjects,
        description: planDesc,
      },
      "Subscription plan saved."
    );
    if (ok) {
      setPlanName("");
      setPlanDesc("");
    }
  };

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="learnova-banner-dark bg-architectural-grid-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                <ShieldCheck size={14} />
                Platform Super Administration
              </div>
              <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                Learnova Global Console
              </h1>
              <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
                Manage schools, administrator accounts, Nigerian subscription plans (₦),
                payment gateways, default classroom capacities, and platform audit logs.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shrink-0 shadow-xs"
            >
              Open School Admin Hub
              <ArrowRight size={15} />
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

          {/* Tab Strip */}
          <div className="flex flex-wrap gap-2 border-b border-[#E4E1F5] pb-3">
            {[
              { id: "overview" as const, label: "Overview", icon: ShieldCheck },
              { id: "schools" as const, label: `Schools (${data.schools.length})`, icon: Building2 },
              { id: "roles" as const, label: `Accounts & Admins (${data.users.length})`, icon: Users },
              { id: "plans" as const, label: `Plans (${data.plans.length})`, icon: CreditCard },
              { id: "settings" as const, label: "Platform Settings", icon: Settings },
              { id: "audit" as const, label: `Audit Logs (${data.auditLogs.length})`, icon: FileClock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    tab === item.id
                      ? "bg-[#0B1230] text-white"
                      : "bg-white border border-[#E4E1F5] text-[#43466E] hover:border-[#4F46E5]"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="learnova-card p-10 text-center text-sm text-[#6B6F94]">
              Loading Super Admin telemetry...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Registered Schools",
                        value: data.stats.schoolsCount ?? 0,
                        sub: "Active institutions",
                      },
                      {
                        label: "Total Teachers",
                        value: data.stats.teachersCount ?? 0,
                        sub: "Verified & pending educators",
                      },
                      {
                        label: "Total Students",
                        value: data.stats.studentsCount ?? 0,
                        sub: `${data.stats.activePaidCount ?? 0} with active entitlement`,
                      },
                      {
                        label: "Verified Revenue",
                        value: `₦${Number(data.stats.totalRevenueNgn || 0).toLocaleString()}`,
                        sub: "Confirmed Paystack & transfers",
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="learnova-card p-5"
                      >
                        <p className="text-xs font-semibold text-[#6B6F94] uppercase tracking-wider">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-extrabold text-[#0B1230] mt-2 tabular-nums">
                          {kpi.value}
                        </p>
                        <p className="text-xs text-[#6B6F94] mt-1">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="learnova-card p-5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6F94]">
                          Paystack Payment Gateway
                        </p>
                        <p className="text-sm font-bold text-[#0B1230] mt-1">
                          {data.settings.paystackServerEnabled
                            ? "Server Verification Key Active (PAYSTACK_SECRET_KEY)"
                            : "Manual Bank Transfer Mode (Set PAYSTACK_SECRET_KEY to enable live card/USSD checkout)"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          data.settings.paystackServerEnabled
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {data.settings.paystackServerEnabled ? "Configured" : "Server Key Missing"}
                      </span>
                    </div>

                    <div className="learnova-card p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6F94]">
                          Live Classrooms Active Now
                        </p>
                        <p className="text-2xl font-extrabold text-[#0B1230] mt-1 tabular-nums flex items-center gap-2">
                          <Radio size={18} className="text-[#4F46E5]" />
                          {data.stats.liveClassroomsCount ?? 0}
                        </p>
                      </div>
                      <Link
                        href="/admin/classrooms"
                        className="text-xs font-bold text-[#4F46E5] hover:underline shrink-0"
                      >
                        Inspect Rooms →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* SCHOOLS */}
              {tab === "schools" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <form
                    onSubmit={handleCreateSchool}
                    className="learnova-card p-5 space-y-4 h-fit"
                  >
                    <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
                      <Plus size={16} className="text-[#4F46E5]" />
                      Register School
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        School Name
                      </label>
                      <input
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. King's College Digital Annex"
                        className="learnova-input text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#43466E] mb-1">
                          School Code
                        </label>
                        <input
                          required
                          value={schoolCode}
                          onChange={(e) => setSchoolCode(e.target.value)}
                          placeholder="KCL-002"
                          className="learnova-input text-sm uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#43466E] mb-1">
                          State
                        </label>
                        <input
                          value={schoolState}
                          onChange={(e) => setSchoolState(e.target.value)}
                          className="learnova-input text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Address
                      </label>
                      <input
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        placeholder="Street & city"
                        className="learnova-input text-sm"
                      />
                    </div>
                    <button
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-xs"
                    >
                      {saving ? "Saving..." : "Add School"}
                    </button>
                  </form>

                  <div className="lg:col-span-2 learnova-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
                      <h2 className="text-base font-bold text-[#0B1230]">Schools Directory</h2>
                    </div>
                    <div className="divide-y divide-[#E4E1F5]">
                      {data.schools.map((s: any) => (
                        <div
                          key={s.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-[#0B1230]">{s.name}</p>
                            <p className="text-xs text-[#6B6F94]">
                              Code: {s.code} · {s.state}, Nigeria · {s.timezone}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold ${
                                s.status === "ACTIVE"
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {s.status}
                            </span>
                            <button
                              disabled={saving}
                              onClick={() =>
                                postAction(
                                  { action: "TOGGLE_SCHOOL_STATUS", schoolId: s.id },
                                  `Updated ${s.name} status.`
                                )
                              }
                              className="px-3 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                            >
                              {s.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNTS & ROLES */}
              {tab === "roles" && (
                <div className="learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF] flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0B1230]">
                        User Accounts &amp; Role Provisioning
                      </h2>
                      <p className="text-xs text-[#6B6F94]">
                        Promote or reassign verified accounts to School Admin or Super Admin.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#FAF8FF] text-xs text-[#6B6F94] uppercase border-b border-[#E4E1F5]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Current Role</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Assign Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E1F5]">
                        {data.users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-[#FAF8FF]/70 transition">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0B1230]">{u.fullName}</p>
                              <p className="text-xs text-[#6B6F94]">{u.email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs text-[#4F46E5]">
                              {u.role}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#43466E]">{u.status}</td>
                            <td className="px-4 py-3 text-right">
                              <select
                                aria-label={`Role for ${u.email}`}
                                value={u.role}
                                disabled={saving}
                                onChange={(e) =>
                                  postAction(
                                    {
                                      action: "ASSIGN_ADMIN_ROLE",
                                      userId: u.id,
                                      role: e.target.value,
                                    },
                                    `Updated role for ${u.email} to ${e.target.value}.`
                                  )
                                }
                                className="learnova-input w-auto text-xs font-semibold py-1.5 px-2.5"
                              >
                                <option value="STUDENT">STUDENT</option>
                                <option value="TEACHER">TEACHER</option>
                                <option value="ADMIN">ADMIN (School Admin)</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTION PLANS */}
              {tab === "plans" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <form
                    onSubmit={handleCreatePlan}
                    className="learnova-card p-5 space-y-4 h-fit"
                  >
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Add Subscription Plan (₦)
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Plan Name
                      </label>
                      <input
                        required
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="e.g. SSS 3 WAEC Intensive Term"
                        className="learnova-input text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#43466E] mb-1">
                          Price (₦ NGN)
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          value={planPrice}
                          onChange={(e) => setPlanPrice(e.target.value)}
                          className="learnova-input text-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#43466E] mb-1">
                          Duration (Days)
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          value={planDays}
                          onChange={(e) => setPlanDays(e.target.value)}
                          className="learnova-input text-sm tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Billing Cycle
                      </label>
                      <select
                        value={planCycle}
                        onChange={(e) => setPlanCycle(e.target.value as any)}
                        className="learnova-input text-sm"
                      >
                        <option value="MONTHLY">MONTHLY</option>
                        <option value="TERM">TERM</option>
                        <option value="SESSION">SESSION</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#43466E]">
                      <input
                        type="checkbox"
                        checked={planAllSubjects}
                        onChange={(e) => setPlanAllSubjects(e.target.checked)}
                        className="accent-[#4F46E5]"
                      />
                      Includes all subjects in enrolled class level
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-[#43466E] mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={planDesc}
                        onChange={(e) => setPlanDesc(e.target.value)}
                        className="learnova-input text-sm"
                      />
                    </div>
                    <button
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold disabled:opacity-50 transition shadow-xs"
                    >
                      Save Plan
                    </button>
                  </form>

                  <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                    {data.plans.map((p: any) => (
                      <div
                        key={p.id}
                        className="learnova-card p-5 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#4F46E5] uppercase">
                              {p.billingCycle} · {p.durationDays} days
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                p.isActive
                                  ? "text-emerald-700"
                                  : "text-[#6B6F94]"
                              }`}
                            >
                              {p.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#0B1230] mt-2">{p.name}</h3>
                          <p className="text-2xl font-extrabold text-[#0B1230] mt-1 tabular-nums">
                            ₦{Number(p.priceNgn).toLocaleString()}
                          </p>
                          <p className="text-xs text-[#6B6F94] mt-2">{p.description}</p>
                        </div>
                        <button
                          disabled={saving}
                          onClick={() =>
                            postAction(
                              { action: "TOGGLE_PLAN", planId: p.id },
                              `Toggled ${p.name}.`
                            )
                          }
                          className="w-full py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                        >
                          {p.isActive ? "Deactivate Plan" : "Activate Plan"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {tab === "settings" && (
                <div className="learnova-card p-6 max-w-xl space-y-4">
                  <h2 className="text-base font-bold text-[#0B1230]">
                    Global Platform Configuration
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Platform Name
                    </label>
                    <input
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="learnova-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43466E] mb-1">
                      Default Classroom Max Capacity (Students per Teacher Group)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={defaultCap}
                      onChange={(e) => setDefaultCap(e.target.value)}
                      className="learnova-input text-sm tabular-nums"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#43466E]">
                    <input
                      type="checkbox"
                      checked={allowTransfer}
                      onChange={(e) => setAllowTransfer(e.target.checked)}
                      className="accent-[#4F46E5]"
                    />
                    Allow Student Manual Bank Transfer Verification Submissions
                  </label>
                  <button
                    disabled={saving}
                    onClick={() =>
                      postAction(
                        {
                          action: "UPDATE_SETTINGS",
                          platformName,
                          defaultRoomCapacity: Number(defaultCap),
                          allowManualBankTransfer: allowTransfer,
                        },
                        "Platform settings saved."
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shadow-xs"
                  >
                    Save Global Settings
                  </button>
                </div>
              )}

              {/* AUDIT LOGS */}
              {tab === "audit" && (
                <div className="learnova-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
                    <h2 className="text-base font-bold text-[#0B1230]">
                      Platform Audit Trail
                    </h2>
                  </div>
                  {data.auditLogs.length === 0 ? (
                    <div className="p-10 text-center text-sm text-[#6B6F94]">
                      No audit events recorded yet. Administrative actions will appear here.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E4E1F5]">
                      {data.auditLogs.map((log: any) => (
                        <div key={log.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-[#0B1230]">{log.action}</span>
                            <span className="text-[#6B6F94] ml-2">
                              by {log.actorEmail} ({log.actorRole})
                            </span>
                            {log.reason && (
                              <p className="text-[#43466E] mt-0.5">Reason: {log.reason}</p>
                            )}
                          </div>
                          <span className="text-[#6B6F94] tabular-nums">
                            {new Date(log.createdAt).toLocaleString("en-NG", {
                              timeZone: "Africa/Lagos",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

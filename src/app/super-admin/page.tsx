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
          <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                <ShieldCheck size={14} />
                Platform Super Administration
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Learnova Global Console
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Manage schools, administrator accounts, Nigerian subscription plans (₦),
                payment gateways, default classroom capacities, and platform audit logs.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold transition shrink-0"
            >
              Open School Admin Hub
              <ArrowRight size={15} />
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

          {/* Tab Strip */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
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
                      ? "bg-[#0B1F3A] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
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
                        className="bg-white border border-slate-200 rounded-2xl p-5"
                      >
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
                          {kpi.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Paystack Payment Gateway
                        </p>
                        <p className="text-sm font-bold text-[#0F1F38] mt-1">
                          {data.settings.paystackServerEnabled
                            ? "Server Verification Key Active (PAYSTACK_SECRET_KEY)"
                            : "Manual Bank Transfer Mode (Set PAYSTACK_SECRET_KEY to enable live card/USSD checkout)"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          data.settings.paystackServerEnabled
                            ? "bg-teal-50 text-[#0D9488]"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {data.settings.paystackServerEnabled ? "Configured" : "Server Key Missing"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Live Classrooms Active Now
                        </p>
                        <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums flex items-center gap-2">
                          <Radio size={18} className="text-[#0D9488]" />
                          {data.stats.liveClassroomsCount ?? 0}
                        </p>
                      </div>
                      <Link
                        href="/admin/classrooms"
                        className="text-xs font-semibold text-[#0D9488] hover:underline"
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
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit"
                  >
                    <h2 className="text-base font-bold text-[#0F1F38] flex items-center gap-2">
                      <Plus size={16} className="text-[#0D9488]" />
                      Register School
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        School Name
                      </label>
                      <input
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. King's College Digital Annex"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          School Code
                        </label>
                        <input
                          required
                          value={schoolCode}
                          onChange={(e) => setSchoolCode(e.target.value)}
                          placeholder="KCL-002"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          State
                        </label>
                        <input
                          value={schoolState}
                          onChange={(e) => setSchoolState(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Address
                      </label>
                      <input
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        placeholder="Street & city"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#132c52] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Add School"}
                    </button>
                  </form>

                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h2 className="text-base font-bold text-[#0F1F38]">Schools Directory</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {data.schools.map((s: any) => (
                        <div
                          key={s.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-[#0F1F38]">{s.name}</p>
                            <p className="text-xs text-slate-500">
                              Code: {s.code} · {s.state}, Nigeria · {s.timezone}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                s.status === "ACTIVE"
                                  ? "bg-teal-50 text-[#0D9488]"
                                  : "bg-red-50 text-red-700"
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
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
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
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#0F1F38]">
                        User Accounts & Role Provisioning
                      </h2>
                      <p className="text-xs text-slate-500">
                        Promote or reassign verified accounts to School Admin or Super Admin.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Current Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Assign Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.users.map((u: any) => (
                          <tr key={u.id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0F1F38]">{u.fullName}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs text-[#0B1F3A]">
                              {u.role}
                            </td>
                            <td className="px-4 py-3 text-xs">{u.status}</td>
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
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold bg-white"
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
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit"
                  >
                    <h2 className="text-base font-bold text-[#0F1F38]">
                      Add Subscription Plan (₦)
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Plan Name
                      </label>
                      <input
                        required
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="e.g. SSS 3 WAEC Intensive Term"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Price (₦ NGN)
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          value={planPrice}
                          onChange={(e) => setPlanPrice(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Duration (Days)
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          value={planDays}
                          onChange={(e) => setPlanDays(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Billing Cycle
                      </label>
                      <select
                        value={planCycle}
                        onChange={(e) => setPlanCycle(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="MONTHLY">MONTHLY</option>
                        <option value="TERM">TERM</option>
                        <option value="SESSION">SESSION</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planAllSubjects}
                        onChange={(e) => setPlanAllSubjects(e.target.checked)}
                      />
                      Includes all subjects in enrolled class level
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={planDesc}
                        onChange={(e) => setPlanDesc(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                    >
                      Save Plan
                    </button>
                  </form>

                  <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                    {data.plans.map((p: any) => (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#0D9488] uppercase">
                              {p.billingCycle} · {p.durationDays} days
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                p.isActive
                                  ? "bg-teal-50 text-[#0D9488]"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {p.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#0B1F3A] mt-2">{p.name}</h3>
                          <p className="text-2xl font-extrabold text-[#0F1F38] mt-1 tabular-nums">
                            ₦{Number(p.priceNgn).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">{p.description}</p>
                        </div>
                        <button
                          disabled={saving}
                          onClick={() =>
                            postAction(
                              { action: "TOGGLE_PLAN", planId: p.id },
                              `Toggled ${p.name}.`
                            )
                          }
                          className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl space-y-4">
                  <h2 className="text-base font-bold text-[#0F1F38]">
                    Global Platform Configuration
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Platform Name
                    </label>
                    <input
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Default Classroom Max Capacity (Students per Teacher Group)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={defaultCap}
                      onChange={(e) => setDefaultCap(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowTransfer}
                      onChange={(e) => setAllowTransfer(e.target.checked)}
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
                    className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#132c52]"
                  >
                    Save Global Settings
                  </button>
                </div>
              )}

              {/* AUDIT LOGS */}
              {tab === "audit" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-[#0F1F38]">
                      Platform Audit Trail
                    </h2>
                  </div>
                  {data.auditLogs.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No audit events recorded yet. Administrative actions will appear here.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.auditLogs.map((log: any) => (
                        <div key={log.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-[#0B1F3A]">{log.action}</span>
                            <span className="text-slate-500 ml-2">
                              by {log.actorEmail} ({log.actorRole})
                            </span>
                            {log.reason && (
                              <p className="text-slate-600 mt-0.5">Reason: {log.reason}</p>
                            )}
                          </div>
                          <span className="text-slate-400 tabular-nums">
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

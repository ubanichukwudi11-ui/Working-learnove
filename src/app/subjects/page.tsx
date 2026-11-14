"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { BookOpen, Search, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function SubjectsPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [enrolment, setEnrolment] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [nowMs, setNowMs] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [acadRes, subRes] = await Promise.all([
        fetch("/api/lms/academics", { cache: "no-store" }),
        fetch("/api/lms/subscriptions", { cache: "no-store" }),
      ]);
      const acadJson = acadRes.ok ? await acadRes.json() : {};
      const subJson = subRes.ok ? await subRes.json() : {};

      setSubjects(acadJson.subjects || []);
      setClassLevels(acadJson.classLevels || []);
      setEnrolment(subJson.enrolment || null);
      setEntitlement(subJson.entitlement || null);
      setNowMs(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const studentLevelId = entitlement?.classLevelId || enrolment?.classLevelId || "";
  const studentLevelName =
    classLevels.find((c) => c.id === studentLevelId)?.code || "All Levels";

  const hasActiveSub =
    entitlement &&
    (entitlement.accessStatus === "ACTIVE_PAID" ||
      entitlement.accessStatus === "SCHOLARSHIP_GRANTED") &&
    (!entitlement.expiresAt || !nowMs || new Date(entitlement.expiresAt).getTime() > nowMs);

  const isSubjectEntitled = (subId: string) => {
    if (!hasActiveSub) return false;
    if (entitlement.allSubjects) return true;
    return (entitlement.subjectIds || []).includes(subId);
  };

  const filtered = subjects.filter((s) => {
    const matchesLevel = !studentLevelId || (s.classLevelIds || []).includes(studentLevelId);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q);
    return matchesLevel && matchesQuery;
  });

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                {studentLevelName} · Nigerian Curriculum Registry
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                Subjects &amp; Entitlement Access
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                View subjects configured for your class level and check which courses are
                unlocked under your current subscription plan.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 w-full md:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter subjects..."
                className="bg-transparent outline-none text-sm text-[#0F1F38] w-full"
              />
            </div>
          </div>

          {!hasActiveSub && !loading && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">
                  No Active Paid Subscription or Scholarship Yet
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Select your class level and activate a plan to unlock live classrooms and
                  subject modules.
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold shrink-0"
              >
                Choose Plan (₦)
              </Link>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading subjects...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-sm text-slate-500">
              No subjects match your class level or filter criteria.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((subject) => {
                const unlocked = isSubjectEntitled(subject.id);
                return (
                  <div
                    key={subject.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4 hover:border-[#0D9488] transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#0D9488]">
                          {subject.code} · {subject.department}
                        </span>
                        {unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[#0D9488]">
                            <CheckCircle2 size={13} /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <Lock size={13} /> Locked
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                        <BookOpen size={18} className="text-[#0B1F3A]" />
                        {subject.name}
                      </h2>

                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {subject.description}
                      </p>
                    </div>

                    {unlocked ? (
                      <Link
                        href="/timetable"
                        className="w-full py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                      >
                        View Scheduled Classrooms
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        href="/subscriptions"
                        className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-amber-100 transition"
                      >
                        <Lock size={13} />
                        Activate Plan to Unlock
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
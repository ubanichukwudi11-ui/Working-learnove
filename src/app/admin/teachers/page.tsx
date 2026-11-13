"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { getAllUsers, User } from "@/lib/auth";
import { ArrowRight, Search } from "lucide-react";

const FALLBACK_TEACHERS: User[] = [
  {
    id: "teacher-funke",
    email: "funke.adewale@learnova.ng",
    fullName: "Mrs. Funke Adewale",
    role: "TEACHER",
    status: "ACTIVE",
    subject: "Mathematics",
    qualification: "M.Ed Mathematics",
  },
  {
    id: "teacher-chinedu",
    email: "chinedu.emeka@learnova.ng",
    fullName: "Mr. Chinedu Emeka",
    role: "TEACHER",
    status: "PENDING",
    subject: "Physics",
    qualification: "B.Sc Physics Ed.",
  },
  {
    id: "teacher-ibrahim",
    email: "ibrahim.bello@learnova.ng",
    fullName: "Dr. Ibrahim Bello",
    role: "TEACHER",
    status: "ACTIVE",
    subject: "Chemistry",
    qualification: "Ph.D Chemistry",
  },
];

export default function AdminTeachersPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <TeachersDirectory />
    </ProtectedRoute>
  );
}

function TeachersDirectory() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "REJECTED">("ALL");

  useEffect(() => {
    async function loadTeachers() {
      try {
        const users = await getAllUsers();
        const remoteTeachers = users.filter((user) => user.role === "TEACHER");
        setTeachers(remoteTeachers.length > 0 ? remoteTeachers : FALLBACK_TEACHERS);
      } catch {
        setTeachers(FALLBACK_TEACHERS);
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  const pendingCount = teachers.filter((t) => t.status === "PENDING").length;
  const activeCount = teachers.filter((t) => t.status === "ACTIVE").length;
  const rejectedCount = teachers.filter((t) => t.status === "REJECTED").length;

  const filtered = teachers.filter((t) => {
    const matchesQuery =
      t.fullName.toLowerCase().includes(query.toLowerCase()) ||
      t.email.toLowerCase().includes(query.toLowerCase()) ||
      (t.subject || "").toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "ALL" || t.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Faculty · Educator Verification
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
            Teacher Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review teacher applications, academic qualifications, and TRCN credentials.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Pending Review</p>
            <p className="text-3xl font-extrabold text-[#D97706] mt-2 tabular-nums">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Approved Educators</p>
            <p className="text-3xl font-extrabold text-[#0D9488] mt-2 tabular-nums">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Rejected Applications</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-2 tabular-nums">
              {rejectedCount}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search educator or subject..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs text-[#0B1F3A] focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200">
            {(["ALL", "PENDING", "ACTIVE", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filter === tab
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading teacher applications...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F7F8FA] text-xs font-bold text-slate-600">
                  <th className="p-4">Teacher</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-[#0B1F3A]">{teacher.fullName}</td>
                    <td className="p-4 text-xs text-slate-600">{teacher.email}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700">
                      {teacher.subject || "General"}
                    </td>
                    <td className="p-4 text-xs font-bold">
                      <span
                        className={
                          teacher.status === "ACTIVE"
                            ? "text-emerald-700"
                            : teacher.status === "REJECTED"
                            ? "text-rose-700"
                            : "text-amber-700"
                        }
                      >
                        {teacher.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition whitespace-nowrap"
                      >
                        Review Packet
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No teacher applications match the selected filter.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { Search, UserCheck, UserX, X } from "lucide-react";

interface StudentRecord {
  id: number;
  name: string;
  email: string;
  classLevel: string;
  attendance: string;
  status: "ACTIVE" | "SUSPENDED";
}

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 1,
    name: "Chukwudi Ubani",
    email: "chukwudi.ubani@learnova.ng",
    classLevel: "SSS 2 Science",
    attendance: "96%",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Amina Yusuf",
    email: "amina.yusuf@learnova.ng",
    classLevel: "SSS 2 Science",
    attendance: "98%",
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Toluwani Adeyemi",
    email: "toluwani.a@learnova.ng",
    classLevel: "SSS 1 Science",
    attendance: "89%",
    status: "ACTIVE",
  },
  {
    id: 4,
    name: "Grace Emmanuel",
    email: "grace.emmanuel@learnova.ng",
    classLevel: "SSS 1 Arts",
    attendance: "74%",
    status: "SUSPENDED",
  },
  {
    id: 5,
    name: "Zainab Musa",
    email: "zainab.musa@learnova.ng",
    classLevel: "SSS 3 Intensive",
    attendance: "95%",
    status: "ACTIVE",
  },
];

export default function AdminStudentsPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <StudentsDirectory />
    </ProtectedRoute>
  );
}

function StudentsDirectory() {
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const toggleStatus = (id: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
          : s
      )
    );
  };

  const filtered = students.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.classLevel.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const suspendedCount = students.filter((s) => s.status === "SUSPENDED").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Registry · Student Cohorts
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
            Student Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search enrolled students, inspect attendance records, and update account access.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Roster Sample</p>
            <p className="text-3xl font-extrabold text-[#0B1F3A] mt-2 tabular-nums">
              {students.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Active Accounts</p>
            <p className="text-3xl font-extrabold text-[#0D9488] mt-2 tabular-nums">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Suspended Accounts</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-2 tabular-nums">
              {suspendedCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student, email or class..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs text-[#0B1F3A] focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === tab
                    ? "bg-[#0B1F3A] text-white"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "ACTIVE" ? "Active" : "Suspended"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F7F8FA] text-xs font-bold text-slate-600">
                <th className="p-4">Student Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Class Level</th>
                <th className="p-4">Attendance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-[#0B1F3A]">{student.name}</td>
                  <td className="p-4 text-xs text-slate-600">{student.email}</td>
                  <td className="p-4 text-xs font-semibold text-slate-700">
                    {student.classLevel}
                  </td>
                  <td className="p-4 text-xs font-bold text-[#0B1F3A] tabular-nums">
                    {student.attendance}
                  </td>
                  <td className="p-4 text-xs font-bold">
                    <span
                      className={
                        student.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
                      }
                    >
                      {student.status === "ACTIVE" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#0B1F3A] whitespace-nowrap"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => toggleStatus(student.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          student.status === "ACTIVE"
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {student.status === "ACTIVE" ? (
                          <>
                            <UserX size={13} />
                            Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No students match your current search filter.
            </div>
          )}
        </div>

        {/* Inspect Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0D9488]">Student Dossier</p>
                  <h3 className="text-lg font-extrabold text-[#0B1F3A] mt-0.5">
                    {selectedStudent.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-4">
                <p><strong className="text-[#0B1F3A]">Email:</strong> {selectedStudent.email}</p>
                <p><strong className="text-[#0B1F3A]">Class:</strong> {selectedStudent.classLevel}</p>
                <p><strong className="text-[#0B1F3A]">Attendance Rate:</strong> {selectedStudent.attendance}</p>
                <p><strong className="text-[#0B1F3A]">Account Status:</strong> {selectedStudent.status}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
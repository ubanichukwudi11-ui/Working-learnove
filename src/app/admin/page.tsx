"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const pendingTeachers = [
    {
      id: 1,
      name: "Mr. James",
      subject: "Physics",
      status: "Pending",
    },
    {
      id: 2,
      name: "Mrs. Sarah",
      subject: "Mathematics",
      status: "Pending",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            Admin Dashboard
          </h1>

          <p className="text-slate-400 mt-2">
            Manage Learnova platform operations.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <Users className="text-cyan-400" />
              <span className="text-slate-500 text-sm">
                Students
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-4">
              2,451
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <GraduationCap className="text-purple-400" />
              <span className="text-slate-500 text-sm">
                Teachers
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-4">
              56
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <BookOpen className="text-green-400" />
              <span className="text-slate-500 text-sm">
                Subjects
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-4">
              18
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <CalendarDays className="text-orange-400" />
              <span className="text-slate-500 text-sm">
                Classes Today
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-4">
              12
            </h2>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 transition text-left">
              <Plus className="mb-3 text-purple-400" />

              <p className="font-medium">
                Create Timetable
              </p>
            </button>

            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition text-left">
              <Users className="mb-3 text-cyan-400" />

              <p className="font-medium">
                Manage Students
              </p>
            </button>

            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-green-500 transition text-left">
              <GraduationCap className="mb-3 text-green-400" />

              <p className="font-medium">
                Manage Teachers
              </p>
            </button>

            <button className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500 transition text-left">
              <BookOpen className="mb-3 text-orange-400" />

              <p className="font-medium">
                Manage Subjects
              </p>
            </button>
          </div>
        </div>

        {/* Pending Teachers */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Pending Teacher Approvals
            </h2>

            <span className="text-sm text-slate-400">
              {pendingTeachers.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="
                flex
                items-center
                justify-between
                p-4
                rounded-2xl
                bg-slate-900
                border
                border-slate-800
                "
              >
                <div>
                  <h3 className="font-medium">
                    {teacher.name}
                  </h3>

                  <p className="text-slate-400 text-sm">
                    {teacher.subject}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="
                    px-4
                    py-2
                    rounded-xl
                    bg-green-600
                    hover:bg-green-500
                    flex
                    items-center
                    gap-2
                    "
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    className="
                    px-4
                    py-2
                    rounded-xl
                    bg-red-600
                    hover:bg-red-500
                    flex
                    items-center
                    gap-2
                    "
                  >
                    <AlertCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-5">
            Recent Activity
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className="text-cyan-400"
              />

              <p className="text-slate-300">
                New teacher application submitted.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className="text-purple-400"
              />

              <p className="text-slate-300">
                Science timetable updated.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className="text-green-400"
              />

              <p className="text-slate-300">
                3 live classes started today.
              </p>
            </div>
          </div>
        </div>
      </div>
        </AppLayout>
      );
    }
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import { getAllUsers, User } from "@/lib/auth";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const users = await getAllUsers();

        setTeachers(
          users.filter((user) => user.role === "TEACHER")
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, []);

  const pendingTeachers = teachers.filter(
    (teacher) => teacher.status === "PENDING"
  );

  const approvedTeachers = teachers.filter(
    (teacher) => teacher.status === "ACTIVE"
  );

  const rejectedTeachers = teachers.filter(
    (teacher) => teacher.status === "REJECTED"
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Teacher Management
          </h1>

          <p className="text-slate-400 mt-2">
            Review teacher applications,
            certificates and documents before
            approval.
          </p>
        </div>

        {/* Stats */}

        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Pending Teachers
            </p>

            <h2 className="text-4xl font-bold mt-2 text-yellow-400">
              {pendingTeachers.length}
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Approved Teachers
            </p>

            <h2 className="text-4xl font-bold mt-2 text-green-400">
              {approvedTeachers.length}
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Rejected Teachers
            </p>

            <h2 className="text-4xl font-bold mt-2 text-red-400">
              {rejectedTeachers.length}
            </h2>
          </div>

        </div>

        {/* Table */}

        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Loading teachers...
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-4">
                      Teacher
                    </th>

                    <th className="text-left p-4">
                      Email
                    </th>

                    <th className="text-left p-4">
                      Subject
                    </th>

                    <th className="text-left p-4">
                      Status
                    </th>

                    <th className="text-left p-4">
                      Review
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {teachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="border-b border-slate-800"
                    >
                      <td className="p-4">
                        {teacher.fullName}
                      </td>

                      <td className="p-4 text-slate-400">
                        {teacher.email}
                      </td>

                      <td className="p-4">
                        {teacher.subject ||
                          "Not Provided"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            teacher.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400"
                              : teacher.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/admin/teachers/${teacher.id}`}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm"
                        >
                          Review Application
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {teachers.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No teacher applications found.
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </AppLayout>
  );
}
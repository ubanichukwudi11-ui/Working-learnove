"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";

import {
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Video,
  FileText,
  Sparkles,
  Bell,
} from "lucide-react";


export default function TeacherDashboard() {
  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <TeacherContent />
    </ProtectedRoute>
  );
}

function TeacherContent() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Classes Today",
      value: "4",
      icon: BookOpen,
    },
    {
      title: "Students",
      value: "128",
      icon: Users,
    },
    {
      title: "Assignments",
      value: "23",
      icon: ClipboardList,
    },
    {
      title: "Attendance",
      value: "94%",
      icon: CalendarCheck,
    },
  ];

  const schedule = [
    {
      subject: "Physics",
      time: "09:00 AM",
    },
    {
      subject: "Chemistry",
      time: "11:00 AM",
    },
    {
      subject: "Biology",
      time: "03:00 PM",
    },
  ];

  const activities = [
    "Assignment uploaded successfully",
    "15 students submitted Physics test",
    "New student joined your class",
    "Attendance marked for Chemistry",
  ];

  return (
    <ProtectedRoute roles={["TEACHER"]}>
      <AppLayout>
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">
              Welcome {user?.fullName} 👋
            </h1>

            <p className="text-slate-400 mt-2">
              Manage your classes, assignments and students.
            </p>
          </div>

          {/* NOVA AI */}

          <div
            className="
            mb-8
            rounded-2xl
            p-6
            bg-gradient-to-r
            from-green-600
            to-emerald-500
            "
          >
            <div className="flex items-center gap-3">
              <Sparkles />

              <h2 className="text-xl font-bold">
                Nova Teacher Assistant
              </h2>
            </div>

            <p className="mt-3 opacity-90">
              AI can generate lesson notes,
              assignments, quizzes and study plans.
            </p>

            <button
              className="
              mt-4
              px-5
              py-3
              rounded-xl
              bg-black/20
              hover:bg-black/30
              transition
              "
            >
              Open Nova AI
            </button>
          </div>

          {/* STATS */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="
                  bg-[#111827]
                  border
                  border-slate-800
                  rounded-2xl
                  p-5
                  "
                >
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-sm">
                      {stat.title}
                    </p>

                    <Icon
                      size={22}
                      className="text-green-400"
                    />
                  </div>

                  <h2 className="text-3xl font-bold mt-4">
                    {stat.value}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* QUICK ACTIONS */}

          <div
            className="
            bg-[#111827]
            border
            border-slate-800
            rounded-2xl
            p-6
            mb-8
            "
          >
            <h2 className="text-xl font-semibold mb-5">
              Quick Actions
            </h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

              <button
                className="
                p-4
                rounded-xl
                bg-green-600
                hover:bg-green-500
                transition
                "
              >
                <Video className="mx-auto mb-2" />
                Start Live Class
              </button>

              <button
                className="
                p-4
                rounded-xl
                bg-indigo-600
                hover:bg-indigo-500
                transition
                "
              >
                <FileText className="mx-auto mb-2" />
                Upload Notes
              </button>

              <button
                className="
                p-4
                rounded-xl
                bg-purple-600
                hover:bg-purple-500
                transition
                "
              >
                <ClipboardList className="mx-auto mb-2" />
                Create Assignment
              </button>

              <button
                className="
                p-4
                rounded-xl
                bg-cyan-600
                hover:bg-cyan-500
                transition
                "
              >
                <CalendarCheck className="mx-auto mb-2" />
                Attendance
              </button>

            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* SCHEDULE */}

            <div
              className="
              bg-[#111827]
              border
              border-slate-800
              rounded-2xl
              p-6
              "
            >
              <h2 className="text-xl font-semibold mb-5">
                Today's Schedule
              </h2>

              <div className="space-y-4">
                {schedule.map((item) => (
                  <div
                    key={item.subject}
                    className="
                    flex
                    justify-between
                    items-center
                    p-4
                    rounded-xl
                    bg-slate-900
                    "
                  >
                    <div>
                      <h3 className="font-semibold">
                        {item.subject}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        Live Class
                      </p>
                    </div>

                    <span className="text-green-400">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIVITIES */}

            <div
              className="
              bg-[#111827]
              border
              border-slate-800
              rounded-2xl
              p-6
              "
            >
              <h2 className="text-xl font-semibold mb-5">
                Recent Activities
              </h2>

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity}
                    className="
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-xl
                    bg-slate-900
                    "
                  >
                    <Bell
                      size={18}
                      className="text-green-400"
                    />

                    <span>{activity}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
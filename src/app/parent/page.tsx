import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import {
  CalendarCheck,
  ClipboardList,
  Trophy,
  Video,
  User,
  BookOpen,
} from "lucide-react";

export default function ParentDashboard() {
  return (
    <ProtectedRoute roles={["PARENT"]}>
      <ParentContent />
    </ProtectedRoute>
  );
}

function ParentContent() {
  const stats = [
    {
      title: "Attendance",
      value: "96%",
      icon: CalendarCheck,
    },
    {
      title: "Assignments Due",
      value: "3",
      icon: ClipboardList,
    },
    {
      title: "Average Score",
      value: "84%",
      icon: Trophy,
    },
    {
      title: "Live Classes",
      value: "8",
      icon: Video,
    },
  ];

  const activities = [
    "Joined Physics Live Class",
    "Submitted Mathematics Assignment",
    "Scored 82% in Chemistry Test",
    "Saved Biology Notes",
  ];

  const upcomingClasses = [
    {
      subject: "Physics",
      time: "Tomorrow • 9:00 AM",
    },
    {
      subject: "Chemistry",
      time: "Tomorrow • 11:00 AM",
    },
    {
      subject: "Biology",
      time: "Friday • 3:00 PM",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Parent Dashboard
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor your child's academic progress,
            attendance and upcoming classes.
          </p>
        </div>

        {/* Child Overview */}

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
          <div className="flex items-center gap-4">
            <div
              className="
              w-14
              h-14
              rounded-full
              bg-purple-600
              flex
              items-center
              justify-center
              "
            >
              <User size={24} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Chukwudi Ubani
              </h2>

              <p className="text-slate-400">
                SS1 Science Student
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}

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
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-sm">
                    {stat.title}
                  </p>

                  <Icon
                    size={20}
                    className="text-cyan-400"
                  />
                </div>

                <h2 className="text-3xl font-bold mt-4">
                  {stat.value}
                </h2>
              </div>
            );
          })}
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          {/* Recent Activity */}

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
              Recent Activity
            </h2>

            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity}
                  className="
                  p-4
                  rounded-xl
                  bg-slate-900
                  "
                >
                  {activity}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Classes */}

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
              Upcoming Classes
            </h2>

            <div className="space-y-4">
              {upcomingClasses.map((item) => (
                <div
                  key={item.subject}
                  className="
                  flex
                  items-center
                  justify-between
                  p-4
                  rounded-xl
                  bg-slate-900
                  "
                >
                  <div className="flex items-center gap-3">
                    <BookOpen
                      size={18}
                      className="text-cyan-400"
                    />

                    <span>
                      {item.subject}
                    </span>
                  </div>

                  <span className="text-slate-400 text-sm">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
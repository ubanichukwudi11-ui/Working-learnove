"use client";

const activities = [
  {
    id: 1,
    title: "Completed Mathematics Quiz",
    time: "10 mins ago",
  },
  {
    id: 2,
    title: "Studied Physics - Motion",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Asked Nova about Chemistry",
    time: "3 hours ago",
  },
  {
    id: 4,
    title: "Finished English Practice",
    time: "Yesterday",
  },
];

export default function RecentActivity() {
  return (
    <div
      className="
        bg-[#111827]
        border border-slate-800
        rounded-2xl
        p-5
      "
    >
      <h3 className="text-white font-semibold mb-4">
        Recent Activity
      </h3>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="
              flex items-start gap-3
              border-b border-slate-800
              pb-3
            "
          >
            <div
              className="
                w-2 h-2
                rounded-full
                bg-[#10B981]
                mt-2
              "
            />

            <div>
              <p className="text-white text-sm">
                {activity.title}
              </p>

              <p className="text-slate-400 text-xs">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
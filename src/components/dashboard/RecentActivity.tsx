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
    <div className="learnova-card p-5">
      <h3 className="text-[#0B1230] font-bold text-base mb-4">
        Recent Activity
      </h3>

      <div className="divide-y divide-[#E4E1F5]">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[#0B1230] font-medium text-sm">
                {activity.title}
              </p>
              <p className="text-[#6B6F94] text-xs mt-0.5">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
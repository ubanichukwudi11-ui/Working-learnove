"use client";

const students = [
  {
    name: "David",
    xp: 2450,
  },
  {
    name: "Grace",
    xp: 2210,
  },
  {
    name: "John",
    xp: 1980,
  },
  {
    name: "You",
    xp: 1250,
  },
];

export default function Leaderboard() {
  return (
    <div className="learnova-card p-5">
      <h3 className="text-[#0B1230] font-bold text-base mb-4">
        Leaderboard
      </h3>

      <div className="space-y-3">
        {students.map((student, index) => (
          <div
            key={student.name}
            className="flex justify-between items-center py-1.5"
          >
            <div className="flex gap-3 items-center">
              <span className="text-[#6D28D9] font-bold tabular-nums text-sm">
                #{index + 1}
              </span>

              <span className="text-[#0B1230] font-medium text-sm">
                {student.name}
              </span>
            </div>

            <span className="text-[#0891B2] font-bold text-sm tabular-nums">
              {student.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
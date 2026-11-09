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
    <div
      className="
        bg-[#111827]
        border border-slate-800
        rounded-2xl
        p-5
      "
    >
      <h3 className="text-white font-semibold mb-4">
        Leaderboard
      </h3>

      <div className="space-y-3">
        {students.map((student, index) => (
          <div
            key={student.name}
            className="
              flex justify-between
              items-center
            "
          >
            <div className="flex gap-3 items-center">
              <span className="text-purple-400">
                #{index + 1}
              </span>

              <span className="text-white">
                {student.name}
              </span>
            </div>

            <span className="text-cyan-400">
              {student.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
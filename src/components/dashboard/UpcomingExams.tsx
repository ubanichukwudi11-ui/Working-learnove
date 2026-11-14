"use client";

const exams = [
  {
    subject: "Mathematics",
    date: "15 Aug",
  },
  {
    subject: "Physics",
    date: "18 Aug",
  },
  {
    subject: "English",
    date: "22 Aug",
  },
];

export default function UpcomingExams() {
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
        Upcoming Exams
      </h3>

      <div className="space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.subject}
            className="
              flex justify-between
              items-center
              p-3
              rounded-xl
              bg-slate-900
            "
          >
            <span className="text-white">
              {exam.subject}
            </span>

            <span className="text-cyan-400 text-sm">
              {exam.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
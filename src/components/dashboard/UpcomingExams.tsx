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
    <div className="learnova-card p-5">
      <h3 className="text-[#0B1230] font-bold text-base mb-4">
        Upcoming Exams
      </h3>

      <div className="space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.subject}
            className="flex justify-between items-center p-3 rounded-xl bg-[#FAF8FF] border border-[#E4E1F5]"
          >
            <span className="text-[#0B1230] font-medium text-sm">
              {exam.subject}
            </span>

            <span className="text-[#4F46E5] font-semibold text-sm tabular-nums">
              {exam.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
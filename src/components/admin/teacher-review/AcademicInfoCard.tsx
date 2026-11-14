"use client";

import { TeacherReviewProps } from "./types";

export default function AcademicInfoCard({ teacher }: TeacherReviewProps) {
  const fields = [
    { label: "Teaching Subject", value: teacher.subject },
    { label: "Highest Qualification", value: teacher.qualification },
    { label: "Awarding Institution", value: teacher.institution },
    { label: "Teaching Experience", value: teacher.experience },
    { label: "TRCN / License No.", value: teacher.licenseNumber },
    { label: "Application Status", value: teacher.status },
  ];

  return (
    <div className="learnova-card p-6 space-y-4">
      <div>
        <h2 className="landing-display text-lg font-bold text-[#0D1438]">
          Academic &amp; Licensing Credentials
        </h2>
        <p className="text-xs text-[#6B6F94] mt-0.5">
          Subject specialization and TRCN status.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.label} className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-3.5">
            <p className="text-[11px] font-semibold text-[#6B6F94]">{f.label}</p>
            <p className="text-sm font-bold text-[#0D1438] mt-1 break-words">
              {f.value || "Not Provided"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
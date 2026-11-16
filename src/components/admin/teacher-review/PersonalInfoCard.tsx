"use client";

import { TeacherReviewProps } from "./types";

export default function PersonalInfoCard({ teacher }: TeacherReviewProps) {
  const fields = [
    { label: "Full Name", value: teacher.fullName },
    { label: "Email Address", value: teacher.email },
    { label: "Phone Number", value: teacher.phone },
    { label: "Gender", value: teacher.gender },
    { label: "Country", value: teacher.country },
    { label: "State", value: teacher.state },
    { label: "Address", value: teacher.address },
    { label: "Status", value: teacher.status },
  ];

  return (
    <div className="learnova-card p-6 space-y-4">
      <div>
        <h2 className="landing-display text-lg font-bold text-[#0D1438]">
          Personal Information
        </h2>
        <p className="text-xs text-[#6B6F94] mt-0.5">
          Applicant profile and contact details.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
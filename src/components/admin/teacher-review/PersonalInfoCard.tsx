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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0B1F3A]">Personal Information</h2>
        <p className="text-xs text-slate-600 mt-0.5">Applicant profile and contact details.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {fields.map((f) => (
          <div key={f.label} className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3.5">
            <p className="text-[11px] font-semibold text-slate-500">{f.label}</p>
            <p className="text-sm font-bold text-[#0B1F3A] mt-1 break-words">
              {f.value || "Not Provided"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
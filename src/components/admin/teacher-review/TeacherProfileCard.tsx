"use client";

import { TeacherReviewProps } from "./types";

export default function TeacherProfileCard({ teacher }: TeacherReviewProps) {
  const completion = calculateCompletion(teacher);

  return (
    <div className="learnova-card overflow-hidden">
      <div className="h-24 bg-[#070D24] bg-architectural-grid-dark relative" />

      <div className="px-6 pb-6 -mt-12 relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            {teacher.profilePhoto ? (
              <img
                src={teacher.profilePhoto}
                alt={teacher.fullName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-sm bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-4 border-white flex items-center justify-center text-3xl font-extrabold text-white shadow-sm">
                {teacher.fullName?.charAt(0) || "T"}
              </div>
            )}

            <div className="pt-8">
              <h2 className="landing-display text-2xl font-bold text-[#0D1438]">
                {teacher.fullName}
              </h2>
              <p className="text-xs text-[#6B6F94] mt-1">
                {teacher.email} · {teacher.subject || "General"} ·{" "}
                {teacher.qualification || "Educator"} ·{" "}
                <span className="font-bold text-[#4F46E5]">{teacher.status}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 w-full lg:w-80 space-y-3">
            <div className="flex justify-between text-xs font-bold text-[#0D1438] tabular-nums">
              <span>Dossier Completeness</span>
              <span>{completion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E4E1F5] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <p className="text-[#6B6F94]">Experience</p>
                <p className="font-bold text-[#0D1438]">{teacher.experience || "N/A"}</p>
              </div>
              <div>
                <p className="text-[#6B6F94]">Institution</p>
                <p className="font-bold text-[#0D1438] truncate">{teacher.institution || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateCompletion(anyTeacher: any) {
  let total = 0;
  let completed = 0;
  const fields = [
    anyTeacher.phone,
    anyTeacher.country,
    anyTeacher.state,
    anyTeacher.subject,
    anyTeacher.qualification,
    anyTeacher.institution,
    anyTeacher.experience,
    anyTeacher.licenseNumber,
    anyTeacher.profilePhoto,
    anyTeacher.certificate,
  ];
  fields.forEach((field) => {
    total++;
    if (field) completed++;
  });
  return Math.round((completed / total) * 100);
}
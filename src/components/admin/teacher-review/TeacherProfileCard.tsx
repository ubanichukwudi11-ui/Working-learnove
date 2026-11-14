"use client";

import { TeacherReviewProps } from "./types";

export default function TeacherProfileCard({ teacher }: TeacherReviewProps) {
  const completion = calculateCompletion(teacher);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="h-24 bg-[#0B1F3A]" />

      <div className="px-6 pb-6 -mt-12">
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
              <div className="w-24 h-24 rounded-2xl bg-[#0D9488] border-4 border-white flex items-center justify-center text-3xl font-extrabold text-white shadow-sm">
                {teacher.fullName?.charAt(0) || "T"}
              </div>
            )}

            <div className="pt-8">
              <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
                {teacher.fullName}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {teacher.email} · {teacher.subject || "General"} · {teacher.qualification || "Educator"} ·{" "}
                <span className="font-bold text-[#0D9488]">{teacher.status}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 w-full lg:w-80 space-y-3">
            <div className="flex justify-between text-xs font-bold text-[#0B1F3A] tabular-nums">
              <span>Dossier Completeness</span>
              <span>{completion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#0D9488] transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <p className="text-slate-500">Experience</p>
                <p className="font-bold text-[#0B1F3A]">{teacher.experience || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500">Institution</p>
                <p className="font-bold text-[#0B1F3A] truncate">{teacher.institution || "N/A"}</p>
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
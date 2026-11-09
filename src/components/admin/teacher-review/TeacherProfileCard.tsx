"use client";

import { TeacherReviewProps } from "./types";

export default function TeacherProfileCard({
  teacher,
}: TeacherReviewProps) {
  const completion = calculateCompletion(teacher);

  return (
    <div
      className="
      bg-gradient-to-br
      from-slate-900
      via-slate-900
      to-slate-800
      border
      border-slate-700
      rounded-3xl
      overflow-hidden
      shadow-xl
      "
    >
      {/* Header */}

      <div
        className="
        h-32
        bg-gradient-to-r
        from-cyan-600
        via-blue-600
        to-purple-600
        "
      />

      <div className="px-8 pb-8 -mt-16">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

          <div className="flex items-center gap-6">

            {teacher.profilePhoto ? (
              <img
                src={teacher.profilePhoto}
                alt={teacher.fullName}
                className="
                w-32
                h-32
                rounded-full
                object-cover
                border-4
                border-slate-900
                shadow-lg
                "
              />
            ) : (
              <div
                className="
                w-32
                h-32
                rounded-full
                bg-cyan-600
                border-4
                border-slate-900
                flex
                items-center
                justify-center
                text-5xl
                font-bold
                shadow-lg
                "
              >
                {teacher.fullName.charAt(0)}
              </div>
            )}

            <div>

              <h1 className="text-3xl font-bold">
                {teacher.fullName}
              </h1>

              <p className="text-slate-400 mt-2">
                {teacher.email}
              </p>

              <div className="flex flex-wrap gap-3 mt-5">

                <Badge>
                  {teacher.subject || "No Subject"}
                </Badge>

                <Badge>
                  {teacher.qualification ||
                    "No Qualification"}
                </Badge>

                <StatusBadge
                  status={teacher.status}
                />

              </div>
            </div>

          </div>

          <div
            className="
            bg-slate-800/80
            rounded-2xl
            p-6
            w-full
            lg:w-80
            "
          >

            <p className="text-slate-400 text-sm">
              Verification Progress
            </p>

            <div className="mt-4">

              <div className="flex justify-between text-sm mb-2">
                <span>Completed</span>

                <span>{completion}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-700">

                <div
                  className="
                  h-3
                  rounded-full
                  bg-gradient-to-r
                  from-green-500
                  to-cyan-500
                  transition-all
                  duration-500
                  "
                  style={{
                    width: `${completion}%`,
                  }}
                />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <Stat
                label="Experience"
                value={
                  teacher.experience ||
                  "N/A"
                }
              />

              <Stat
                label="Institution"
                value={
                  teacher.institution ||
                  "N/A"
                }
              />

              <Stat
                label="Phone"
                value={
                  teacher.phone || "N/A"
                }
              />

              <Stat
                label="Country"
                value={
                  teacher.country ||
                  "N/A"
                }
              />

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
    anyTeacher.address,
    anyTeacher.gender,
    anyTeacher.country,
    anyTeacher.state,
    anyTeacher.subject,
    anyTeacher.qualification,
    anyTeacher.institution,
    anyTeacher.experience,
    anyTeacher.licenseNumber,
    anyTeacher.profilePhoto,
    anyTeacher.certificate,
    anyTeacher.degreeCertificate,
    anyTeacher.governmentId,
    anyTeacher.cv,
  ];

  fields.forEach((field) => {
    total++;

    if (field) completed++;
  });

  return Math.round(
    (completed / total) * 100
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
      px-4
      py-2
      rounded-full
      bg-cyan-500/10
      border
      border-cyan-500/20
      text-cyan-300
      text-sm
      "
    >
      {children}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const color =
    status === "ACTIVE"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : status === "REJECTED"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`
      px-4
      py-2
      rounded-full
      border
      text-sm
      ${color}
      `}
    >
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
      bg-slate-900
      rounded-xl
      p-4
      "
    >
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-medium text-sm break-words">
        {value}
      </p>
    </div>
  );
}
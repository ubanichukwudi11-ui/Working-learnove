"use client";

import { TeacherReviewProps } from "./types";

export default function AcademicInfoCard({
  teacher,
}: TeacherReviewProps) {
  return (
    <div
      className="
      bg-[#111827]
      border
      border-slate-800
      rounded-3xl
      p-8
      "
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Academic Information
        </h2>

        <p className="text-slate-400 mt-2">
          Professional qualifications,
          teaching experience and licensing
          information.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

        <AcademicCard
          icon="📘"
          title="Teaching Subject"
          value={teacher.subject}
        />

        <AcademicCard
          icon="🎓"
          title="Highest Qualification"
          value={teacher.qualification}
        />

        <AcademicCard
          icon="🏫"
          title="Institution"
          value={teacher.institution}
        />

        <AcademicCard
          icon="💼"
          title="Teaching Experience"
          value={teacher.experience}
        />

        <AcademicCard
          icon="🪪"
          title="Teaching License"
          value={teacher.licenseNumber}
        />

        <AcademicCard
          icon="⭐"
          title="Application Status"
          value={teacher.status}
          highlight
        />

      </div>

      {/* Summary */}

      <div
        className="
        mt-8
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-6
        "
      >
        <h3 className="font-bold text-lg mb-3">
          Academic Summary
        </h3>

        <p className="text-slate-300 leading-7">
          This applicant specializes in{" "}
          <span className="text-cyan-400 font-semibold">
            {teacher.subject || "Unknown Subject"}
          </span>
          {" "}and holds{" "}
          <span className="text-cyan-400 font-semibold">
            {teacher.qualification ||
              "an unspecified qualification"}
          </span>
          {" "}from{" "}
          <span className="text-cyan-400 font-semibold">
            {teacher.institution ||
              "an unknown institution"}
          </span>
          . They report{" "}
          <span className="text-cyan-400 font-semibold">
            {teacher.experience ||
              "no stated"}
          </span>{" "}
          teaching experience.
        </p>
      </div>
    </div>
  );
}

function AcademicCard({
  icon,
  title,
  value,
  highlight = false,
}: {
  icon: string;
  title: string;
  value?: string;
  highlight?: boolean;
}) {
  const statusColor = () => {
    switch (value) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-green-500/30";

      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";

      default:
        return "";
    }
  };

  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-5
      hover:border-cyan-500/30
      transition-all
      duration-300
      "
    >
      <div className="flex items-center gap-4 mb-4">

        <div
          className="
          w-12
          h-12
          rounded-xl
          bg-cyan-500/10
          flex
          items-center
          justify-center
          text-2xl
          "
        >
          {icon}
        </div>

        <div>
          <p className="text-slate-400 text-sm">
            {title}
          </p>
        </div>

      </div>

      {highlight ? (
        <span
          className={`
          inline-block
          px-4
          py-2
          rounded-full
          border
          text-sm
          font-medium
          ${statusColor()}
          `}
        >
          {value}
        </span>
      ) : (
        <p className="text-lg font-semibold break-words">
          {value || "Not Provided"}
        </p>
      )}
    </div>
  );
}
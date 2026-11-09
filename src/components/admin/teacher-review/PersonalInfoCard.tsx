"use client";

import { TeacherReviewProps } from "./types";

export default function PersonalInfoCard({
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
          Personal Information
        </h2>

        <p className="text-slate-400 mt-2">
          Teacher personal profile and contact
          information.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

        <InfoCard
          icon="👤"
          title="Full Name"
          value={teacher.fullName}
        />

        <InfoCard
          icon="📧"
          title="Email"
          value={teacher.email}
        />

        <InfoCard
          icon="📱"
          title="Phone Number"
          value={teacher.phone}
        />

        <InfoCard
          icon="🚻"
          title="Gender"
          value={teacher.gender}
        />

        <InfoCard
          icon="🎂"
          title="Date of Birth"
          value={teacher.dob}
        />

        <InfoCard
          icon="🌍"
          title="Country"
          value={teacher.country}
        />

        <InfoCard
          icon="📍"
          title="State"
          value={teacher.state}
        />

        <InfoCard
          icon="🏠"
          title="Address"
          value={teacher.address}
        />

        <InfoCard
          icon="🆔"
          title="Application Status"
          value={teacher.status}
          status
        />

      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  status = false,
}: {
  icon: string;
  title: string;
  value?: string;
  status?: boolean;
}) {
  const getStatusStyle = () => {
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
      transition
      "
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="
          w-11
          h-11
          rounded-xl
          bg-cyan-500/10
          flex
          items-center
          justify-center
          text-xl
          "
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>
        </div>
      </div>

      {status ? (
        <span
          className={`
          inline-block
          px-4
          py-2
          rounded-full
          border
          text-sm
          font-medium
          ${getStatusStyle()}
          `}
        >
          {value || "Unknown"}
        </span>
      ) : (
        <p className="text-lg font-semibold break-words">
          {value || "Not Provided"}
        </p>
      )}
    </div>
  );
}
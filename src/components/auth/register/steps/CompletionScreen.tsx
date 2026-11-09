"use client";

import { RegisterData } from "../hooks/useRegisterState";

type Props = {
  data: RegisterData;
  onEnter: () => void;
};

export default function CompletionScreen({
  data,
  onEnter,
}: Props) {
  const firstName =
    data.fullName?.trim()?.split(" ")[0] || "Student";

  return (
    <div
      className="
        bg-[#111827]
        border
        border-slate-800
        rounded-2xl
        p-8
        md:p-10
        text-center
      "
    >
      <div className="text-6xl mb-6">
        🎉
      </div>

      <h1 className="text-3xl font-bold text-white">
        Welcome {firstName} 👋
      </h1>

      <p className="mt-4 text-slate-400 leading-relaxed">
        Your learning profile has been created.
      </p>

      <p className="text-slate-400 leading-relaxed">
        Nova has already started preparing a
        personalized learning experience based
        on your goals and subjects.
      </p>

      {data.examType && (
        <div
          className="
            mt-6
            bg-[#0F172A]
            border
            border-slate-800
            rounded-2xl
            p-4
          "
        >
          <p className="text-sm text-slate-400">
            Current Focus
          </p>

          <p className="text-white font-semibold mt-1">
            {data.examType}
          </p>
        </div>
      )}

      <button
        onClick={onEnter}
        className="
          mt-8
          w-full
          py-3
          rounded-2xl
          font-semibold
          text-white
          bg-gradient-to-r
          from-[#6D28D9]
          to-[#06B6D4]
          hover:opacity-90
          transition
        "
      >
        Enter Learnova
      </button>
    </div>
  );
}
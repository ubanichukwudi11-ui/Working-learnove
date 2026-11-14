"use client";

import { RegisterData } from "../hooks/useRegisterState";

type Props = {
  data: RegisterData;
  updateData: (
    field: keyof RegisterData,
    value: string | string[]
  ) => void;
};

const options = [
  "Explain topics simply",
  "Exam preparation focus",
  "Daily study reminders",
  "Step-by-step tutoring",
];

export default function StepNovaSetup({
  data,
  updateData,
}: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">
        How should Nova help you?
      </h3>

      <p className="text-slate-400 text-sm mb-6">
        Optional — choose what fits you best.
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() =>
              updateData(
                "novaPreference",
                option
              )
            }
            className={`w-full text-left p-4 rounded-2xl border transition ${
              data.novaPreference === option
                ? "border-[#6D28D9] bg-[#6D28D9]/10"
                : "border-slate-700 bg-[#0F172A]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
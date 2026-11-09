"use client";

type Props = {
  step: number;
  onNext: () => void;
  onBack: () => void;
};

export default function NavigationButtons({
  step,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="flex items-center justify-between mt-8">
      {step > 1 ? (
        <button
          onClick={onBack}
          className="px-4 py-2 text-slate-400 hover:text-white transition"
        >
          Back
        </button>
      ) : (
        <div />
      )}

      <button
        onClick={onNext}
        className="
          px-6
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
        {step === 4 ? "Finish" : "Continue"}
      </button>
    </div>
  );
}
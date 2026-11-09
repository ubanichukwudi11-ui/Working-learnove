"use client";

type Props = {
  step: number;
};

export default function ProgressBar({ step }: Props) {
  const progress = ((step - 1) / 4) * 100;

  return (
    <div className="w-full mt-4">
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#6D28D9] to-[#06B6D4] transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}
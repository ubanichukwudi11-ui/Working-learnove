"use client";

type Props = {
  step: number;
};

export default function StepperHeader({ step }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">
        Create Your Learning Profile
      </h1>

      <p className="text-slate-400 text-sm mt-2">
        Step {Math.min(step, 4)} of 4
      </p>
    </div>
  );
}
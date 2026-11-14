"use client";

export default function VerificationScore({ score }: { score: number }) {
  const color = score >= 80 ? "#4F46E5" : score >= 40 ? "#D97706" : "#DC2626";
  const statusLabel =
    score >= 80 ? "Ready for Approval" : score >= 40 ? "In Review" : "Incomplete";

  return (
    <div className="learnova-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="landing-display text-lg font-bold text-[#0D1438]">
          Checklist Verification Progress
        </h2>
        <p className="text-xs text-[#6B6F94] mt-1">
          Complete all five verification items below to unlock educator approval.
        </p>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color }}>
            {statusLabel}
          </p>
          <p className="text-3xl font-extrabold text-[#0D1438]">{score}%</p>
        </div>
      </div>
    </div>
  );
}
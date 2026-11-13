"use client";

export default function VerificationScore({ score }: { score: number }) {
  const color = score >= 80 ? "#0D9488" : score >= 40 ? "#D97706" : "#DC2626";
  const statusLabel =
    score >= 80 ? "Ready for Approval" : score >= 40 ? "In Review" : "Incomplete";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-[#0B1F3A]">Checklist Verification Progress</h2>
        <p className="text-xs text-slate-600 mt-1">
          Complete all five verification items below to unlock educator approval.
        </p>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color }}>
            {statusLabel}
          </p>
          <p className="text-3xl font-extrabold text-[#0B1F3A]">{score}%</p>
        </div>
      </div>
    </div>
  );
}
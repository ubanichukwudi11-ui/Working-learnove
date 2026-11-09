"use client";

type VerificationScoreProps = {
  score: number;
};

export default function VerificationScore({
  score,
}: VerificationScoreProps) {
  const radius = 80;
  const stroke = 12;

  const normalizedRadius =
    radius - stroke / 2;

  const circumference =
    normalizedRadius * 2 * Math.PI;

  const offset =
    circumference -
    (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80)
      return "#22c55e";

    if (score >= 60)
      return "#facc15";

    return "#ef4444";
  };

  const getStatus = () => {
    if (score >= 80)
      return "Excellent";

    if (score >= 60)
      return "Needs Review";

    return "High Risk";
  };

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">
            Verification Score
          </h2>

          <p className="text-slate-400 mt-2">
            Overall application
            completeness.
          </p>
        </div>

        <div
          className="
          px-4
          py-2
          rounded-full
          font-semibold
          "
          style={{
            backgroundColor:
              `${getColor()}20`,
            color: getColor(),
          }}
        >
          {getStatus()}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-10">

        <div className="relative w-48 h-48">

          <svg
            width="192"
            height="192"
            className="-rotate-90"
          >
            <circle
              stroke="#1e293b"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx="96"
              cy="96"
            />

            <circle
              stroke={getColor()}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              r={normalizedRadius}
              cx="96"
              cy="96"
              style={{
                transition:
                  "stroke-dashoffset 0.8s ease",
              }}
            />
          </svg>

          <div
            className="
            absolute
            inset-0
            flex
            flex-col
            items-center
            justify-center
            "
          >
            <h3 className="text-5xl font-bold">
              {score}%
            </h3>

            <p className="text-slate-400 mt-2">
              Verified
            </p>
          </div>

        </div>

        <div className="flex-1">

          <div className="space-y-5">

            <ScoreItem
              title="Identity"
              value={score >= 20}
            />

            <ScoreItem
              title="Qualifications"
              value={score >= 40}
            />

            <ScoreItem
              title="Experience"
              value={score >= 60}
            />

            <ScoreItem
              title="Documents"
              value={score >= 80}
            />

            <ScoreItem
              title="Ready For Approval"
              value={score >= 90}
            />

          </div>

        </div>

      </div>
    </div>
  );
}

function ScoreItem({
  title,
  value,
}: {
  title: string;
  value: boolean;
}) {
  return (
    <div
      className="
      flex
      justify-between
      items-center
      bg-slate-900
      rounded-2xl
      p-4
      "
    >
      <span>{title}</span>

      <span
        className={`font-semibold ${
          value
            ? "text-green-400"
            : "text-yellow-400"
        }`}
      >
        {value
          ? "Verified"
          : "Pending"}
      </span>
    </div>
  );
}
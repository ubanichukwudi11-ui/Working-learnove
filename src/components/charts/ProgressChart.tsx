"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const DEFAULT_DATA = [
  { week: "Wk 1", score: 68 },
  { week: "Wk 2", score: 71 },
  { week: "Wk 3", score: 74 },
  { week: "Wk 4", score: 73 },
  { week: "Wk 5", score: 78 },
  { week: "Wk 6", score: 81 },
  { week: "Wk 7", score: 84 },
];

export default function ProgressChart({
  data,
}: {
  data?: Array<{ week: string; score: number }>;
}) {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;
  const latestScore = chartData[chartData.length - 1]?.score ?? 0;

  return (
    <div className="learnova-card p-6 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base text-[var(--foreground)]">
            Term Assessment Trend
          </h3>
          <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
            Progression across topic quizzes, CBT &amp; classwork (%)
          </p>
        </div>
        <span className="text-sm font-extrabold text-[#4F46E5] dark:text-[#A5B4FC] tabular-nums">
          {latestScore}%
        </span>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 224, 0.25)" />
            <XAxis dataKey="week" stroke="#8B90B8" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#8B90B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
                color: "var(--foreground)",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, fill: "#8B5CF6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
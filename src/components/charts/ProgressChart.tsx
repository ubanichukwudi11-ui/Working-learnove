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
          <h3 className="font-bold text-base text-[#0B1230]">Term Assessment Trend</h3>
          <p className="text-xs text-[#6B6F94] mt-0.5">
            Progression across topic quizzes, CBT &amp; classwork (%)
          </p>
        </div>
        <span className="text-sm font-extrabold text-[#4F46E5] tabular-nums">
          {latestScore}%
        </span>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E1F5" />
            <XAxis dataKey="week" stroke="#6B6F94" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#6B6F94" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E4E1F5",
                borderRadius: "12px",
                color: "#0B1230",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={{ r: 4, fill: "#7C3AED" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-[#0B1F3A]">Term Assessment Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Progression across topic quizzes, CBT &amp; classwork (%)
          </p>
        </div>
        <span className="text-sm font-extrabold text-[#0D9488] tabular-nums">
          {latestScore}%
        </span>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="week" stroke="#64748B" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "12px",
                color: "#0F1F38",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#0D9488"
              strokeWidth={3}
              dot={{ r: 4, fill: "#0B1F3A" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
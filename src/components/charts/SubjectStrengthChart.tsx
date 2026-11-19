"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const DEFAULT_DATA = [
  { subject: "Math", score: 85 },
  { subject: "English", score: 88 },
  { subject: "Physics", score: 74 },
  { subject: "Chem", score: 65 },
  { subject: "Bio", score: 79 },
];

export default function SubjectStrengthChart({
  data,
}: {
  data?: Array<{ subject: string; score: number }>;
}) {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;

  return (
    <div className="learnova-card p-6 min-w-0">
      <div>
        <h3 className="font-bold text-base text-[var(--foreground)]">
          Subject Mastery
        </h3>
        <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
          Term continuous assessment &amp; quiz estimate (%)
        </p>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 224, 0.25)"
              vertical={false}
            />
            <XAxis dataKey="subject" stroke="#8B90B8" fontSize={12} />
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
            <Bar dataKey="score" fill="#6366F1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
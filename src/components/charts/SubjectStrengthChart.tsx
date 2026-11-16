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
        <h3 className="font-bold text-base text-[#0B1230]">Subject Mastery</h3>
        <p className="text-xs text-[#6B6F94] mt-0.5">
          Term continuous assessment &amp; quiz estimate (%)
        </p>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E1F5" vertical={false} />
            <XAxis dataKey="subject" stroke="#6B6F94" fontSize={12} />
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
            <Bar dataKey="score" fill="#4F46E5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
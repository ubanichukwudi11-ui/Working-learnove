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

const data = [
  { subject: "Math", score: 85 },
  { subject: "English", score: 88 },
  { subject: "Physics", score: 74 },
  { subject: "Chem", score: 65 },
  { subject: "Bio", score: 79 },
];

export default function SubjectStrengthChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div>
        <h3 className="font-bold text-base text-[#0B1F3A]">Subject Mastery</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Second Term continuous assessment breakdown (%)
        </p>
      </div>

      <div className="h-[240px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="subject" stroke="#64748B" fontSize={12} />
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
            <Bar dataKey="score" fill="#0B1F3A" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
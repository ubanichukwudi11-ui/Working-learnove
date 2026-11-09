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


const data = [
  {
    day: "Mon",
    xp: 120,
  },
  {
    day: "Tue",
    xp: 240,
  },
  {
    day: "Wed",
    xp: 180,
  },
  {
    day: "Thu",
    xp: 320,
  },
  {
    day: "Fri",
    xp: 450,
  },
  {
    day: "Sat",
    xp: 520,
  },
  {
    day: "Sun",
    xp: 650,
  },
];


export default function ProgressChart(){

return (

<div
className="
bg-[#111827]
border
border-slate-800
rounded-2xl
p-6
"
>

<h3 className="font-bold text-lg">
Learning Progress
</h3>


<p className="text-sm text-slate-400 mt-1">
Weekly XP growth
</p>


<div className="h-[260px] mt-5">

<ResponsiveContainer width="100%" height="100%">

<LineChart data={data}>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis
dataKey="day"
/>


<YAxis />


<Tooltip />


<Line
type="monotone"
dataKey="xp"
stroke="#6D28D9"
strokeWidth={3}
/>


</LineChart>

</ResponsiveContainer>


</div>


</div>

)

}
"use client";


import {
 ResponsiveContainer,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
} from "recharts";


const data = [
{
subject:"Math",
score:85
},
{
subject:"Physics",
score:72
},
{
subject:"English",
score:90
},
{
subject:"Chemistry",
score:65
},
];


export default function SubjectStrengthChart(){

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
Subject Strength
</h3>


<p className="text-sm text-slate-400 mt-1">
Your current performance
</p>


<div className="h-[260px] mt-5">

<ResponsiveContainer
width="100%"
height="100%"
>


<BarChart data={data}>


<XAxis
dataKey="subject"
/>


<YAxis />


<Tooltip />


<Bar
dataKey="score"
fill="#06B6D4"
radius={[8,8,0,0]}
/>


</BarChart>


</ResponsiveContainer>


</div>


</div>

)

}
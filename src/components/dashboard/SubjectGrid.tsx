"use client";

import {
  Calculator,
  Atom,
  BookOpen,
  FlaskConical,
  Leaf,
  TrendingUp,
} from "lucide-react";


const subjects = [
  {
    name:"Mathematics",
    description:"Master calculations and problem solving.",
    progress:72,
    icon:Calculator,
  },

  {
    name:"Physics",
    description:"Understand motion, forces and energy.",
    progress:62,
    icon:Atom,
  },

  {
    name:"English",
    description:"Improve grammar and communication.",
    progress:90,
    icon:BookOpen,
  },

  {
    name:"Chemistry",
    description:"Explore reactions and elements.",
    progress:65,
    icon:FlaskConical,
  },

  {
    name:"Biology",
    description:"Learn life sciences.",
    progress:78,
    icon:Leaf,
  },

  {
    name:"Economics",
    description:"Understand markets and systems.",
    progress:55,
    icon:TrendingUp,
  },
];



export default function SubjectGrid(){

return (

<section className="mt-10">


<div className="flex justify-between items-center mb-5">

<h2 className="text-2xl font-bold">
Your Subjects
</h2>


<button
className="
text-sm
text-cyan-400
hover:text-cyan-300
"
>
View All
</button>

</div>



<div
className="
grid
md:grid-cols-2
xl:grid-cols-3
gap-5
"
>


{subjects.map((subject)=>{


const Icon = subject.icon;


return (

<div
key={subject.name}
className="
bg-[#111827]
border
border-slate-800
rounded-2xl
p-5
hover:-translate-y-1
hover:border-purple-500/40
transition-all
duration-300
"
>


<div
className="
w-12
h-12
rounded-2xl
bg-gradient-to-r
from-[#6D28D9]
to-[#06B6D4]
flex
items-center
justify-center
"
>

<Icon
size={24}
/>

</div>



<h3
className="
text-lg
font-bold
mt-5
"
>
{subject.name}
</h3>



<p
className="
text-sm
text-slate-400
mt-2
"
>
{subject.description}
</p>



<div className="mt-5">


<div
className="
flex
justify-between
text-sm
mb-2
"
>

<span className="text-slate-400">
Progress
</span>


<span>
{subject.progress}%
</span>


</div>



<div
className="
h-2
bg-slate-800
rounded-full
overflow-hidden
"
>

<div
style={{
width:`${subject.progress}%`
}}
className="
h-full
rounded-full
bg-gradient-to-r
from-[#6D28D9]
to-[#06B6D4]
"
/>


</div>


</div>



<button
className="
mt-5
w-full
py-2.5
rounded-xl
bg-slate-800
hover:bg-gradient-to-r
hover:from-[#6D28D9]
hover:to-[#06B6D4]
transition-all
font-medium
"
>

Open Subject

</button>


</div>

)


})}


</div>


</section>

)

}
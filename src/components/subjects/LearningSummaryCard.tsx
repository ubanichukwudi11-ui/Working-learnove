"use client";

import {
ArrowRight,
BookOpen,
Target,
Flame,
} from "lucide-react";


export default function LearningSummaryCard(){


return (

<div

className="
relative
overflow-hidden
rounded-2xl
p-6
mb-8
bg-gradient-to-r
from-[#6D28D9]
to-[#06B6D4]
"

>


<div
className="
absolute
right-0
top-0
w-72
h-72
bg-white/10
rounded-full
blur-3xl
"
/>



<div className="relative z-10">


<h2
className="
text-xl
font-bold
"
>
Your Learning Progress
</h2>


<p
className="
text-white/70
mt-1
"
>
Track your growth and continue improving.
</p>



<div
className="
grid
grid-cols-1
sm:grid-cols-3
gap-4
mt-6
"
>


<div
className="
bg-black/20
rounded-2xl
p-4
"
>

<BookOpen/>

<p
className="
mt-3
text-2xl
font-bold
"
>
5
</p>

<p className="text-white/70 text-sm">
Active Subjects
</p>


</div>




<div
className="
bg-black/20
rounded-2xl
p-4
"
>

<Flame/>

<p
className="
mt-3
text-2xl
font-bold
"
>
42
</p>

<p className="text-white/70 text-sm">
Lessons Completed
</p>


</div>




<div
className="
bg-black/20
rounded-2xl
p-4
"
>

<Target/>


<p
className="
mt-3
text-2xl
font-bold
"
>
78%
</p>

<p className="text-white/70 text-sm">
Weekly Goal
</p>


</div>



</div>




<button

className="
mt-6
flex
items-center
gap-2
bg-white
text-purple-700
px-5
py-3
rounded-2xl
font-semibold
hover:scale-105
transition
"

>

Continue Learning

<ArrowRight size={18}/>

</button>



</div>


</div>


)

}
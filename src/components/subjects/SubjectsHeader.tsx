"use client";


import {
Search,
SlidersHorizontal,
} from "lucide-react";



export default function SubjectsHeader(){


return (

<section
className="
mb-8
"
>


<div>

<h1
className="
text-3xl
font-bold
"
>
My Subjects
</h1>


<p
className="
text-slate-400
mt-2
"
>
Continue your learning journey with Nova.
</p>


</div>





<div
className="
mt-6
flex
gap-3
"
>


<div

className="
flex
items-center
gap-3
bg-[#111827]
border
border-slate-800
rounded-2xl
px-4
py-3
flex-1
"

>

<Search
size={20}
className="text-slate-400"
/>


<input

placeholder="
Search subjects...
"

className="
bg-transparent
outline-none
w-full
text-sm
"

/>


</div>




<button

className="
w-12
h-12
rounded-2xl
bg-[#111827]
border
border-slate-800
flex
items-center
justify-center
hover:bg-slate-800
transition
"

>

<SlidersHorizontal
size={20}
/>

</button>



</div>



</section>

)

}
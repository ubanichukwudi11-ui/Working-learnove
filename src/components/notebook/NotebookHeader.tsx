"use client";

import {
Search,
Plus,
SlidersHorizontal
} from "lucide-react";


export default function NotebookHeader(){


return (

<section className="mb-8">


<div>

<h1
className="
text-3xl
font-bold
"
>
Notebook
</h1>


<p
className="
text-slate-400
mt-2
"
>
Your personal learning workspace powered by Nova.
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
Search notes...
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
hidden
sm:flex
items-center
gap-2
rounded-2xl
px-5
py-3
bg-gradient-to-r
from-purple-600
to-cyan-500
font-semibold
hover:scale-105
transition
"

>

<Plus size={18}/>

New Note

</button>



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
"

>

<SlidersHorizontal size={20}/>

</button>


</div>



</section>

)

}
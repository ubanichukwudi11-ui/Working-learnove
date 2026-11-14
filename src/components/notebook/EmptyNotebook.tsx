"use client";

import {
NotebookPen
} from "lucide-react";


export default function EmptyNotebook(){


return (

<div

className="
rounded-2xl
border
border-slate-800
bg-[#111827]
p-10
text-center
"

>


<div

className="
mx-auto
w-16
h-16
rounded-2xl
bg-purple-500/20
flex
items-center
justify-center
"

>

<NotebookPen
size={32}
className="text-purple-300"
/>

</div>




<h2
className="
text-xl
font-bold
mt-5
"
>

Your notebook is empty

</h2>



<p
className="
text-slate-400
mt-2
"
>

Save lessons or create your first note.

</p>




<button

className="
mt-6
px-6
py-3
rounded-2xl
bg-gradient-to-r
from-purple-600
to-cyan-500
font-semibold
"

>

Create Note

</button>



</div>

)

}
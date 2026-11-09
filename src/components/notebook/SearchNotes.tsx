"use client";


import {
Search
} from "lucide-react";



export default function SearchNotes({

value,

onChange

}:{

value:string;

onChange:(value:string)=>void;

}){


return (

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

"

>


<Search

size={18}

className="
text-slate-400
"

/>



<input

value={value}

onChange={(e)=>
onChange(e.target.value)
}

placeholder="
Search notes...
"

className="

bg-transparent

outline-none

w-full

text-white

placeholder:text-slate-500

"

/>


</div>

)

}
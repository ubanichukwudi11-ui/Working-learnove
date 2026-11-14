"use client";

import {
  BookOpen,
  Hash,
  Folder,
} from "lucide-react";

import CreateNoteButton from "./CreateNoteButton";

import { useState } from "react";


const folders = [

"Mathematics",
"Physics",
"Chemistry",
"Biology",
"English",
"General"

];


const tags = [

"Revision",
"Important",
"Exam"

];



export default function NotebookSidebar(){


const [activeFolder,setActiveFolder] = useState("General");



return (

<aside

className="

bg-[#111827]

border
border-slate-800

rounded-2xl

p-5

h-full

sticky
top-6

overflow-y-auto

space-y-8

"

>



{/* Header */}

<div>


<div

className="
flex
items-center
justify-between
mb-5
"

>


<h2

className="
font-bold
text-lg

"

>

Notebook

</h2>


</div>



{/* Create Note */}

<CreateNoteButton />


</div>





{/* Folders */}

<div>


<h3

className="
text-xs
uppercase
tracking-wide

text-slate-500

mb-4

"

>

Folders

</h3>



<div

className="
space-y-2

"

>


{

folders.map(folder=>(


<button

key={folder}

onClick={()=>setActiveFolder(folder)}

className={`


w-full


flex

items-center

gap-3


px-3

py-3


rounded-xl


text-sm


transition


${


activeFolder === folder


?


"bg-purple-600/20 text-purple-300 border border-purple-500/30"


:


"text-slate-300 hover:bg-slate-800 hover:text-white"


}



`}

>


<Folder size={18}/>


<span>

{folder}

</span>


</button>


))

}



</div>


</div>







{/* Tags */}

<div>


<h3

className="

text-xs

uppercase

tracking-wide

text-slate-500

mb-4

"

>

Tags

</h3>



<div

className="
flex
flex-wrap
gap-2

"

>


{

tags.map(tag=>(


<button

key={tag}

className="


flex

items-center

gap-1


px-3

py-2


rounded-full


bg-slate-800


text-sm


text-slate-300


hover:bg-slate-700


transition


"

>


<Hash size={14}/>


{tag}


</button>


))


}



</div>


</div>






</aside>


)

}
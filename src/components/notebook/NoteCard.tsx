"use client";


import Link from "next/link";

import {
BookOpen,
Clock,
Tag,
FileText
} from "lucide-react";



type Note = {

id:string;

title?:string;

folder?:string;

tags?:string[];

createdAt?:string;

content?:string;

};



export default function NoteCard({

note

}:{

note:Note;

}){



return (

<Link

href={`/notebook/${note.id}`}

className="

group

block

bg-[#111827]

border

border-slate-800

rounded-2xl

p-5

hover:border-purple-500/50

hover:-translate-y-1

hover:shadow-lg

hover:shadow-purple-500/10

transition-all

duration-300

"

>



{/* Title */}


<div

className="
flex
items-start
justify-between
gap-3
"

>


<h3

className="

text-white

font-semibold

text-lg

group-hover:text-purple-300

transition

"

>

{note.title || "Untitled Note"}

</h3>



<FileText

size={18}

className="
text-slate-500
"

/>


</div>





{/* Folder */}


<div

className="

flex

items-center

gap-2

mt-4

text-sm

text-slate-400

"

>


<BookOpen size={15}/>


{note.folder || "General"}


</div>






{/* Preview */}

{

note.content &&

(

<p

className="

mt-4

text-sm

text-slate-500

line-clamp-2

"

>

{note.content}

</p>

)

}







{/* Tags */}


{

note.tags && note.tags.length > 0 &&

(

<div

className="

flex

flex-wrap

gap-2

mt-4

"

>


{

note.tags.map(tag=>(


<span

key={tag}

className="

flex

items-center

gap-1

px-3

py-1

rounded-full

bg-slate-800

text-xs

text-slate-300

"

>


<Tag size={12}/>


{tag}


</span>


))


}



</div>

)

}






{/* Date */}


<div

className="

flex

items-center

gap-2

mt-5

text-xs

text-slate-500

"

>


<Clock size={14}/>


{

note.createdAt

?

new Date(note.createdAt)
.toLocaleDateString()

:

"Recently"

}



</div>





</Link>


)

}
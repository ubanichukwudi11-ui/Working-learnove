"use client";


import {
useEffect,
useState
} from "react";


import {
Bold,
Italic,
Underline,
Check
} from "lucide-react";



type Note = {

id:string;

title:string;

content:string;

};




export default function NoteEditor({

noteId

}:{

noteId:string;

}){



const [title,setTitle]=useState("");

const [content,setContent]=useState("");

const [status,setStatus]=useState("Saved");





useEffect(()=>{


const saved =
localStorage.getItem(
`learnova-note-${noteId}`
);


if(saved){


const note =
JSON.parse(saved);


setTitle(note.title || "");

setContent(note.content || "");


}


},[noteId]);







function saveNote(

newTitle:string,

newContent:string

){


setStatus("Saving...");



const oldNote =
localStorage.getItem(
`learnova-note-${noteId}`
);



const note = oldNote

?

JSON.parse(oldNote)

:

{

id:noteId

};




const updated={


...note,

title:newTitle,

content:newContent,


};



localStorage.setItem(

`learnova-note-${noteId}`,

JSON.stringify(updated)

);



setTimeout(()=>{


setStatus("Saved");


},500);



}







function updateTitle(value:string){


setTitle(value);


saveNote(
value,
content
);


}




function updateContent(value:string){


setContent(value);


saveNote(
title,
value
);


}






return (

<div

className="

bg-[#111827]

border

border-slate-800

rounded-2xl

p-6

min-h-[600px]

"

>



{/* Header */}


<div

className="

flex

items-center

justify-between

mb-6

"

>


<div>


<input


value={title}


onChange={(e)=>

updateTitle(e.target.value)

}


placeholder="Untitled Note"


className="

bg-transparent

outline-none

text-3xl

font-bold

text-white

w-full

"

 />


</div>





<div

className="

flex

items-center

gap-2

text-sm

text-slate-400

"

>


<Check size={15}/>


{status}


</div>



</div>








{/* Toolbar */}


<div

className="

flex

gap-2

border-b

border-slate-800

pb-4

mb-5

"

>



<button

className="

p-2

rounded-lg

hover:bg-slate-800

text-slate-300

"

>

<Bold size={18}/>

</button>




<button

className="

p-2

rounded-lg

hover:bg-slate-800

text-slate-300

"

>

<Italic size={18}/>

</button>




<button

className="

p-2

rounded-lg

hover:bg-slate-800

text-slate-300

"

>

<Underline size={18}/>

</button>



</div>







{/* Editor */}


<textarea


value={content}


onChange={(e)=>

updateContent(e.target.value)

}


placeholder="Start writing your notes..."


className="

w-full

min-h-[400px]

resize-none

bg-transparent

outline-none

text-slate-200

leading-7

"

 />




</div>

)

}
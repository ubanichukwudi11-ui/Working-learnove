"use client";


import {
useEffect,
useState
} from "react";


import EditorToolbar from "./EditorToolbar";

import RichTextEditor from "./RichTextEditor";

import SaveStatus from "./SaveStatus";



export default function NoteEditor(){


const [title,setTitle]=useState(
"Untitled Note"
);


const [content,setContent]=useState(
""
);


const [saving,setSaving]=useState(false);




useEffect(()=>{


const timer=setTimeout(()=>{


setSaving(true);



setTimeout(()=>{

setSaving(false);

},800)



},500);



return ()=>clearTimeout(timer);



},[title,content]);





return (

<div

className="

bg-[#111827]

border

border-slate-800

rounded-2xl

overflow-hidden

"

>



{/* Title */}

<div

className="

p-6

border-b

border-slate-800

"

>


<input


value={title}


onChange={(e)=>

setTitle(e.target.value)

}


className="


w-full


bg-transparent


outline-none


text-3xl


font-bold


text-white


placeholder:text-slate-500


"

placeholder="Untitled Note"



/>



<div className="mt-3">

<SaveStatus

saving={saving}

/>

</div>



</div>






{/* Toolbar */}

<EditorToolbar/>






{/* Editor */}

<RichTextEditor


content={content}


setContent={setContent}


/>



</div>

)

}
"use client";


import {
useEditor,
EditorContent
} from "@tiptap/react";


import StarterKit from "@tiptap/starter-kit";


import EditorToolbar from "./EditorToolbar";

import SaveStatus from "./SaveStatus";



export default function NoteEditor(){


const editor = useEditor({

extensions:[

StarterKit

],


content:`

<h2>
Newton's Laws of Motion
</h2>


<p>
Write your notes here...
</p>

`,



editorProps:{

attributes:{

class:
"min-h-[400px] outline-none text-slate-200 prose prose-invert max-w-none"

}

},


});




return (

<div

className="
bg-[#111827]
border
border-slate-800
rounded-2xl
p-6
"

>


<div

className="
flex
justify-between
items-center
mb-5
"

>


<input

defaultValue="
Newton Laws of Motion
"

className="
bg-transparent
outline-none
text-2xl
font-bold
w-full
"

/>


<SaveStatus/>


</div>





<EditorToolbar
editor={editor}
/>




<EditorContent
editor={editor}
/>




</div>

)

}
"use client";


import {
Plus
} from "lucide-react";


import {
useState
} from "react";


import CreateNoteModal from "./CreateNoteModal";



export default function CreateNoteButton(){


const [open,setOpen]=useState(false);



return (

<>


<button

onClick={()=>setOpen(true)}

className="

w-full

flex

items-center

justify-center

gap-2

bg-gradient-to-r

from-purple-600

to-cyan-500

rounded-xl

py-3

font-semibold

text-white

hover:opacity-90

transition

"

>


<Plus size={18}/>


New Note


</button>





{

open &&

(

<CreateNoteModal

onClose={()=>setOpen(false)}

/>

)

}



</>


)

}
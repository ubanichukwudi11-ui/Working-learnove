"use client";


import {
useState
} from "react";


import {
X
} from "lucide-react";


import {
useRouter
} from "next/navigation";


import FolderSelector from "./FolderSelector";



export default function CreateNoteModal({

onClose

}:{

onClose:()=>void;

}){



const router = useRouter();


const [title,setTitle]=useState("");

const [folder,setFolder]=useState("General");




function createNote(){


const id =
Date.now().toString();



const note={


id,

title:title || "Untitled Note",

folder,

tags:[],

content:"",

createdAt:new Date().toISOString()


};



localStorage.setItem(

`learnova-note-${id}`,

JSON.stringify(note)

);




router.push(`/notebook/${id}`);


}






return (

<div

className="

fixed

inset-0

bg-black/60

backdrop-blur-sm

flex

items-center

justify-center

z-50

"

>


<div

className="

w-full

max-w-md

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

items-center

justify-between

mb-6

"

>


<h2

className="

text-xl

font-bold

text-white

"

>

Create Note

</h2>


<button

onClick={onClose}

>

<X

className="text-slate-400"

/>

</button>


</div>





<input


value={title}


onChange={(e)=>
setTitle(e.target.value)
}


placeholder="Note title..."


className="

w-full

bg-[#0F172A]

border

border-slate-700

rounded-xl

px-4

py-3

text-white

outline-none

mb-4

"

 />






<FolderSelector

value={folder}

onChange={setFolder}

/>






<button


onClick={createNote}


className="

w-full

mt-6

bg-purple-600

hover:bg-purple-700

rounded-xl

py-3

font-semibold

text-white

transition

"

>


Create Note


</button>





</div>


</div>


)

}
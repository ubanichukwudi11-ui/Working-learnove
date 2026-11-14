"use client";


import {
useEffect,
useState
} from "react";


import {
Search,
SlidersHorizontal
} from "lucide-react";


import NoteCard from "./NoteCard";



type Note = {

id:string;

title?:string;

folder?:string;

tags?:string[];

createdAt?:string;

content?:string;

};




export default function NotesArea(){



const [notes,setNotes]=useState<Note[]>([]);

const [search,setSearch]=useState("");





useEffect(()=>{


const storedNotes:Note[]=[];



Object.keys(localStorage)

.filter(key=>

key.startsWith(
"learnova-note-"
)

)

.forEach(key=>{


const note =
localStorage.getItem(key);



if(note){

storedNotes.push(
JSON.parse(note)
);

}


});



setNotes(storedNotes);



},[]);






const filteredNotes =

notes.filter(note=>{


const searchText =
search.toLowerCase();



return (


note.title
?.toLowerCase()
.includes(searchText)


||

note.folder
?.toLowerCase()
.includes(searchText)


||

note.tags
?.join(" ")
.toLowerCase()
.includes(searchText)



);


});





return (

<div

className="
space-y-6
"

>




{/* Header */}


<div>


<h1

className="
text-3xl
font-bold
text-white
"

>

My Notes

</h1>


<p

className="
text-slate-400
mt-2

"

>

Organize your knowledge and learning notes.

</p>


</div>








{/* Search + Filter */}


<div

className="

flex

gap-3

"

>


<div

className="

flex

items-center

gap-3

flex-1

bg-[#111827]

border

border-slate-800

rounded-xl

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


value={search}


onChange={(e)=>

setSearch(e.target.value)

}


placeholder="Search notes..."


className="

bg-transparent

outline-none

w-full

text-white

placeholder:text-slate-500

"

/>


</div>






<button


className="

flex

items-center

gap-2

px-4

rounded-xl

bg-[#111827]

border

border-slate-800

text-slate-300

hover:bg-slate-800

transition

"

>


<SlidersHorizontal size={17}/>


Filter


</button>



</div>








{/* Notes Grid */}


{

filteredNotes.length === 0

?


(

<div

className="

bg-[#111827]

border

border-slate-800

rounded-2xl

p-10

text-center

"

>


<div

className="
text-4xl
"

>

📒

</div>


<h3

className="
mt-4
text-white
font-semibold
"

>

No notes found

</h3>


<p

className="
mt-2
text-slate-400
"

>

Create a note or try another search.

</p>


</div>


)



:


(

<div

className="

grid

grid-cols-1

md:grid-cols-2

gap-5

"

>


{

filteredNotes.map(note=>(


<NoteCard

key={note.id}

note={note}

/>


))


}



</div>


)

}





</div>

)

}
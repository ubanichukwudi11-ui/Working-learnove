"use client";


import {
useEffect,
useState
} from "react";


import NoteCard from "./NoteCard";

import SearchNotes from "./SearchNotes";



type Note = {

id:string;

title:string;

folder:string;

tags:string[];

createdAt:string;

content:string;

};




export default function NotesList(){


const [notes,setNotes] = useState<Note[]>([]);

const [search,setSearch] = useState("");

const [loading,setLoading] = useState(true);





useEffect(()=>{


function loadNotes(){


const savedNotes:Note[] = [];





Object.keys(localStorage)

.filter((key)=>

key.startsWith(
"learnova-note-"
)

)

.forEach((key)=>{


const stored = localStorage.getItem(key);



if(stored){


try{


const parsed = JSON.parse(stored);



savedNotes.push({

id:
parsed.id ||
key.replace(
"learnova-note-",
""
),


title:
parsed.title ||
"Untitled Note",



folder:
parsed.folder ||
"General",



tags:
Array.isArray(parsed.tags)

?

parsed.tags

:

[],



createdAt:
parsed.createdAt ||

new Date()
.toISOString(),



content:
parsed.content ||

""

});



}

catch(error){


console.log(
"Invalid note:",
error
);


}


}



});



setNotes(savedNotes);


setLoading(false);



}



loadNotes();



},[]);







const filteredNotes = notes.filter((note)=>{


const searchText =
search.toLowerCase();



return (

note.title
.toLowerCase()
.includes(searchText)

||

note.folder
.toLowerCase()
.includes(searchText)

||

note.tags.some(tag=>

tag
.toLowerCase()
.includes(searchText)

)


);


});







if(loading){


return (

<div

className="

grid

grid-cols-1

md:grid-cols-2

gap-5

"

>


{

[1,2,3,4].map((item)=>(


<div

key={item}

className="

h-40

rounded-2xl

bg-[#111827]

border

border-slate-800

animate-pulse

"

>


</div>


))

}


</div>


);


}







return (

<div

className="

space-y-6

"

>



<SearchNotes

value={search}

onChange={setSearch}

/>






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

mb-4

"

>

📒

</div>



<h3

className="

text-white

font-semibold

text-lg

"

>

No notes found

</h3>



<p

className="

text-slate-400

mt-2

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

filteredNotes.map((note)=>(


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
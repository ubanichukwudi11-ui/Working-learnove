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
    <div className="learnova-card p-6 min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Untitled Note"
            className="landing-display bg-transparent outline-none text-2xl sm:text-3xl font-bold text-[#0B1230] placeholder:text-[#9CA0C2] w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] shrink-0">
          <Check size={15} />
          {status}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 border-b border-[#E4E1F5] pb-4 mb-5">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[#FAF8FF] text-[#43466E] hover:text-[#4F46E5] transition"
        >
          <Bold size={18} />
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[#FAF8FF] text-[#43466E] hover:text-[#4F46E5] transition"
        >
          <Italic size={18} />
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[#FAF8FF] text-[#43466E] hover:text-[#4F46E5] transition"
        >
          <Underline size={18} />
        </button>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => updateContent(e.target.value)}
        placeholder="Start writing your notes..."
        className="w-full min-h-[400px] resize-none bg-transparent outline-none text-[#0B1230] placeholder:text-[#9CA0C2] leading-7 text-sm sm:text-base"
      />
    </div>
  );
}
"use client";


const folders=[

"Mathematics",
"Physics",
"Chemistry",
"Biology",
"English",
"General"

];



export default function FolderSelector({

value,

onChange

}:{

value:string;

onChange:(value:string)=>void;

}){


return (

<select

value={value}

onChange={(e)=>
onChange(e.target.value)
}

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

"

>


{

folders.map(folder=>(


<option

key={folder}

value={folder}

>

{folder}

</option>


))

}



</select>

)

}
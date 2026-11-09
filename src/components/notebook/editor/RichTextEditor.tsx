"use client";


import {useState} from "react";



type Props={

content:string;

setContent:(value:string)=>void;

}



export default function RichTextEditor({

content,

setContent

}:Props){



return (

<div

contentEditable

suppressContentEditableWarning


onInput={(e)=>

setContent(
e.currentTarget.innerHTML
)

}


className="


min-h-[400px]


outline-none


text-slate-200


prose

prose-invert


max-w-none


p-6


"

dangerouslySetInnerHTML={{

__html:content

}}

/>


)

}
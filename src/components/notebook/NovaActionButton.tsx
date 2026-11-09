"use client";


import { Sparkles } from "lucide-react";


type Props = {

label:string;

onClick?:()=>void;

};



export default function NovaActionButton({

label,

onClick

}:Props){


return (

<button

onClick={onClick}

className="

w-full

flex

items-center

gap-3


px-4

py-3


rounded-xl


bg-purple-600/20


border

border-purple-500/20


text-purple-300


hover:bg-purple-600/30


transition


"

>


<Sparkles size={18}/>


<span>

{label}

</span>


</button>

)

}
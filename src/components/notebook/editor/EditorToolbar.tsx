"use client";


import {
Bold,
Italic,
Underline,
List,
ListOrdered,
Heading,
Quote,
Sparkles
} from "lucide-react";



export default function EditorToolbar(){


return (

<div

className="

flex

items-center

gap-2

p-3

border-b

border-slate-800

bg-[#111827]

rounded-t-2xl

"

>


<button className="toolbar-btn">
<Bold size={18}/>
</button>


<button className="toolbar-btn">
<Italic size={18}/>
</button>


<button className="toolbar-btn">
<Underline size={18}/>
</button>



<div className="w-px h-6 bg-slate-700"/>



<button className="toolbar-btn">
<Heading size={18}/>
</button>


<button className="toolbar-btn">
<List size={18}/>
</button>


<button className="toolbar-btn">
<ListOrdered size={18}/>
</button>


<button className="toolbar-btn">
<Quote size={18}/>
</button>



<div className="w-px h-6 bg-slate-700"/>



<button

className="
flex
items-center
gap-2

px-3
py-2

rounded-xl

bg-purple-600/20

text-purple-300

hover:bg-purple-600/40

transition

"

>

<Sparkles size={17}/>

Nova

</button>


</div>

)

}
"use client";

import {
Bold,
Italic,
Heading2,
List,
ListOrdered
} from "lucide-react";


type Props={
editor:any;
};


export default function EditorToolbar({
editor
}:Props){


if(!editor){
return null;
}



return (

<div

className="
flex
gap-2
border-b
border-slate-800
pb-3
mb-5
"

>


<button

onClick={()=>
editor.chain().focus().toggleBold().run()
}

className="
p-2
rounded-xl
hover:bg-slate-800
"

>

<Bold size={18}/>

</button>




<button

onClick={()=>
editor.chain().focus().toggleItalic().run()
}

className="
p-2
rounded-xl
hover:bg-slate-800
"

>

<Italic size={18}/>

</button>




<button

onClick={()=>
editor.chain().focus().toggleHeading({
level:2
}).run()
}

className="
p-2
rounded-xl
hover:bg-slate-800
"

>

<Heading2 size={18}/>

</button>





<button

onClick={()=>
editor.chain().focus().toggleBulletList().run()
}

className="
p-2
rounded-xl
hover:bg-slate-800
"

>

<List size={18}/>

</button>





<button

onClick={()=>
editor.chain().focus().toggleOrderedList().run()
}

className="
p-2
rounded-xl
hover:bg-slate-800
"

>

<ListOrdered size={18}/>

</button>




</div>

)

}
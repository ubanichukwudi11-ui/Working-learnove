"use client";


import {
Sparkles,
Brain,
FileText,
HelpCircle,
Wand2
} from "lucide-react";



const actions=[

{
title:"Explain",
description:"Explain this topic simply",
icon:Brain
},

{
title:"Summarize",
description:"Create quick revision notes",
icon:FileText
},

{
title:"Create Quiz",
description:"Generate practice questions",
icon:HelpCircle
},

{
title:"Improve Notes",
description:"Make notes clearer",
icon:Wand2
}

];





export default function NovaNotebookPanel(){



return (

<aside

className="

bg-[#111827]

border

border-slate-800

rounded-2xl

p-5

h-fit

sticky

top-6

"

>



{/* Header */}


<div

className="

flex

items-center

gap-3

mb-6

"

>


<div

className="

w-10

h-10

rounded-xl

bg-gradient-to-br

from-purple-600

to-cyan-500

flex

items-center

justify-center

"

>


<Sparkles

size={20}

className="text-white"

/>


</div>



<div>


<h2

className="

font-bold

text-white

"

>

Nova

</h2>


<p

className="

text-xs

text-slate-400

"

>

Notebook Assistant

</p>


</div>



</div>








<p

className="

text-sm

text-slate-400

mb-5

"

>

How can I help improve your notes?

</p>








{/* Actions */}


<div

className="

space-y-3

"

>


{

actions.map(action=>{


const Icon =
action.icon;



return (

<button

key={action.title}

className="

w-full

text-left

bg-[#0F172A]

border

border-slate-800

rounded-xl

p-4

hover:border-purple-500/50

hover:bg-slate-900

transition

"

>


<div

className="

flex

items-center

gap-3

"

>


<Icon

size={18}

className="text-purple-400"

/>



<div>


<h3

className="

text-sm

font-semibold

text-white

"

>

{action.title}

</h3>


<p

className="

text-xs

text-slate-500

mt-1

"

>

{action.description}

</p>


</div>



</div>



</button>

)

})

}


</div>







{/* AI Status */}


<div

className="

mt-6

rounded-xl

bg-gradient-to-r

from-purple-600/20

to-cyan-500/20

border

border-purple-500/20

p-4

"

>


<p

className="

text-xs

text-slate-300

"

>

✨ Nova is ready to help you learn faster.

</p>


</div>



</aside>


)

}
"use client";

import {
  Bot,
  Sparkles,
  MessageCircle,
  ArrowRight,
} from "lucide-react";


export default function NovaSubjectAssistant(){


return (

<div

className="
mt-8
relative
overflow-hidden
rounded-2xl
border
border-slate-800
bg-[#111827]
p-6
"

>


{/* Glow */}

<div

className="
absolute
right-0
top-0
w-64
h-64
bg-purple-600/20
rounded-full
blur-3xl
animate-pulse
"

/>




<div className="relative z-10">


<div
className="
flex
items-center
gap-3
"
>


<div

className="
w-12
h-12
rounded-2xl
bg-purple-500/20
flex
items-center
justify-center
"

>

<Bot
size={26}
className="text-purple-300"
/>

</div>



<div>

<p
className="
text-sm
text-slate-400
"
>
Nova AI Insight
</p>


<h2
className="
text-xl
font-bold
"
>
Your Personal Learning Assistant
</h2>


</div>


</div>




<div

className="
mt-5
rounded-2xl
bg-slate-900
p-5
"

>


<div
className="
flex
items-center
gap-2
text-cyan-400
text-sm
"
>

<Sparkles size={16}/>

Recommendation

</div>



<p
className="
mt-3
text-lg
"
>

I noticed you need more practice with
<b> Algebra equations.</b>

Try a quick 10 minute revision session.

</p>



</div>





<div

className="
flex
flex-col
sm:flex-row
gap-3
mt-5
"

>


<button

className="
flex
items-center
justify-center
gap-2
rounded-2xl
bg-gradient-to-r
from-purple-600
to-cyan-500
px-5
py-3
font-semibold
hover:scale-105
transition
"

>

Start Revision

<ArrowRight size={18}/>

</button>




<button

className="
flex
items-center
justify-center
gap-2
rounded-2xl
border
border-slate-700
px-5
py-3
hover:bg-slate-800
transition
"

>

<MessageCircle size={18}/>

Ask Nova

</button>



</div>




</div>



</div>

)

}
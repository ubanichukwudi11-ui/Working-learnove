"use client";

import {
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";


export default function NovaRecommendation(){


return (

<div

className="
relative
overflow-hidden
mt-8
rounded-2xl
p-5
sm:p-6
bg-gradient-to-r
from-[#6D28D9]
to-[#06B6D4]
shadow-xl
"

>


{/* AI Glow */}

<div

className="
absolute
right-0
top-0
w-72
h-72
bg-white/10
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
bg-white/20
flex
items-center
justify-center
"

>

<Bot
size={28}
/>


</div>



<div>

<p
className="
text-white/70
text-sm
"
>
Nova AI Recommendation
</p>


<h2
className="
text-xl
font-bold
"
>
Your next learning move
</h2>


</div>


</div>





<div

className="
mt-6
bg-black/20
rounded-2xl
p-5
"

>


<div
className="
flex
items-center
gap-2
text-sm
text-white/80
"

>

<Sparkles size={16}/>

Personalized for you

</div>



<p

className="
mt-3
text-lg
font-medium
"

>

You struggled with Algebra recently.

I recommend a quick 10-minute revision session.

</p>


</div>





<button

className="
mt-5
flex
items-center
gap-2
px-6
py-3
rounded-2xl
bg-white
text-purple-700
font-semibold
hover:scale-105
transition
"

>

Start Learning

<ArrowRight size={18}/>


</button>



</div>



</div>

)

}
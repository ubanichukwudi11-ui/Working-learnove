"use client";

import Link from "next/link";

import {
Calculator,
Atom,
Languages,
FlaskConical,
Leaf,
Landmark
} from "lucide-react";


type Props = {
subject:any;
};


export default function SubjectCard({
subject
}:Props){


const icons:any = {
calculator: Calculator,
atom: Atom,
languages: Languages,
flask: FlaskConical,
leaf: Leaf,
landmark: Landmark,
};


const Icon = icons[subject.icon];


return (

<div

className="
group
bg-[#111827]
border
border-slate-800
rounded-2xl
p-5
hover:-translate-y-1
hover:shadow-xl
transition
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
text-purple-300
"

>

<Icon size={25}/>

</div>




<h3
className="
mt-5
font-bold
text-lg
"
>
{subject.name}
</h3>



<p
className="
text-sm
text-slate-400
mt-2
"
>
{subject.description}
</p>




<div
className="
flex
gap-3
text-xs
text-slate-400
mt-4
"
>

<span>
{subject.lessons} Lessons
</span>

<span>
{subject.topics} Topics
</span>


</div>




<div className="mt-5">


<div
className="
flex
justify-between
text-sm
mb-2
"
>

<span>
Progress
</span>


<span>
{subject.progress}%
</span>


</div>




<div
className="
h-2
bg-slate-800
rounded-full
overflow-hidden
"
>


<div

className="
h-full
bg-gradient-to-r
from-purple-500
to-cyan-400
transition-all
duration-1000
"

style={{
width:`${subject.progress}%`
}}

/>


</div>



</div>





<Link

href={`/subjects/${subject.id}`}

className="
mt-5
block
text-center
rounded-2xl
py-3
bg-slate-800
hover:bg-purple-600
transition
font-medium
"

>

{
subject.progress === 0
?
"Start Learning"
:
"Continue"
}


</Link>



</div>


)

}
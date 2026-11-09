"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BookOpen,
  Bot,
  NotebookPen,
  User,
} from "lucide-react";


const items = [

{
name:"Dashboard",
href:"/dashboard",
icon:LayoutDashboard,
},

{
name:"Subjects",
href:"/subjects",
icon:BookOpen,
},

{
name:"Nova",
href:"/nova",
icon:Bot,
},

{
name:"Notebook",
href:"/notebook",
icon:NotebookPen,
},

{
name:"Profile",
href:"/profile",
icon:User,
},

];



export default function MobileBottomNav(){


const pathname = usePathname();


return (

<nav

className="
fixed
bottom-0
left-0
right-0
md:hidden
h-20
bg-[#111827]/95
backdrop-blur-xl
border-t
border-slate-800
z-50
flex
items-center
justify-around
px-3
"

>


{
items.map((item)=>{


const Icon = item.icon;

const active =
pathname === item.href;



return (

<Link

key={item.name}

href={item.href}

className={`
flex
flex-col
items-center
gap-1
text-xs
transition

${
active
?
"text-white"
:
"text-slate-400"
}

`}

>


<div

className={`
w-10
h-10
rounded-2xl
flex
items-center
justify-center

${
active
?
"bg-purple-500/20"
:
""
}

`}

>


<Icon size={21}/>


</div>


<span>
{item.name}
</span>


</Link>


)


})

}


</nav>

)

}
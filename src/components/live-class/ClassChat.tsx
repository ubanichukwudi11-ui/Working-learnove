"use client";

import {useState} from "react";

import {
Send,
Hand,
Pin
} from "lucide-react";


type Message = {
id:number;
user:string;
role:"student"|"teacher";
text:string;
important?:boolean;
};



export default function ClassChat(){


const [input,setInput]=useState("");

const [handRaised,setHandRaised]=useState(false);


const [messages,setMessages]=useState<Message[]>([

{
id:1,
user:"Mr James",
role:"teacher",
text:"Welcome everyone. Today we are learning Newton's Laws.",
important:true
}

]);



function sendMessage(){


if(!input.trim()) return;


setMessages(prev=>[

...prev,

{
id:Date.now(),
user:"You",
role:"student",
text:input
}

]);


setInput("");

}



function raiseHand(){

setHandRaised(true);


setMessages(prev=>[

...prev,

{
id:Date.now(),
user:"You",
role:"student",
text:"🙋 Raised hand"
}

]);


}



function announcement(){


setMessages(prev=>[

...prev,

{
id:Date.now(),
user:"Mr James",
role:"teacher",
text:"📢 Please open your notebooks. We will start the exercise now.",
important:true
}

])


}



return (

<div className="
bg-[#111827]
border
border-slate-800
rounded-2xl
h-[600px]
flex
flex-col
">


<div className="
p-4
border-b
border-slate-800
flex
justify-between
">


<h2 className="font-semibold">
Class Chat
</h2>


<button

onClick={raiseHand}

className="
flex
items-center
gap-2
bg-yellow-500/20
text-yellow-400
px-3
py-2
rounded-xl
text-sm
"

>

<Hand size={16}/>

{
handRaised
?
"Hand Raised"
:
"Raise Hand"
}

</button>


</div>




<div className="
flex-1
overflow-y-auto
p-4
space-y-4
">


{
messages.map(msg=>(


<div

key={msg.id}

className={`
flex
${msg.role==="student"
?
"justify-end"
:
"justify-start"}
`}

>


<div

className={`
rounded-2xl
px-4
py-3
max-w-[80%]

${
msg.role==="teacher"
?
"bg-purple-600"
:
"bg-slate-800"
}

`}

>


<div className="
flex
gap-2
items-center
text-xs
opacity-70
">

{msg.user}


{
msg.important &&
<Pin size={12}/>
}


</div>


<p>
{msg.text}
</p>


</div>


</div>


))

}


</div>




<div className="
p-4
border-t
border-slate-800
flex
gap-2
">


<input

value={input}

onChange={
e=>setInput(e.target.value)
}

onKeyDown={
e=>{
if(e.key==="Enter")
sendMessage()
}
}

placeholder="Ask a question..."

className="
flex-1
bg-slate-900
rounded-xl
px-4
"
/>



<button

onClick={sendMessage}

className="
bg-purple-600
px-4
rounded-xl
"

>

<Send size={18}/>

</button>


</div>



</div>


)

}
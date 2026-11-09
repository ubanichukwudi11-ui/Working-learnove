"use client";


type Props={

saving:boolean;

}



export default function SaveStatus({
saving
}:Props){



return (

<p

className="

text-xs

text-slate-400

"

>


{

saving

?

"Saving..."

:

"Saved ✓"

}


</p>


)

}
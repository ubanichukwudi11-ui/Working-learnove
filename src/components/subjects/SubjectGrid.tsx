import {subjects} from "@/data/subjects";

import SubjectCard from "./SubjectCard";


export default function SubjectGrid(){


return (

<section>


<h2
className="
text-xl
font-bold
mb-5
"
>
Your Subjects
</h2>



<div

className="
grid
sm:grid-cols-2
xl:grid-cols-3
gap-5
"

>


{
subjects.map((subject)=>(

<SubjectCard

key={subject.id}

subject={subject}

/>

))

}



</div>


</section>

)

}
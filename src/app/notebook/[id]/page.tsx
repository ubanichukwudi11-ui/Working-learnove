import AppLayout from "@/components/layout/AppLayout";

import NoteEditor from "@/components/notebook/NoteEditor";
import NovaNotebookPanel from "@/components/notebook/NovaNotebookPanel";


export default function NotePage({
params
}:{
params:{
id:string
}
}){


return (

<AppLayout>


<div

className="

min-h-screen

bg-[#0F172A]

text-white

grid

grid-cols-[1fr_320px]

gap-6

p-6

"

>


<main>

<NoteEditor

noteId={params.id}

/>

</main>



<NovaNotebookPanel/>




</div>


</AppLayout>

)

}
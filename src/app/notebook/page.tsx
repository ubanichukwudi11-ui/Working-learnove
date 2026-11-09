import AppLayout from "@/components/layout/AppLayout";

import NotebookSidebar from "@/components/notebook/NotebookSidebar";
import NotesArea from "@/components/notebook/NotesArea";
import NovaNotebookPanel from "@/components/notebook/NovaNotebookPanel";


export default function NotebookPage(){

return (

<AppLayout>


<div
className="
grid
grid-cols-[260px_1fr_320px]
gap-6
h-full
"
>


<NotebookSidebar/>


<main>

<NotesArea/>

</main>


<NovaNotebookPanel/>


</div>


</AppLayout>

)

}
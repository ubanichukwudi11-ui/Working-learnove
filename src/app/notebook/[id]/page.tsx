import AppLayout from "@/components/layout/AppLayout";

import NoteEditor from "@/components/notebook/NoteEditor";
import NovaNotebookPanel from "@/components/notebook/NovaNotebookPanel";


export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppLayout>
      <div className="min-h-screen text-[#0B1230] grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <main className="min-w-0">
          <NoteEditor noteId={id} />
        </main>
        <NovaNotebookPanel />
      </div>
    </AppLayout>
  );
}
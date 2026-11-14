"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { NotebookPen, Plus, Search, Trash2, Sparkles } from "lucide-react";
import {
  loadNotebookNotes,
  NOTEBOOK_FOLDERS,
  NOTEBOOK_STORAGE_KEY,
  type NotebookNoteItem,
} from "@frontend/lib/notebookStorage";

export default function NotebookPage() {
  const [notes, setNotes] = useState<NotebookNoteItem[]>([]);
  const [activeFolder, setActiveFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("Mathematics");
  const [content, setContent] = useState("");

  useEffect(() => {
    setNotes(loadNotebookNotes());
  }, []);

  const folders = ["All", ...NOTEBOOK_FOLDERS];

  const filteredNotes = notes.filter((n) => {
    const folderOk = activeFolder === "All" || n.folder === activeFolder;
    const q = search.toLowerCase();
    const searchOk =
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return folderOk && searchOk;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const item: NotebookNoteItem = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      folder,
      content: content.trim(),
      date: "Saved today",
    };
    const next = [item, ...notes];
    setNotes(next);
    try {
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setTitle("");
    setContent("");
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    try {
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Digital Study Notebook
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Class Notes &amp; Revision Summaries
            </h1>
          </div>

          <div className="flex gap-2">
            <Link
              href="/nova"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-[#0B1F3A] text-xs font-bold hover:bg-slate-50"
            >
              <Sparkles size={14} className="text-[#D97706]" />
              Open Nova Classroom AI
            </Link>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold"
            >
              <Plus size={15} />
              New Note
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeFolder === f
                    ? "bg-[#0B1F3A] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 sm:w-64">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent outline-none text-xs text-[#0F1F38] w-full"
            />
          </div>
        </div>

        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs"
          >
            <h2 className="text-base font-bold text-[#0B1F3A]">Create New Note</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Note title (e.g. Organic Chemistry Alkanes)"
                className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
              />
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
              >
                {NOTEBOOK_FOLDERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              placeholder="Write your revision notes..."
              className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] p-3.5 text-sm text-[#0F1F38]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold"
              >
                Save Note
              </button>
            </div>
          </form>
        )}

        {filteredNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-sm text-slate-500">
            No study notes found in this subject folder yet. Save notes directly from Video
            Lessons, Nova AI, or click New Note above.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0D9488] inline-flex items-center gap-1">
                      <NotebookPen size={13} />
                      {note.folder}
                    </span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      aria-label="Delete note"
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A] mt-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                  {note.date}
                  {note.sourceLabel ? ` · ${note.sourceLabel}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
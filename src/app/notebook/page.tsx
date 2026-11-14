"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { NotebookPen, Plus, Search, Trash2, Sparkles, Layers } from "lucide-react";
import {
  loadNotebookNotes,
  NOTEBOOK_FOLDERS,
  NOTEBOOK_STORAGE_KEY,
  type NotebookNoteItem,
} from "@frontend/lib/notebookStorage";
import FlashcardDeckModal, {
  type FlashcardItem,
} from "@frontend/components/common/FlashcardDeckModal";

export default function NotebookPage() {
  const [notes, setNotes] = useState<NotebookNoteItem[]>([]);
  const [activeFolder, setActiveFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("Mathematics");
  const [content, setContent] = useState("");
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckLoading, setDeckLoading] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckSubject, setDeckSubject] = useState("");
  const [deckCards, setDeckCards] = useState<FlashcardItem[]>([]);
  const [deckAi, setDeckAi] = useState(false);

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
        <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              Digital Study Notebook
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Class Notes &amp; Revision Summaries
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/nova"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition"
            >
              <Sparkles size={14} className="text-[#22D3EE]" />
              Open Nova Classroom AI
            </Link>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
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
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm"
                    : "bg-white border border-[#E4E1F5] text-[#43466E] hover:bg-[#FAF8FF]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#DCD7F5] focus-within:border-[#4F46E5] rounded-xl px-3.5 py-2 sm:w-64 transition">
            <Search size={15} className="text-[#6B6F94]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent outline-none text-xs text-[#0B1230] placeholder:text-[#6B6F94] w-full"
            />
          </div>
        </div>

        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="learnova-card p-6 space-y-4"
          >
            <h2 className="landing-display text-base font-bold text-[#0B1230]">
              Create New Note
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Note title (e.g. Organic Chemistry Alkanes)"
                className="learnova-input px-3.5 py-2.5 text-sm"
              />
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="learnova-input px-3.5 py-2.5 text-sm"
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
              className="learnova-input w-full p-3.5 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl border border-[#DCD7F5] text-xs font-semibold text-[#43466E] hover:bg-[#FAF8FF]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
              >
                Save Note
              </button>
            </div>
          </form>
        )}

        {filteredNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-[#DCD7F5] rounded-2xl p-12 text-center text-sm text-[#6B6F94]">
            No study notes found in this subject folder yet. Save notes directly from Video
            Lessons, Nova AI, or click New Note above.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="learnova-card p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4F46E5] inline-flex items-center gap-1">
                      <NotebookPen size={13} />
                      {note.folder}
                    </span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      aria-label="Delete note"
                      className="text-[#6B6F94] hover:text-rose-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="landing-display text-base font-bold text-[#0B1230] mt-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-[#43466E] mt-2 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E4E1F5] flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[#6B6F94] truncate">
                    {note.date}
                    {note.sourceLabel ? ` · ${note.sourceLabel}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setDeckTitle(note.title);
                      setDeckSubject(note.folder);
                      setDeckOpen(true);
                      setDeckLoading(true);
                      try {
                        const res = await fetch("/api/nova/flashcards", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: note.title,
                            subject: note.folder,
                            content: note.content,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setDeckCards(data.flashcards || []);
                          setDeckAi(Boolean(data.generatedByAi));
                        }
                      } finally {
                        setDeckLoading(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline shrink-0"
                  >
                    <Layers size={12} />
                    Flashcards
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FlashcardDeckModal
        open={deckOpen}
        onClose={() => setDeckOpen(false)}
        title={deckTitle}
        subject={deckSubject}
        cards={deckCards}
        loading={deckLoading}
        generatedByAi={deckAi}
      />
    </AppLayout>
  );
}
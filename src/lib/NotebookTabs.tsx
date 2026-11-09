export default function NotebookTabs() {
  return (
    <div className="flex flex-wrap gap-3">

      <button className="bg-indigo-600 text-white px-5 py-3 rounded-2xl">
        Teacher Notes
      </button>

      <button className="bg-white border px-5 py-3 rounded-2xl">
        My Notes
      </button>

      <button className="bg-white border px-5 py-3 rounded-2xl">
        Saved Lessons
      </button>

      <button className="bg-white border px-5 py-3 rounded-2xl">
        Flashcards
      </button>

    </div>
  );
}
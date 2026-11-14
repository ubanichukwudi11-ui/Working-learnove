export interface NotebookNoteItem {
  id: string;
  title: string;
  folder: string;
  content: string;
  date: string;
  sourceLabel?: string;
}

export const NOTEBOOK_STORAGE_KEY = "learnova_notes";

export const DEFAULT_NOTEBOOK_NOTES: NotebookNoteItem[] = [
  {
    id: "note-math-1",
    title: "Quadratic Equations & Discriminant Rules",
    folder: "Mathematics",
    content:
      "Standard form: ax² + bx + c = 0. Discriminant D = b² - 4ac. When D > 0, two distinct real roots exist. Vertex x = -b / (2a).",
    date: "Term 2 · Week 7",
  },
  {
    id: "note-phy-1",
    title: "Newton's Second Law & Impulse",
    folder: "Physics",
    content:
      "F = ma = (mv - mu) / t. Impulse I = F × t = change in momentum (kg·m/s).",
    date: "Term 2 · Week 6",
  },
];

export const NOTEBOOK_FOLDERS = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Further Mathematics",
  "General",
] as const;

export function normalizeNotebookFolder(subjectName?: string): string {
  const s = String(subjectName || "").trim();
  if (!s) return "General";
  const lower = s.toLowerCase();
  if (lower === "english") return "English Language";
  const exact = NOTEBOOK_FOLDERS.find((f) => f.toLowerCase() === lower);
  if (exact) return exact;
  const partial = NOTEBOOK_FOLDERS.find(
    (f) => lower.includes(f.toLowerCase()) || f.toLowerCase().includes(lower)
  );
  return partial || s;
}

export function loadNotebookNotes(): NotebookNoteItem[] {
  if (typeof window === "undefined") return DEFAULT_NOTEBOOK_NOTES;
  try {
    const raw = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTEBOOK_NOTES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_NOTEBOOK_NOTES;

    // Deduplicate while ensuring user notes come first and default starter notes remain if not deleted
    const seen = new Set<string>();
    const combined: NotebookNoteItem[] = [];
    for (const item of parsed) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push({
          ...item,
          folder: normalizeNotebookFolder(item.folder),
        });
      }
    }
    return combined.length > 0 ? combined : DEFAULT_NOTEBOOK_NOTES;
  } catch {
    return DEFAULT_NOTEBOOK_NOTES;
  }
}

export function saveNoteToNotebook(input: {
  title: string;
  folder?: string;
  content: string;
  sourceLabel?: string;
}): NotebookNoteItem {
  const existing = loadNotebookNotes();
  const note: NotebookNoteItem = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim() || "Study Note",
    folder: normalizeNotebookFolder(input.folder),
    content: input.content.trim(),
    date: new Date().toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    sourceLabel: input.sourceLabel,
  };
  const next = [note, ...existing];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return note;
}

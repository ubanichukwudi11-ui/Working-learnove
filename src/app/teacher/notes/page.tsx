"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { FileText, Plus, Download } from "lucide-react";

export default function TeacherNotesPage() {
  const [materials, setMaterials] = useState([
    {
      id: "m1",
      title: "Quadratic Equations & Discriminant Guide",
      subject: "Mathematics · SSS 2",
      updated: "Published Today · 08:15 AM WAT",
      summary: "Includes WAEC past question derivations, vertex coordinates, and parabola sketching steps.",
    },
    {
      id: "m2",
      title: "Newton's Laws & Linear Momentum Formula Sheet",
      subject: "Physics · SSS 2",
      updated: "Published Yesterday",
      summary: "Summary of impulse, conservation of momentum, and collision numericals.",
    },
  ]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics · SSS 2");
  const [summary, setSummary] = useState("");

  const publishNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    setMaterials((prev) => [
      {
        id: Date.now().toString(),
        title: title.trim(),
        subject,
        updated: "Published just now",
        summary: summary.trim(),
      },
      ...prev,
    ]);
    setTitle("");
    setSummary("");
  };

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Curriculum Materials
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Lesson Notes &amp; Study Guides
            </h1>
          </div>

          <form
            onSubmit={publishNote}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs"
          >
            <h2 className="text-base font-bold text-[#0B1F3A]">Publish New Lesson Material</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Document title"
                className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm"
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm"
              >
                <option>Mathematics · SSS 2</option>
                <option>Further Mathematics · SSS 3</option>
                <option>Physics · SSS 2</option>
                <option>Chemistry · SSS 3</option>
              </select>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              required
              placeholder="Key lesson notes or revision outline for students..."
              className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] p-3.5 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition"
            >
              <Plus size={15} />
              Publish Material
            </button>
          </form>

          <div className="grid md:grid-cols-2 gap-5">
            {materials.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="text-xs font-bold text-[#0D9488] inline-flex items-center gap-1">
                    <FileText size={13} />
                    {m.subject}
                  </span>
                  <h3 className="text-lg font-bold text-[#0B1F3A] mt-2">{m.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{m.summary}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{m.updated}</span>
                  <button
                    onClick={() => {
                      const blob = new Blob([`${m.title}\n${m.subject}\n\n${m.summary}`], {
                        type: "text/plain",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${m.title.replace(/\s+/g, "_")}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#0B1F3A] hover:text-[#0D9488]"
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

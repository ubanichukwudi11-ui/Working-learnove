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
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              Curriculum Materials
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Lesson Notes &amp; Study Guides
            </h1>
            <p className="text-sm text-[#C4B5FD] mt-1">
              Publish curriculum-aligned study outlines and downloadable revision sheets for your cohorts.
            </p>
          </div>

          <form
            onSubmit={publishNote}
            className="learnova-card p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-[#0B1230]">Publish New Lesson Material</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Document title"
                className="learnova-input text-sm"
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="learnova-input text-sm"
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
              className="learnova-input text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-xs"
            >
              <Plus size={15} />
              Publish Material
            </button>
          </form>

          <div className="grid md:grid-cols-2 gap-5">
            {materials.map((m) => (
              <div
                key={m.id}
                className="learnova-card p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[#4F46E5] inline-flex items-center gap-1.5">
                    <FileText size={13} />
                    {m.subject}
                  </span>
                  <h3 className="text-lg font-bold text-[#0B1230] mt-2">{m.title}</h3>
                  <p className="text-sm text-[#43466E] mt-2 leading-relaxed">{m.summary}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E4E1F5] flex items-center justify-between text-xs text-[#6B6F94]">
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
                    className="inline-flex items-center gap-1 font-bold text-[#0B1230] hover:text-[#4F46E5] transition"
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

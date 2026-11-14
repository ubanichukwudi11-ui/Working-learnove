"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_ACADEMIC_TERM, TIMEZONE_LABEL } from "@/lib/nigerianCurriculum";
import { Check, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [classLevel, setClassLevel] = useState("SSS 2 Science");
  const [examFocus, setExamFocus] = useState("WAEC & JAMB");
  const [lowDataDefault, setLowDataDefault] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "TEACHER", "ADMIN"]}>
      <AppLayout>
        <div className="max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
              Account &amp; Learning Preferences
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center shrink-0">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                {user?.fullName || "Learnova User"}
              </h2>
              <p className="text-sm text-slate-600">{user?.email}</p>
              <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                Role: {user?.role} · Timezone: {TIMEZONE_LABEL}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Class Level
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
                >
                  <option>JSS 1</option>
                  <option>JSS 2</option>
                  <option>JSS 3 (BECE)</option>
                  <option>SSS 1</option>
                  <option>SSS 2 Science</option>
                  <option>SSS 2 Arts / Commercial</option>
                  <option>SSS 3 (WAEC / NECO / JAMB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Examination Focus
                </label>
                <select
                  value={examFocus}
                  onChange={(e) => setExamFocus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#0F1F38]"
                >
                  <option>WAEC &amp; JAMB</option>
                  <option>NECO SSCE</option>
                  <option>BECE Junior Secondary</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lowDataDefault}
                onChange={(e) => setLowDataDefault(e.target.checked)}
                className="mt-0.5 accent-[#0D9488]"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A]">
                  Prefer Low-Bandwidth Audio-First Mode in Live Classes
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optimizes live sessions for 3G/4G mobile connections by prioritizing crystal-clear audio and presentation slides.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition"
              >
                Save Preferences
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0D9488]">
                  <Check size={15} />
                  Preferences saved
                </span>
              )}
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

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
          <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
              {CURRENT_ACADEMIC_TERM}
            </p>
            <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Account &amp; Learning Preferences
            </h1>
          </div>

          <div className="learnova-card p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-sm">
              <User size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="landing-display text-lg font-bold text-[#0B1230] truncate">
                {user?.fullName || "Learnova User"}
              </h2>
              <p className="text-sm text-[#43466E] truncate">{user?.email}</p>
              <p className="text-xs font-semibold text-[#4F46E5] mt-0.5">
                Role: {user?.role} · Timezone: {TIMEZONE_LABEL}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSave}
            className="learnova-card p-6 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                  Class Level
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="learnova-input w-full px-3.5 py-2.5 text-sm"
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
                <label className="block text-xs font-semibold text-[#43466E] mb-1.5">
                  Examination Focus
                </label>
                <select
                  value={examFocus}
                  onChange={(e) => setExamFocus(e.target.value)}
                  className="learnova-input w-full px-3.5 py-2.5 text-sm"
                >
                  <option>WAEC &amp; JAMB</option>
                  <option>NECO SSCE</option>
                  <option>BECE Junior Secondary</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={lowDataDefault}
                onChange={(e) => setLowDataDefault(e.target.checked)}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1230]">
                  Prefer Low-Bandwidth Audio-First Mode in Live Classes
                </p>
                <p className="text-xs text-[#6B6F94] mt-0.5">
                  Optimizes live sessions for 3G/4G mobile connections by prioritizing crystal-clear audio and presentation slides.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-sm"
              >
                Save Preferences
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
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

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { sanitizePostAuthRedirect } from "@/lib/appUrl";
import Logo from "@/components/branding/Logo";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

function computeAgeFromDob(dobValue: string): string {
  if (!dobValue) return "";
  const birth = new Date(dobValue);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return years >= 5 && years <= 100 ? String(years) : "";
}

export default function CompleteStudentProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser, logout } = useAuth();

  const [schoolName, setSchoolName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [examPreparation, setExamPreparation] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [studyTime, setStudyTime] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "STUDENT") {
      router.replace(getDashboardRoute(user.role));
      return;
    }
    if (user.schoolName && !schoolName) setSchoolName(user.schoolName);
    if (user.classLevel && !classLevel) setClassLevel(user.classLevel);
    if (user.dob && !dob) setDob(user.dob);
    if (user.age && !age) setAge(String(user.age));
    if (user.examPreparation && !examPreparation) {
      setExamPreparation(user.examPreparation);
    }
    if (user.studyHours && !studyHours) setStudyHours(user.studyHours);
    if (user.studyTime && !studyTime) setStudyTime(user.studyTime);
    if (user.learningGoal && !learningGoal) setLearningGoal(user.learningGoal);
  }, [loading, user, router, schoolName, classLevel, dob, age, examPreparation, studyHours, studyTime, learningGoal]);

  if (loading || !user || user.role !== "STUDENT") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)]">
        <div className="text-center space-y-2.5">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#4F46E5] border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-[var(--foreground-muted)]">
            Loading your Google account details...
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleanSchool = schoolName.trim();
    const numericAge = age.trim() ? Number(age.trim()) : undefined;
    const cleanDob = dob.trim();

    if (!cleanSchool) {
      setError("Please enter your school name.");
      return;
    }
    if (!classLevel) {
      setError("Please select your current class level.");
      return;
    }
    if (!numericAge && !cleanDob) {
      setError("Please enter your age or date of birth.");
      return;
    }
    if (numericAge !== undefined && (Number.isNaN(numericAge) || numericAge < 5 || numericAge > 100)) {
      setError("Please enter a valid age between 5 and 100.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: cleanSchool,
          classLevel,
          dob: cleanDob || undefined,
          age: numericAge,
          examPreparation: examPreparation.trim() || undefined,
          studyHours: studyHours || undefined,
          studyTime: studyTime || undefined,
          learningGoal: learningGoal.trim() || undefined,
          profileCompleted: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Could not save your student profile.");
      }

      await refreshUser();

      let nextDest = "/dashboard";
      try {
        const storedNext = sessionStorage.getItem("learnova_post_auth_next");
        sessionStorage.removeItem("learnova_post_auth_next");
        nextDest = sanitizePostAuthRedirect(storedNext, "/dashboard");
      } catch {}

      router.replace(nextDest);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save your student profile."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender py-10 px-4 sm:px-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl learnova-card shadow-xl">
        <div className="learnova-banner-dark bg-architectural-grid-dark px-6 py-8 sm:px-10 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <Logo dark href="/" variant="learnova" />
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="text-xs font-semibold text-indigo-200 hover:text-white transition"
            >
              Use a different account
            </button>
          </div>
          <h1 className="landing-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Complete Your Student Profile
          </h1>
          <p className="mt-2 text-sm text-indigo-100/80 max-w-xl">
            Your Google identity is verified below. Complete your academic details so we can assign the right class level and curriculum.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Section 1: Verified Google Account Details */}
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/30 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="landing-display text-base font-extrabold text-[var(--foreground)] flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Verified Google Account Information
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Automatically imported and locked from your Google account.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                <Lock size={12} />
                Google Verified
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Full Name (Verified)
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400"
                  />
                  <input
                    type="text"
                    value={user.fullName}
                    readOnly
                    className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-[var(--surface)] py-2.5 pl-10 pr-3.5 text-sm font-semibold text-[var(--foreground)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400"
                  />
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-[var(--surface)] py-2.5 pl-10 pr-3.5 text-sm font-semibold text-[var(--foreground)] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Student-Supplied Academic Profile */}
          <section className="space-y-5">
            <div className="border-b border-[var(--border)] pb-3">
              <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2">
                <GraduationCap size={20} className="text-indigo-600 dark:text-indigo-400" />
                Student-Supplied Academic Information
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Tell us your school, class level, and age/date of birth to tailor your timetable and subjects.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  School Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                  />
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. King's College, Lagos"
                    className="learnova-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Class Level <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="learnova-input"
                >
                  <option value="">Select Class Level</option>
                  {CLASS_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Target Exam Focus
                </label>
                <select
                  value={examPreparation}
                  onChange={(e) => setExamPreparation(e.target.value)}
                  className="learnova-input"
                >
                  <option value="">Select Goal (Optional)</option>
                  <option value="WAEC SSCE">WAEC SSCE</option>
                  <option value="NECO">NECO</option>
                  <option value="JAMB UTME">JAMB UTME</option>
                  <option value="BECE Junior Secondary">BECE Junior Secondary</option>
                  <option value="Termly School Mastery">Termly School Mastery</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Date of Birth <span className="text-[11px] font-normal text-[var(--foreground-subtle)]">(or enter Age)</span>
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                  />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDob(val);
                      const derived = computeAgeFromDob(val);
                      if (derived) setAge(derived);
                    }}
                    className="learnova-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Age (Years) <span className="text-[11px] font-normal text-[var(--foreground-subtle)]">(required if DOB blank)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 15"
                  className="learnova-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Daily Study Commitment
                </label>
                <select
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  className="learnova-input"
                >
                  <option value="">Select Hours (Optional)</option>
                  <option value="Less than 1 hour">Less than 1 hour</option>
                  <option value="1 - 2 Hours">1 - 2 Hours</option>
                  <option value="2 - 4 Hours">2 - 4 Hours</option>
                  <option value="4 - 6 Hours">4 - 6 Hours</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Preferred Study Window
                </label>
                <select
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                  className="learnova-input"
                >
                  <option value="">Select Time (Optional)</option>
                  <option value="Early Morning">Early Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Academic Goal (Optional)
                </label>
                <textarea
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="Example: Build mastery in Further Mathematics and score top marks in WAEC."
                  className="learnova-input"
                />
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-4 flex items-start gap-3 text-xs text-[var(--foreground-muted)]">
            <Sparkles size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your account stays protected with privacy-first student fields. Paid live classrooms and subject packages remain gated until you activate a subscription on the Subscriptions page.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 text-sm font-bold text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving Academic Profile...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Complete Setup &amp; Open Student Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

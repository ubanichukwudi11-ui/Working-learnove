"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Calendar,
  Building2,
  Upload,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import { loginWithGoogle, registerStudent } from "@/lib/auth";
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

export default function StudentRegistrationPage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    schoolName: "",
    classLevel: "",
    age: "",
    profilePhoto: "",
    aiPurpose: [] as string[],
    examPreparation: "",
    favouriteSubjects: [] as string[],
    learningStyle: [] as string[],
    studyHours: "",
    studyTime: "",
    learningGoal: "",
    reminders: "",
  });

  function updateField(key: keyof typeof form, value: string | string[]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function uploadPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    if (!isSupabaseConfigured) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file);

    if (error) {
      setError(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-images").getPublicUrl(fileName);

    updateField("profilePhoto", publicUrl);
  }

  async function handleGoogleStudentSignup() {
    try {
      setError("");
      setGoogleLoading(true);
      await loginWithGoogle("/register/student/complete");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Google registration."
      );
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await registerStudent({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        schoolName: form.schoolName,
        classLevel: form.classLevel,
        age: form.age ? Number(form.age) : undefined,
        profilePhoto: form.profilePhoto,
        aiPurpose: form.aiPurpose,
        examPreparation: form.examPreparation,
        favouriteSubjects: form.favouriteSubjects,
        learningStyle: form.learningStyle,
        studyHours: form.studyHours,
        studyTime: form.studyTime,
        learningGoal: form.learningGoal,
        reminders: form.reminders,
      });

      if (created.requiresEmailConfirmation) {
        setConfirmationEmail(created.email || form.email);
        return;
      }

      saveUser(created);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "learnova-input w-full py-3 pl-11 pr-4 text-sm";
  const selectClass =
    "learnova-input w-full p-3 text-sm";

  return (
    <main className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender py-10 px-4 sm:px-6 text-[var(--foreground)]">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl learnova-card shadow-xl">
        <div className="learnova-banner-dark bg-architectural-grid-dark px-6 py-8 sm:px-10 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <Logo dark href="/" variant="learnova" />
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] hover:text-white transition"
            >
              <ArrowLeft size={14} />
              All account types
            </Link>
          </div>
          <h1 className="landing-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Student Registration
          </h1>
          <p className="mt-1.5 text-sm text-indigo-100/80 max-w-xl">
            Personalize your Learnova campus profile and let Nova AI tailor your study experience.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {!confirmationEmail && (
            <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-lavender)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  Quick Student Sign-Up with Google
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Prefills your verified Google name and email, then asks only for your school, class level, and age.
                </p>
              </div>
              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={handleGoogleStudentSignup}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:border-[#7C3AED] transition shrink-0 disabled:opacity-60"
              >
                {googleLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="h-4 w-4"
                    />
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          )}

          {confirmationEmail ? (
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] p-8 text-center space-y-4">
              <CheckCircle2 size={42} className="mx-auto text-cyan-600 dark:text-cyan-400" />
              <h2 className="landing-display text-xl font-extrabold text-[var(--foreground)]">
                Confirm Your Email Address
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                We sent a verification link to <strong>{confirmationEmail}</strong>. Click the link in your inbox to activate your Learnova student account, then sign in.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] px-6 py-3 text-sm font-bold text-white shadow-sm transition"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture */}
            <div>
              <label className="mb-3 block text-sm font-bold text-[var(--foreground)]">
                Profile Picture{" "}
                <span className="ml-1.5 text-xs font-normal text-[var(--foreground-subtle)]">
                  (Optional)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-lavender)]">
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={34} className="text-[var(--foreground-subtle)]" />
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 px-4 py-2.5 text-xs font-bold text-violet-700 dark:text-violet-300 transition">
                  <Upload size={16} />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Adaobi Okafor"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="student@school.edu.ng"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Create password"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Class
                </label>
                <div className="relative">
                  <GraduationCap
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <select
                    value={form.classLevel}
                    onChange={(e) => updateField("classLevel", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Class</option>
                    <option>Primary 1</option>
                    <option>Primary 2</option>
                    <option>Primary 3</option>
                    <option>Primary 4</option>
                    <option>Primary 5</option>
                    <option>Primary 6</option>
                    <option>JSS1</option>
                    <option>JSS2</option>
                    <option>JSS3</option>
                    <option>SS1</option>
                    <option>SS2</option>
                    <option>SS3</option>
                    <option>University</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  School Name
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <input
                    required
                    value={form.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                    placeholder="e.g. Queen's College, Lagos"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Age
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                    size={17}
                  />
                  <input
                    type="number"
                    required
                    min={5}
                    max={100}
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="e.g. 15"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Study Habits */}
            <div className="border-t border-[var(--border)] pt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  How many hours do you study daily?
                </label>
                <select
                  value={form.studyHours}
                  onChange={(e) => updateField("studyHours", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select</option>
                  <option>Less than 1 hour</option>
                  <option>1 - 2 Hours</option>
                  <option>2 - 4 Hours</option>
                  <option>4 - 6 Hours</option>
                  <option>More than 6 Hours</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Best Time To Study
                </label>
                <select
                  value={form.studyTime}
                  onChange={(e) => updateField("studyTime", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select</option>
                  <option>Early Morning</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                  <option>Late Night</option>
                </select>
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                What is your biggest learning goal?
              </label>
              <textarea
                rows={3}
                value={form.learningGoal}
                onChange={(e) => updateField("learningGoal", e.target.value)}
                placeholder="Example: I want to score above 320 in JAMB and gain admission into UNILAG."
                className="learnova-input w-full p-3.5 text-sm"
              />
            </div>

            {/* Reminders */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                Daily Study Reminder?
              </label>
              <select
                value={form.reminders}
                onChange={(e) => updateField("reminders", e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                <option>YES</option>
                <option>NO</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 text-sm font-bold text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Creating Account...
                </>
              ) : (
                "Create Student Account"
              )}
            </button>
          </form>
          )}

          <div className="mt-7 text-center text-xs text-[var(--foreground-muted)]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
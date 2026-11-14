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
  Upload,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { registerStudent, login as authLogin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

export default function StudentRegistrationPage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerStudent({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        classLevel: form.classLevel,
        age: Number(form.age),
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

      const loggedInUser = await authLogin(form.email, form.password);
      if (loggedInUser) {
        saveUser(loggedInUser);
      }

      router.push("/dashboard");
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
    "w-full rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] py-3 pl-11 pr-4 text-sm text-[#0B1230] placeholder:text-[#6B6F94] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15";
  const selectClass =
    "w-full rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] p-3 text-sm text-[#0B1230] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15";

  return (
    <main className="min-h-screen bg-[#F5F4FB] bg-learnova-dots-lavender py-10 px-4 sm:px-6 text-[#0B1230]">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#E4E1F5] bg-white shadow-xl shadow-[#0B1230]/6">
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
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture */}
            <div>
              <label className="mb-3 block text-sm font-bold text-[#0B1230]">
                Profile Picture{" "}
                <span className="ml-1.5 text-xs font-normal text-[#6B6F94]">
                  (Optional)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#DCD7F5] bg-[#FAF8FF]">
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={34} className="text-[#6B6F94]" />
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#DCD7F5] bg-[#F5F3FF] px-4 py-2.5 text-xs font-bold text-[#6D28D9] hover:bg-[#EDE9FE] transition">
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Class
                </label>
                <div className="relative">
                  <GraduationCap
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Age
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                    size={17}
                  />
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="e.g. 15"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Study Habits */}
            <div className="border-t border-[#E4E1F5] pt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
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
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
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
              <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                What is your biggest learning goal?
              </label>
              <textarea
                rows={3}
                value={form.learningGoal}
                onChange={(e) => updateField("learningGoal", e.target.value)}
                placeholder="Example: I want to score above 320 in JAMB and gain admission into UNILAG."
                className="w-full rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] p-3.5 text-sm text-[#0B1230] placeholder:text-[#6B6F94] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
              />
            </div>

            {/* Reminders */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
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

          <div className="mt-7 text-center text-xs text-[#43466E]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[#6D28D9] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
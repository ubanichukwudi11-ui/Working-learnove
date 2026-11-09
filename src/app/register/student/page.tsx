"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Calendar,
  Upload,
  Loader2,
} from "lucide-react";

import { registerStudent } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const AI_PURPOSES = [
  "Homework",
  "Assignments",
  "WAEC",
  "NECO",
  "JAMB",
  "University",
  "Coding",
  "Research",
  "Skill Learning",
];

const SUBJECTS = [
  "Mathematics",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature",
  "Geography",
  "Computer Science",
];

const LEARNING_STYLES = [
  "Videos",
  "AI Tutor",
  "Practice Questions",
  "Flashcards",
  "Reading Notes",
  "Quizzes",
  "Past Questions",
  "Live Classes",
];

export default function StudentRegistrationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

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

  function updateField(
    key: keyof typeof form,
    value: any
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleArrayValue(
    key:
      | "aiPurpose"
      | "favouriteSubjects"
      | "learningStyle",
    value: string
  ) {
    const values = form[key];

    if (values.includes(value)) {
      updateField(
        key,
        values.filter((v) => v !== value)
      );
    } else {
      updateField(key, [...values, value]);
    }
  }

  async function uploadPhoto(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("profile-images")
      .getPublicUrl(fileName);

    updateField("profilePhoto", publicUrl);
  }

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await registerStudent({
        fullName: form.fullName,

        email: form.email,

        password: form.password,

        classLevel: form.classLevel,

        age: Number(form.age),

        profilePhoto: form.profilePhoto,

        aiPurpose: form.aiPurpose,

        examPreparation:
          form.examPreparation,

        favouriteSubjects:
          form.favouriteSubjects,

        learningStyle:
          form.learningStyle,

        studyHours:
          form.studyHours,

        studyTime:
          form.studyTime,

        learningGoal:
          form.learningGoal,

        reminders:
          form.reminders,
      });

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 py-10 px-5 text-white">

      <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-8">

        <h1 className="text-4xl font-bold mb-2">
          Student Registration
        </h1>

        <p className="text-slate-400 mb-10">
          Tell Nova about yourself so your AI
          experience can be personalized.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

                      {/* Profile Picture */}

          <div>

            <label className="mb-3 block text-lg font-semibold">
              Profile Picture
              <span className="ml-2 text-sm font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <div className="flex items-center gap-6">

              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">

                {preview ? (
                  <Image
                    src={preview}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-slate-500" />
                )}

              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-cyan-600 px-5 py-3 hover:bg-cyan-700">

                <Upload size={18} />

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

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block">
                Full Name
              </label>

              <div className="relative">

                <User className="absolute left-4 top-4 text-slate-500" size={18} />

                <input
                  value={form.fullName}
                  onChange={(e) =>
                    updateField("fullName", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block">
                Email
              </label>

              <div className="relative">

                <Mail className="absolute left-4 top-4 text-slate-500" size={18} />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block">
                Password
              </label>

              <div className="relative">

                <Lock className="absolute left-4 top-4 text-slate-500" size={18} />

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    updateField("password", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block">
                Class
              </label>

              <div className="relative">

                <GraduationCap className="absolute left-4 top-4 text-slate-500" size={18} />

                <select
                  value={form.classLevel}
                  onChange={(e) =>
                    updateField("classLevel", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4"
                >
                  <option value="">
                    Select Class
                  </option>

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

              <label className="mb-2 block">
                Age
              </label>

              <div className="relative">

                <Calendar className="absolute left-4 top-4 text-slate-500" size={18} />

                <input
                  type="number"
                  value={form.age}
                  onChange={(e) =>
                    updateField("age", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4"
                />

              </div>

            </div>

          </div>

          {/* STOP HERE */}
          
                    {/* STUDY HABITS */}

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block font-semibold">
                How many hours do you study daily?
              </label>

              <select
                value={form.studyHours}
                onChange={(e) =>
                  updateField(
                    "studyHours",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
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

              <label className="mb-2 block font-semibold">
                Best Time To Study
              </label>

              <select
                value={form.studyTime}
                onChange={(e) =>
                  updateField(
                    "studyTime",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
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

          {/* GOAL */}

          <div>

            <label className="mb-2 block font-semibold">
              What is your biggest learning goal?
            </label>

            <textarea
              rows={4}
              value={form.learningGoal}
              onChange={(e) =>
                updateField(
                  "learningGoal",
                  e.target.value
                )
              }
              placeholder="Example: I want to score above 320 in JAMB and gain admission into UNILAG."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4"
            />

          </div>

          {/* REMINDERS */}

          <div>

            <label className="mb-2 block font-semibold">
              Daily Study Reminder?
            </label>

            <select
              value={form.reminders}
              onChange={(e) =>
                updateField(
                  "reminders",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
            >
              <option value="">Select</option>

              <option>YES</option>

              <option>NO</option>

            </select>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  className="mr-2 animate-spin"
                  size={20}
                />
                Creating Account...
              </>
            ) : (
              "Create Student Account"
            )}
          </button>

        </form>

      </div>

    </main>

  );

}
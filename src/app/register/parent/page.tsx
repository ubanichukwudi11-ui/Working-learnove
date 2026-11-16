"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Users,
  Hash,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { registerParent, login as authLogin } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

export default function ParentRegistrationPage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    studentName: "",
    childIdNumber: "",
    relationship: "Mother",
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerParent({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        studentName: form.studentName,
        childIdNumber: form.childIdNumber,
        relationship: form.relationship,
      });

      const user = await authLogin(form.email, form.password);
      if (user) {
        saveUser(user);
      }

      router.push("/parent");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create parent account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#DCD7F5] bg-[#FAF8FF] py-3 pl-11 pr-4 text-sm text-[#0B1230] placeholder:text-[#6B6F94] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15";

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
            Parent / Guardian Registration
          </h1>
          <p className="mt-1.5 text-sm text-indigo-100/80 max-w-xl">
            Monitor your child&apos;s academic progress, term attendance, and continuous assessment scores on Learnova.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Parent / Guardian Name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                    size={17}
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="parent@example.com"
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
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Create a password"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                    size={17}
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+234 800 000 0000"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E1F5] pt-6">
              <h2 className="landing-display text-lg font-extrabold mb-4 text-[#0B1230] flex items-center gap-2">
                <GraduationCap className="text-[#4F46E5]" size={20} />
                Student Information
              </h2>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                    Child&apos;s Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                      size={17}
                    />
                    <input
                      required
                      type="text"
                      value={form.studentName}
                      onChange={(e) => updateField("studentName", e.target.value)}
                      placeholder="Student's full name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                    Student ID Number
                  </label>
                  <div className="relative">
                    <Hash
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                      size={17}
                    />
                    <input
                      required
                      type="text"
                      value={form.childIdNumber}
                      onChange={(e) => updateField("childIdNumber", e.target.value)}
                      placeholder="e.g. STU-2024-001"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#0B1230]">
                    Relationship
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6F94]"
                      size={17}
                    />
                    <select
                      value={form.relationship}
                      onChange={(e) => updateField("relationship", e.target.value)}
                      className={inputClass}
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 text-sm font-bold text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating Parent Account...
                </>
              ) : (
                <>
                  Create Parent Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 text-center text-xs text-[#43466E]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#6D28D9] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

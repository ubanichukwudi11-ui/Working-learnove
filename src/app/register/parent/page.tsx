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
  CheckCircle2,
} from "lucide-react";

import { registerParent } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/branding/Logo";

export default function ParentRegistrationPage() {
  const router = useRouter();
  const { login: saveUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

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
      const created = await registerParent({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        studentName: form.studentName,
        childIdNumber: form.childIdNumber,
        relationship: form.relationship,
      });

      if (created.requiresEmailConfirmation) {
        setConfirmationEmail(created.email || form.email);
        return;
      }

      saveUser(created);
      router.push("/parent");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create parent account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "learnova-input w-full py-3 pl-11 pr-4 text-sm";

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
            Parent / Guardian Registration
          </h1>
          <p className="mt-1.5 text-sm text-indigo-100/80 max-w-xl">
            Monitor your child&apos;s academic progress, term attendance, and continuous assessment scores on Learnova.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {confirmationEmail ? (
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] p-8 text-center space-y-4">
              <CheckCircle2 size={42} className="mx-auto text-cyan-600 dark:text-cyan-400" />
              <h2 className="landing-display text-xl font-extrabold text-[var(--foreground)]">
                Confirm Your Email Address
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                We sent a verification link to <strong>{confirmationEmail}</strong>. Click the link in your inbox to activate your parent account, then sign in.
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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
                <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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

            <div className="border-t border-[var(--border)] pt-6">
              <h2 className="landing-display text-lg font-extrabold mb-4 text-[var(--foreground)] flex items-center gap-2">
                <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={20} />
                Student Information
              </h2>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                    Child&apos;s Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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
                  <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                    Student ID Number
                  </label>
                  <div className="relative">
                    <Hash
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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
                  <label className="mb-1.5 block text-xs font-bold text-[var(--foreground)]">
                    Relationship
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
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
          )}

          <div className="mt-7 text-center text-xs text-[var(--foreground-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

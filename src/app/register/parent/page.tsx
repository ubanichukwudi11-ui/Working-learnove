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
} from "lucide-react";

import { registerParent, login as authLogin } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

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
    } catch (err: any) {
      setError(err?.message || "Failed to create parent account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 py-10 px-5 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="mb-8">
          <Link
            href="/register"
            className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 mb-4"
          >
            ← Back to account types
          </Link>
          <h1 className="text-4xl font-bold mb-2">Parent Registration</h1>
          <p className="text-slate-400">
            Monitor your child's academic progress, attendance, and test scores on Learnova.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Parent / Guardian Name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              <GraduationCap className="text-emerald-400" size={22} />
              Student Information
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Child's Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="text"
                    value={form.studentName}
                    onChange={(e) => updateField("studentName", e.target.value)}
                    placeholder="Student's full name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Student ID Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="text"
                    value={form.childIdNumber}
                    onChange={(e) => updateField("childIdNumber", e.target.value)}
                    placeholder="e.g. STU-2024-001"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Relationship
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <select
                    value={form.relationship}
                    onChange={(e) => updateField("relationship", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-12 pr-4 text-white focus:border-cyan-500 focus:outline-none"
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating Parent Account...
              </>
            ) : (
              <>
                Create Parent Account
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

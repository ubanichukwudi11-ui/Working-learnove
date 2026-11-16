"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { registerTeacher } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import Logo from "@/components/branding/Logo";

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",

    country: "",
    state: "",
    dob: "",

    phone: "",
    address: "",
    gender: "",

    subject: "",
    qualification: "",
    institution: "",
    experience: "",
    licenseNumber: "",

    profilePhoto: "",
    certificate: "",
    degreeCertificate: "",
    governmentId: "",
    cv: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof form
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const url = await uploadFile(file, field);

      setForm((prev) => ({
        ...prev,
        [field]: url,
      }));
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : `Failed to upload ${field}.`;
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      await registerTeacher(form);

      setSuccessMsg(
        "Application submitted successfully! Please wait for admin verification. Redirecting..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit teacher registration.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4FB] bg-learnova-dots-lavender text-[#0B1230] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="overflow-hidden bg-white border border-[#E4E1F5] rounded-3xl shadow-xl shadow-[#0B1230]/6">
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
              Teacher Application &amp; Registration
            </h1>
            <p className="mt-1.5 text-sm text-indigo-100/80 max-w-xl">
              Complete your educator profile and upload required verification credentials for school admin review.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-9">
              {/* PERSONAL */}
              <Section title="Personal Information">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />

                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <Input
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                />

                <Input
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />

                <Input
                  label="Date Of Birth"
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />

                <Input
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[#0B1230]">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-[#FAF8FF] border border-[#DCD7F5] p-3 text-sm text-[#0B1230] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </Section>

              {/* ACADEMIC */}
              <Section title="Academic Information">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[#0B1230]">
                    Primary Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl bg-[#FAF8FF] border border-[#DCD7F5] p-3 text-sm text-[#0B1230] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English Language">English Language</option>
                    <option value="Biology">Biology</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                    <option value="Economics">Economics</option>
                    <option value="Government">Government</option>
                    <option value="Literature in English">Literature in English</option>
                    <option value="Further Mathematics">Further Mathematics</option>
                  </select>
                </div>

                <Input
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                />

                <Input
                  label="Institution"
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                />

                <Input
                  label="Experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                />

                <Input
                  label="Teaching License Number"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                />
              </Section>

              {/* DOCUMENTS */}
              <Section title="Upload Documents">
                <FileInput
                  label="Profile Picture"
                  onChange={(e) => handleFileUpload(e, "profilePhoto")}
                />

                <FileInput
                  label="Teaching Certificate"
                  onChange={(e) => handleFileUpload(e, "certificate")}
                />

                <FileInput
                  label="Degree Certificate"
                  onChange={(e) => handleFileUpload(e, "degreeCertificate")}
                />

                <FileInput
                  label="Government ID"
                  onChange={(e) => handleFileUpload(e, "governmentId")}
                />

                <FileInput
                  label="CV / Resume"
                  onChange={(e) => handleFileUpload(e, "cv")}
                />
              </Section>

              {(uploading || loading) && (
                <div className="text-sm text-[#6D28D9] font-semibold">
                  {uploading
                    ? "Uploading documents..."
                    : "Submitting application..."}
                </div>
              )}

              <button
                disabled={uploading || loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 font-bold text-sm text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-50"
              >
                Submit Application
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
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#E4E1F5] pt-6 first:border-t-0 first:pt-0">
      <h2 className="landing-display text-lg font-extrabold text-[#0B1230] mb-4">
        {title}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-bold text-[#0B1230]">
        {label}
      </label>

      <input
        {...props}
        required
        className="w-full rounded-xl bg-[#FAF8FF] border border-[#DCD7F5] p-3 text-sm text-[#0B1230] placeholder:text-[#6B6F94] outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/15"
      />
    </div>
  );
}

type FileInputProps = {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function FileInput({ label, onChange }: FileInputProps) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-bold text-[#0B1230]">
        {label}
      </label>

      <input
        type="file"
        required
        onChange={onChange}
        className="w-full rounded-xl bg-[#FAF8FF] border border-[#DCD7F5] p-2.5 text-xs text-[#43466E] file:mr-3 file:rounded-lg file:border-0 file:bg-[#EDE9FE] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#6D28D9] hover:file:bg-[#DDD6FE]"
      />
    </div>
  );
}
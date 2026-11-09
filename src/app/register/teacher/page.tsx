"use client";

import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { registerTeacher } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
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

      const url = await uploadFile(
        file,
        field
      );

      setForm((prev) => ({
        ...prev,
        [field]: url,
      }));

      alert(`${field} uploaded successfully.`);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await registerTeacher(form);

      alert(
        "Application submitted successfully.\n\nPlease wait for admin verification."
      );

      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white py-12 px-5">
      <div className="max-w-6xl mx-auto">

        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8">

          <h1 className="text-4xl font-bold mb-2">
            Teacher Registration
          </h1>

          <p className="text-slate-400 mb-10">
            Complete your profile and upload
            all required documents.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-10"
          >

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
                <label className="block mb-2">
                  Gender
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3"
                  required
                >
                  <option value="">
                    Select Gender
                  </option>

                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>

            </Section>

            {/* ACADEMIC */}

            <Section title="Academic Information">

              <Input
                label="Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
              />

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
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    "profilePhoto"
                  )
                }
              />

              <FileInput
                label="Teaching Certificate"
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    "certificate"
                  )
                }
              />

              <FileInput
                label="Degree Certificate"
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    "degreeCertificate"
                  )
                }
              />

              <FileInput
                label="Government ID"
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    "governmentId"
                  )
                }
              />

              <FileInput
                label="CV / Resume"
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    "cv"
                  )
                }
              />

            </Section>

            {(uploading || loading) && (
              <div className="text-cyan-400 font-semibold">
                {uploading
                  ? "Uploading documents..."
                  : "Submitting application..."}
              </div>
            )}

            <button
              disabled={
                uploading || loading
              }
              className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-500 py-4 font-bold text-lg"
            >
              Submit Application
            </button>

          </form>

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
    <div>
      <h2 className="text-2xl font-bold mb-5">
        {title}
      </h2>

      <div className="grid md:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  );
}

type InputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  };

function Input({
  label,
  ...props
}: InputProps) {
  return (
    <div>
      <label className="block mb-2">
        {label}
      </label>

      <input
        {...props}
        required
        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3"
      />
    </div>
  );
}

type FileInputProps = {
  label: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

function FileInput({
  label,
  onChange,
}: FileInputProps) {
  return (
    <div>
      <label className="block mb-2">
        {label}
      </label>

      <input
        type="file"
        required
        onChange={onChange}
        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3"
      />
    </div>
  );
}
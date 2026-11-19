"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileCheck2, Loader2 } from "lucide-react";

import { registerTeacher } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import Logo from "@/components/branding/Logo";

interface CatalogSubject {
  id: string;
  code: string;
  name: string;
  department?: string;
  classLevelIds?: string[];
}

interface CatalogClassLevel {
  id: string;
  code: string;
  name: string;
}

const FALLBACK_SUBJECTS: CatalogSubject[] = [
  { id: "sub-math", code: "MTH", name: "Mathematics", department: "Core" },
  { id: "sub-eng", code: "ENG", name: "English Language", department: "Core" },
  { id: "sub-bio", code: "BIO", name: "Biology", department: "Science" },
  { id: "sub-chem", code: "CHM", name: "Chemistry", department: "Science" },
  { id: "sub-phy", code: "PHY", name: "Physics", department: "Science" },
  { id: "sub-econ", code: "ECO", name: "Economics", department: "Commercial" },
  { id: "sub-gov", code: "GOV", name: "Government", department: "Arts" },
  { id: "sub-lit", code: "LIT", name: "Literature in English", department: "Arts" },
  { id: "sub-fmath", code: "FMT", name: "Further Mathematics", department: "Science" },
];

const FALLBACK_LEVELS: CatalogClassLevel[] = [
  { id: "lvl-jss1", code: "JSS1", name: "Junior Secondary 1 (JSS 1)" },
  { id: "lvl-jss2", code: "JSS2", name: "Junior Secondary 2 (JSS 2)" },
  { id: "lvl-jss3", code: "JSS3", name: "Junior Secondary 3 (JSS 3)" },
  { id: "lvl-ss1", code: "SS1", name: "Senior Secondary 1 (SS 1)" },
  { id: "lvl-ss2", code: "SS2", name: "Senior Secondary 2 (SS 2)" },
  { id: "lvl-ss3", code: "SS3", name: "Senior Secondary 3 (SS 3)" },
];

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [catalogSubjects, setCatalogSubjects] =
    useState<CatalogSubject[]>(FALLBACK_SUBJECTS);
  const [catalogLevels, setCatalogLevels] =
    useState<CatalogClassLevel[]>(FALLBACK_LEVELS);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([
    "sub-math",
  ]);
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([
    "lvl-jss1",
    "lvl-jss2",
    "lvl-jss3",
  ]);

  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",

    country: "Nigeria",
    state: "",
    dob: "",

    phone: "",
    address: "",
    gender: "",

    qualification: "",
    institution: "",
    experience: "",
    licenseNumber: "",
    bio: "",

    profilePhoto: "",
    certificate: "",
    degreeCertificate: "",
    governmentId: "",
    cv: "",
  });

  useEffect(() => {
    fetch("/api/lms/academics?public=catalog", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subjects?.length) setCatalogSubjects(data.subjects);
        if (data?.classLevels?.length) setCatalogLevels(data.classLevels);
      })
      .catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleLevel = (id: string) => {
    setSelectedLevelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field:
      | "profilePhoto"
      | "certificate"
      | "degreeCertificate"
      | "governmentId"
      | "cv"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(field);
      setError("");

      const folder = field === "certificate" ? "teachingCertificate" : field;
      const url = await uploadFile(file, folder);

      setForm((prev) => ({
        ...prev,
        [field]: url,
      }));
      setUploadedNames((prev) => ({ ...prev, [field]: file.name }));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : `Failed to upload ${field}.`;
      setError(msg);
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedSubjectIds.length === 0) {
      setError("Please select at least one teaching subject.");
      return;
    }
    if (selectedLevelIds.length === 0) {
      setError("Please select at least one class level you are qualified to teach.");
      return;
    }
    if (!form.certificate) {
      setError("Please upload your Teaching Certificate or Accreditation proof.");
      return;
    }
    if (!form.degreeCertificate) {
      setError("Please upload your Academic Degree Certificate.");
      return;
    }

    const chosenSubjectObjs = catalogSubjects.filter((s) =>
      selectedSubjectIds.includes(s.id)
    );
    const chosenSubjectNames = chosenSubjectObjs.map((s) => s.name);

    try {
      setLoading(true);

      const created = await registerTeacher({
        ...form,
        subject: chosenSubjectNames[0] || "Mathematics",
        subjects: chosenSubjectNames,
        classLevelIds: selectedLevelIds,
        subjectApplications: selectedSubjectIds.map((subjectId) => ({
          subjectId,
          classLevelIds: selectedLevelIds,
        })),
        teachingCertificate: form.certificate,
      });

      setSuccessMsg(
        created.requiresEmailConfirmation
          ? "Application submitted! Confirm your email address while School Administration verifies your documents."
          : "Application submitted! Redirecting to your Educator Verification Portal..."
      );

      setTimeout(() => {
        router.push(
          created.requiresEmailConfirmation
            ? "/login?registered=teacher"
            : "/teacher/applications"
        );
      }, 1500);
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
    <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="overflow-hidden learnova-card rounded-3xl shadow-xl">
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
              Educator Registration &amp; Accreditation
            </h1>
            <p className="mt-1.5 text-sm text-indigo-100/80 max-w-2xl">
              Submit your academic qualifications, preferred teaching subjects and class levels, and credential documents for School Administrator verification.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={18} />
                {successMsg}
              </div>
            )}

            <div className="mb-7 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] px-5 py-4 text-xs text-[var(--foreground-muted)] leading-relaxed">
              <strong className="text-[var(--foreground)]">Approval Required Before Classroom Access:</strong>{" "}
              New educator accounts start in <strong>Pending Approval</strong> status. Once a School Administrator inspects your uploaded certificates and assigns your verified subjects and class levels, your educator workspace and timetable slots will unlock automatically.
            </div>

            <form onSubmit={handleSubmit} className="space-y-9">
              {/* PERSONAL */}
              <Section title="Personal Information">
                <Input
                  label="Full Name"
                  name="fullName"
                  placeholder="e.g. Mrs. Funke Adebayo"
                  value={form.fullName}
                  onChange={handleChange}
                />

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="educator@school.edu.ng"
                  value={form.email}
                  onChange={handleChange}
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  placeholder="+234 800 000 0000"
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
                  label="State of Residence"
                  name="state"
                  placeholder="e.g. Lagos"
                  value={form.state}
                  onChange={handleChange}
                />

                <Input
                  label="Date Of Birth"
                  type="date"
                  name="dob"
                  required={false}
                  value={form.dob}
                  onChange={handleChange}
                />

                <Input
                  label="Residential Address"
                  name="address"
                  required={false}
                  value={form.address}
                  onChange={handleChange}
                />

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--foreground)]">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="learnova-input w-full p-3 text-sm"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
              </Section>

              {/* ACADEMIC & TEACHING SCOPE */}
              <div className="border-t border-[var(--border)] pt-6 space-y-5">
                <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                  Qualifications &amp; Teaching Scope
                </h2>

                <div>
                  <label className="block mb-2 text-xs font-bold text-[var(--foreground)]">
                    Subjects You Are Qualified to Teach (Select one or more)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {catalogSubjects.map((sub) => {
                      const active = selectedSubjectIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleSubject(sub.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            active
                              ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-[#4F46E5] shadow-xs"
                              : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[#4F46E5]"
                          }`}
                        >
                          {active ? "✓ " : ""}
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-bold text-[var(--foreground)]">
                    Preferred Class Levels (Select JSS / SSS cohorts)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {catalogLevels.map((lvl) => {
                      const active = selectedLevelIds.includes(lvl.id);
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => toggleLevel(lvl.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            active
                              ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                              : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[#4F46E5]"
                          }`}
                        >
                          {active ? "✓ " : ""}
                          {lvl.code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Highest Academic Qualification"
                    name="qualification"
                    placeholder="e.g. B.Sc. (Ed.) Mathematics, PGDE"
                    value={form.qualification}
                    onChange={handleChange}
                  />

                  <Input
                    label="Awarding Institution"
                    name="institution"
                    placeholder="e.g. University of Lagos"
                    value={form.institution}
                    onChange={handleChange}
                  />

                  <Input
                    label="Teaching Experience"
                    name="experience"
                    placeholder="e.g. 6 years WAEC & JAMB prep"
                    value={form.experience}
                    onChange={handleChange}
                  />

                  <Input
                    label="Teaching License / TRCN Number (Optional)"
                    name="licenseNumber"
                    required={false}
                    placeholder="e.g. TRCN/LAG/2023/10492"
                    value={form.licenseNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--foreground)]">
                    Short Educator Bio &amp; Teaching Approach
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Summarize your teaching philosophy, exam prep experience, and classroom strengths..."
                    className="learnova-input w-full p-3 text-sm"
                  />
                </div>
              </div>

              {/* DOCUMENTS */}
              <Section title="Verification Documents">
                <FileInput
                  label="Teaching Certificate (Required)"
                  required
                  uploadedName={uploadedNames.certificate}
                  uploading={uploadingField === "certificate"}
                  onChange={(e) => handleFileUpload(e, "certificate")}
                />

                <FileInput
                  label="Academic Degree Certificate (Required)"
                  required
                  uploadedName={uploadedNames.degreeCertificate}
                  uploading={uploadingField === "degreeCertificate"}
                  onChange={(e) => handleFileUpload(e, "degreeCertificate")}
                />

                <FileInput
                  label="Curriculum Vitae / Resume (Optional)"
                  uploadedName={uploadedNames.cv}
                  uploading={uploadingField === "cv"}
                  onChange={(e) => handleFileUpload(e, "cv")}
                />

                <FileInput
                  label="Profile Photo (Optional)"
                  uploadedName={uploadedNames.profilePhoto}
                  uploading={uploadingField === "profilePhoto"}
                  onChange={(e) => handleFileUpload(e, "profilePhoto")}
                />

                <FileInput
                  label="TRCN Card / Identification (Optional)"
                  uploadedName={uploadedNames.governmentId}
                  uploading={uploadingField === "governmentId"}
                  onChange={(e) => handleFileUpload(e, "governmentId")}
                />
              </Section>

              {(uploadingField || loading) && (
                <div className="flex items-center gap-2 text-sm text-[#4F46E5] dark:text-[#A5B4FC] font-semibold">
                  <Loader2 size={16} className="animate-spin" />
                  {uploadingField
                    ? "Encrypting and uploading verification file..."
                    : "Submitting your educator application..."}
                </div>
              )}

              <button
                type="submit"
                disabled={Boolean(uploadingField) || loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 font-bold text-sm text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-50"
              >
                Submit Educator Application
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-[var(--foreground-muted)]">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:underline">
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
    <div className="border-t border-[var(--border)] pt-6 first:border-t-0 first:pt-0">
      <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)] mb-4">
        {title}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Input({ label, required = true, ...props }: InputProps) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-bold text-[var(--foreground)]">
        {label}
      </label>

      <input
        required={required}
        {...props}
        className="learnova-input w-full p-3 text-sm"
      />
    </div>
  );
}

type FileInputProps = {
  label: string;
  required?: boolean;
  uploadedName?: string;
  uploading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function FileInput({
  label,
  required = false,
  uploadedName,
  uploading = false,
  onChange,
}: FileInputProps) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-bold text-[var(--foreground)]">
        {label}
      </label>

      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
        required={required && !uploadedName}
        onChange={onChange}
        className="w-full rounded-xl bg-[var(--surface-lavender)] border border-[var(--border-strong)] p-2.5 text-xs text-[var(--foreground-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 dark:file:bg-violet-950/60 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-200 dark:hover:file:bg-violet-900/60"
      />

      {uploading ? (
        <p className="mt-1 text-[11px] font-semibold text-[#4F46E5] dark:text-[#A5B4FC]">
          Uploading securely...
        </p>
      ) : uploadedName ? (
        <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
          <FileCheck2 size={12} />
          Uploaded: {uploadedName}
        </p>
      ) : null}
    </div>
  );
}
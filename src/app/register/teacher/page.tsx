"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { registerTeacher } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import Logo from "@/components/branding/Logo";

type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  department: string;
  classLevelIds: string[];
};

type CatalogLevel = {
  id: string;
  code: string;
  name: string;
};

const FALLBACK_LEVELS: CatalogLevel[] = [
  { id: "lvl-jss1", code: "JSS1", name: "Junior Secondary 1 (JSS 1)" },
  { id: "lvl-jss2", code: "JSS2", name: "Junior Secondary 2 (JSS 2)" },
  { id: "lvl-jss3", code: "JSS3", name: "Junior Secondary 3 (JSS 3)" },
  { id: "lvl-ss1", code: "SS1", name: "Senior Secondary 1 (SS 1)" },
  { id: "lvl-ss2", code: "SS2", name: "Senior Secondary 2 (SS 2)" },
  { id: "lvl-ss3", code: "SS3", name: "Senior Secondary 3 (SS 3)" },
];

const ALL_LEVEL_IDS = FALLBACK_LEVELS.map((l) => l.id);
const SSS_LEVEL_IDS = ["lvl-ss1", "lvl-ss2", "lvl-ss3"];

const FALLBACK_SUBJECTS: CatalogSubject[] = [
  { id: "sub-math", code: "MTH", name: "Mathematics", department: "Core", classLevelIds: ALL_LEVEL_IDS },
  { id: "sub-eng", code: "ENG", name: "English Language", department: "Core", classLevelIds: ALL_LEVEL_IDS },
  { id: "sub-bio", code: "BIO", name: "Biology", department: "Science", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-chem", code: "CHM", name: "Chemistry", department: "Science", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-phy", code: "PHY", name: "Physics", department: "Science", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-econ", code: "ECO", name: "Economics", department: "Commercial", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-gov", code: "GOV", name: "Government", department: "Arts", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-lit", code: "LIT", name: "Literature in English", department: "Arts", classLevelIds: SSS_LEVEL_IDS },
  { id: "sub-fmath", code: "FMT", name: "Further Mathematics", department: "Science", classLevelIds: SSS_LEVEL_IDS },
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submittedState, setSubmittedState] = useState<{
    message: string;
    requiresEmailConfirmation?: boolean;
  } | null>(null);

  const [subjects, setSubjects] = useState<CatalogSubject[]>(FALLBACK_SUBJECTS);
  const [classLevels, setClassLevels] = useState<CatalogLevel[]>(FALLBACK_LEVELS);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(["sub-math"]);
  const [selectedClassLevelIds, setSelectedClassLevelIds] = useState<string[]>([
    "lvl-ss1",
    "lvl-ss2",
    "lvl-ss3",
  ]);

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
    fetch("/api/lms/academics?public=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.subjects?.length) setSubjects(json.subjects);
        if (json?.classLevels?.length) setClassLevels(json.classLevels);
      })
      .catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleClassLevel(id: string) {
    setSelectedClassLevelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "certificate" | "degreeCertificate" | "governmentId" | "cv",
    imageOnly = false
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" exceeds the 10 MB upload limit.`);
      return;
    }

    if (imageOnly && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      setError("Profile picture must be a PNG, JPG, or WEBP image.");
      return;
    }

    try {
      setUploadingField(field);
      setError("");
      const url = await uploadFile(file, field);
      setForm((prev) => ({
        ...prev,
        [field]: url,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to upload ${field}.`;
      setError(msg);
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedSubjectIds.length === 0) {
      setError("Please select at least one subject you are qualified to teach.");
      return;
    }
    if (selectedClassLevelIds.length === 0) {
      setError("Please select at least one class level (JSS1–SS3).");
      return;
    }
    if (!form.certificate || !form.degreeCertificate || !form.governmentId || !form.cv) {
      setError(
        "Please upload all four verification documents (Teaching Certificate, Degree Certificate, Government ID, and CV)."
      );
      return;
    }

    try {
      setLoading(true);
      const selectedSubjects = subjects.filter((s) =>
        selectedSubjectIds.includes(s.id)
      );
      const subjectApplications = selectedSubjects.map((s) => ({
        subjectId: s.id,
        classLevelIds: selectedClassLevelIds,
      }));

      const created = await registerTeacher({
        ...form,
        subject: selectedSubjects.map((s) => s.name).join(", ") || "Mathematics",
        subjectApplications,
      });

      setSubmittedState({
        requiresEmailConfirmation: created.requiresEmailConfirmation,
        message: created.requiresEmailConfirmation
          ? "Your educator application has been submitted! Confirm your email address first, then sign in anytime to monitor your verification status while School Administration reviews your credentials."
          : "Your educator application has been submitted and is pending School Administration verification. Once approved, your Educator Dashboard and live classrooms will unlock.",
      });
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

  if (submittedState) {
    return (
      <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)] flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl learnova-glass-panel p-8 sm:p-10 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Application Queued · Pending Verification
            </p>
            <h1 className="landing-display text-2xl font-extrabold text-[var(--foreground)]">
              Educator Credentials Submitted
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              {submittedState.message}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-xs text-[var(--foreground-muted)] space-y-1.5">
            <p className="font-bold text-[var(--foreground)]">What happens next?</p>
            <p>1. School Administration reviews your degree, teaching certificate, ID, and CV.</p>
            <p>2. Your requested subjects &amp; class levels are verified and approved.</p>
            <p>3. You will receive an email &amp; in-app notification as soon as teaching access activates.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shadow-sm transition"
            >
              Sign In to Track Status
            </button>
            <Link
              href="/"
              className="px-5 py-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-lavender)] transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
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
              Educator Accreditation &amp; Registration
            </h1>
            <p className="mt-1.5 text-sm text-indigo-100/80 max-w-2xl">
              Apply to join Learnova&apos;s verified teaching faculty. Select your teaching subjects, class levels, and upload your qualification documents for administrator verification.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="mb-7 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] px-5 py-4 text-xs text-[var(--foreground-muted)] leading-relaxed flex items-start gap-3">
              <GraduationCap size={18} className="text-[#4F46E5] dark:text-[#A5B4FC] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--foreground)]">Administrator Verification Policy:</strong>{" "}
                Educator accounts start in <strong>Pending Verification</strong> state. Teacher accounts cannot register via Google sign-up. Teaching studios, timetable rooms, and student cohorts unlock only after School Administration approves your credentials.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-9">
              {/* PERSONAL */}
              <Section title="1. Personal & Account Details">
                <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
                <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} />
                <Input label="Password (min. 8 characters)" type="password" name="password" minLength={8} value={form.password} onChange={handleChange} />
                <Input label="Phone Number" name="phone" placeholder="+234 800 000 0000" value={form.phone} onChange={handleChange} />
                <Input label="Country" name="country" value={form.country} onChange={handleChange} />
                <Input label="State of Residence" name="state" placeholder="e.g. Lagos" value={form.state} onChange={handleChange} />
                <Input label="Date of Birth" type="date" name="dob" value={form.dob} onChange={handleChange} />
                <Input label="Residential Address" name="address" value={form.address} onChange={handleChange} />

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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </Section>

              {/* ACADEMIC & SUBJECT SCOPE */}
              <div className="border-t border-[var(--border)] pt-6 space-y-5">
                <div>
                  <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                    2. Academic Qualifications &amp; Teaching Scope
                  </h2>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                    Select one or more Nigerian syllabus subjects and the class levels you are qualified to teach.
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-bold text-[var(--foreground)]">
                    Subjects Applied to Teach ({selectedSubjectIds.length} selected)
                  </label>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {subjects.map((sub) => {
                      const active = selectedSubjectIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleSubject(sub.id)}
                          className={`text-left rounded-xl border p-3 transition flex items-center justify-between gap-2 ${
                            active
                              ? "border-[#4F46E5] bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 text-[var(--foreground)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{sub.name}</p>
                            <p className="text-[11px] text-[var(--foreground-subtle)]">
                              {sub.code} · {sub.department}
                            </p>
                          </div>
                          {active && (
                            <CheckCircle2 size={16} className="text-[#4F46E5] dark:text-[#A5B4FC] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-bold text-[var(--foreground)]">
                    Class Levels Covered ({selectedClassLevelIds.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {classLevels.map((lvl) => {
                      const active = selectedClassLevelIds.includes(lvl.id);
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => toggleClassLevel(lvl.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            active
                              ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-transparent shadow-xs"
                              : "bg-[var(--surface-lavender)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
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
                    label="Years of Teaching Experience"
                    name="experience"
                    placeholder="e.g. 6 years WAEC/JAMB coaching"
                    value={form.experience}
                    onChange={handleChange}
                  />
                  <Input
                    label="TRCN / Teaching License Number (Optional)"
                    name="licenseNumber"
                    required={false}
                    placeholder="e.g. TRCN/2023/10492"
                    value={form.licenseNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--foreground)]">
                    Professional Teaching Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    required
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Summarize your teaching philosophy, WAEC/NECO/JAMB exam preparation track record, and classroom approach..."
                    className="learnova-input w-full p-3 text-sm"
                  />
                </div>
              </div>

              {/* DOCUMENTS */}
              <div className="border-t border-[var(--border)] pt-6 space-y-4">
                <div>
                  <h2 className="landing-display text-lg font-extrabold text-[var(--foreground)]">
                    3. Verification Evidence &amp; Credentials
                  </h2>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                    Accepted formats: PDF, PNG, JPG, WEBP, DOC, or DOCX (max 10 MB per file). Stored privately for administrator review only.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FileUploadCard
                    label="Profile Photo (Optional · PNG/JPG)"
                    accept="image/png,image/jpeg,image/webp"
                    uploaded={Boolean(form.profilePhoto)}
                    uploading={uploadingField === "profilePhoto"}
                    required={false}
                    onChange={(e) => handleFileUpload(e, "profilePhoto", true)}
                  />
                  <FileUploadCard
                    label="Teaching Certificate / TRCN / PGDE *"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    uploaded={Boolean(form.certificate)}
                    uploading={uploadingField === "certificate"}
                    required
                    onChange={(e) => handleFileUpload(e, "certificate")}
                  />
                  <FileUploadCard
                    label="University / Degree Certificate *"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    uploaded={Boolean(form.degreeCertificate)}
                    uploading={uploadingField === "degreeCertificate"}
                    required
                    onChange={(e) => handleFileUpload(e, "degreeCertificate")}
                  />
                  <FileUploadCard
                    label="Government-Issued ID (NIN / Passport / Driver's License) *"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    uploaded={Boolean(form.governmentId)}
                    uploading={uploadingField === "governmentId"}
                    required
                    onChange={(e) => handleFileUpload(e, "governmentId")}
                  />
                  <FileUploadCard
                    label="Curriculum Vitae (CV / Resume) *"
                    accept=".pdf,.doc,.docx"
                    uploaded={Boolean(form.cv)}
                    uploading={uploadingField === "cv"}
                    required
                    onChange={(e) => handleFileUpload(e, "cv")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={Boolean(uploadingField) || loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] py-3.5 font-bold text-sm text-white shadow-md shadow-[#4F46E5]/20 transition disabled:opacity-50"
              >
                {uploadingField
                  ? "Uploading verification file..."
                  : loading
                  ? "Submitting Educator Application..."
                  : "Submit Application for Verification"}
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-[var(--foreground-muted)]">
              Already applied or have an educator account?{" "}
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

function FileUploadCard({
  label,
  accept,
  uploaded,
  uploading,
  required,
  onChange,
}: {
  label: string;
  accept: string;
  uploaded: boolean;
  uploading: boolean;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-[var(--foreground)]">{label}</label>
        {uploading ? (
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Upload size={12} className="animate-pulse" /> Uploading...
          </span>
        ) : uploaded ? (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <FileCheck2 size={13} /> Uploaded
          </span>
        ) : null}
      </div>
      <input
        type="file"
        accept={accept}
        required={required && !uploaded}
        onChange={onChange}
        className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] p-2 text-xs text-[var(--foreground-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 dark:file:bg-violet-950/60 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-200 dark:hover:file:bg-violet-900/60"
      />
    </div>
  );
}
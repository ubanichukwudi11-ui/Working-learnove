"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  getTeacherById,
  approveTeacher,
  rejectTeacher,
} from "@/lib/auth";
import TeacherProfileCard from "@/components/admin/teacher-review/TeacherProfileCard";
import VerificationScore from "@/components/admin/teacher-review/VerificationScore";
import PersonalInfoCard from "@/components/admin/teacher-review/PersonalInfoCard";
import AcademicInfoCard from "@/components/admin/teacher-review/AcademicInfoCard";
import DocumentsGrid from "@/components/admin/teacher-review/DocumentsGrid";
import { ArrowLeft } from "lucide-react";

const FALLBACK_PACKET: Record<string, any> = {
  "teacher-funke": {
    id: "teacher-funke",
    fullName: "Mrs. Funke Adewale",
    email: "funke.adewale@learnova.ng",
    role: "TEACHER",
    status: "ACTIVE",
    subject: "Mathematics",
    qualification: "M.Ed Mathematics",
    institution: "University of Ibadan",
    experience: "9 Years",
    phone: "+234 803 412 8821",
    country: "Nigeria",
    state: "Lagos",
    licenseNumber: "TRCN/LAG/2018/04921",
  },
  "teacher-chinedu": {
    id: "teacher-chinedu",
    fullName: "Mr. Chinedu Emeka",
    email: "chinedu.emeka@learnova.ng",
    role: "TEACHER",
    status: "PENDING",
    subject: "Physics",
    qualification: "B.Sc Physics Education",
    institution: "University of Nigeria, Nsukka",
    experience: "6 Years",
    phone: "+234 805 901 4412",
    country: "Nigeria",
    state: "Enugu",
    licenseNumber: "TRCN/ENU/2020/11842",
  },
  "teacher-ibrahim": {
    id: "teacher-ibrahim",
    fullName: "Dr. Ibrahim Bello",
    email: "ibrahim.bello@learnova.ng",
    role: "TEACHER",
    status: "ACTIVE",
    subject: "Chemistry",
    qualification: "Ph.D Industrial Chemistry",
    institution: "Ahmadu Bello University, Zaria",
    experience: "11 Years",
    phone: "+234 809 321 7740",
    country: "Nigeria",
    state: "FCT Abuja",
    licenseNumber: "TRCN/FCT/2016/00781",
  },
};

export default function TeacherReviewPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <TeacherReviewWorkspace />
    </ProtectedRoute>
  );
}

function TeacherReviewWorkspace() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [identityChecked, setIdentityChecked] = useState(false);
  const [qualificationChecked, setQualificationChecked] = useState(false);
  const [documentsChecked, setDocumentsChecked] = useState(false);
  const [experienceChecked, setExperienceChecked] = useState(false);
  const [interviewChecked, setInterviewChecked] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    async function loadTeacher() {
      try {
        const data = await getTeacherById(id);
        setTeacher(data || FALLBACK_PACKET[id] || null);
      } catch {
        setTeacher(FALLBACK_PACKET[id] || null);
      } finally {
        setLoading(false);
      }
    }
    loadTeacher();
  }, [id]);

  const score = useMemo(() => {
    let value = 0;
    if (identityChecked) value += 20;
    if (qualificationChecked) value += 20;
    if (documentsChecked) value += 20;
    if (experienceChecked) value += 20;
    if (interviewChecked) value += 20;
    return value;
  }, [
    identityChecked,
    qualificationChecked,
    documentsChecked,
    experienceChecked,
    interviewChecked,
  ]);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-sm text-slate-500">
          Loading verification packet...
        </div>
      </AppLayout>
    );
  }

  if (!teacher) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
            <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
              Teacher Packet Not Found
            </h1>
            <p className="text-sm text-slate-600">
              The requested educator verification record could not be located.
            </p>
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
            >
              <ArrowLeft size={14} />
              Back to Teachers
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const canApprove = score === 100;

  const handleApprove = async () => {
    if (!canApprove) {
      setFeedback("Please complete all 5 checklist verifications before approving.");
      return;
    }
    await approveTeacher(teacher.id);
    setFeedback("Educator approved successfully. Redirecting to directory...");
    setTimeout(() => router.push("/admin/teachers"), 1200);
  };

  const handleReject = async () => {
    await rejectTeacher(teacher.id);
    setConfirmReject(false);
    setFeedback("Application declined. Redirecting...");
    setTimeout(() => router.push("/admin/teachers"), 1200);
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <div>
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline mb-2"
          >
            <ArrowLeft size={14} />
            Back to Teacher Management
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
            Educator Verification Packet
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect identity, TRCN licensing, degrees, and academic credentials before granting live classroom access.
          </p>
        </div>

        {feedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            {feedback}
          </div>
        )}

        <TeacherProfileCard teacher={teacher} />
        <VerificationScore score={score} />
        <PersonalInfoCard teacher={teacher} />
        <AcademicInfoCard teacher={teacher} />
        <DocumentsGrid teacher={teacher} />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Verification Checklist</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <CheckItem label="Identity Verified" checked={identityChecked} onChange={setIdentityChecked} />
            <CheckItem label="Qualification & Degree Verified" checked={qualificationChecked} onChange={setQualificationChecked} />
            <CheckItem label="TRCN & Supporting Documents Checked" checked={documentsChecked} onChange={setDocumentsChecked} />
            <CheckItem label="Teaching Experience Confirmed" checked={experienceChecked} onChange={setExperienceChecked} />
            <CheckItem label="Demo Lesson & Interview Passed" checked={interviewChecked} onChange={setInterviewChecked} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Reviewer Notes</h2>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Record TRCN check details or interview remarks..."
            className="w-full h-32 rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 text-sm text-[#0B1F3A] outline-none focus:border-[#0D9488] resize-none"
          />
        </div>

        {teacher.status === "PENDING" && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleApprove}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition ${
                canApprove
                  ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                  : "bg-slate-200 text-slate-600 cursor-not-allowed"
              }`}
            >
              Approve Teacher (Requires 100%)
            </button>

            {!confirmReject ? (
              <button
                onClick={() => setConfirmReject(true)}
                className="px-6 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
              >
                Decline Application
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2">
                <span className="text-xs font-semibold text-rose-800">Confirm rejection?</span>
                <button
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmReject(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F7F8FA] px-4 py-3 cursor-pointer hover:border-[#0D9488] transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#0D9488]"
      />
      <span className="text-xs font-bold text-[#0B1F3A]">{label}</span>
    </label>
  );
}
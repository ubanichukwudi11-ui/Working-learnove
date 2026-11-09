"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

export default function TeacherReviewPage() {
  const params = useParams();

  const router = useRouter();

  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    async function loadTeacher() {
      const data = await getTeacherById(params.id as string);
      setTeacher(data);
    }

    loadTeacher();
  }, [params.id]);

  const [
    identityChecked,
    setIdentityChecked,
  ] = useState(false);

  const [
    qualificationChecked,
    setQualificationChecked,
  ] = useState(false);

  const [
    documentsChecked,
    setDocumentsChecked,
  ] = useState(false);

  const [
    experienceChecked,
    setExperienceChecked,
  ] = useState(false);

  const [
    interviewChecked,
    setInterviewChecked,
  ] = useState(false);

  const [adminNote, setAdminNote] =
    useState("");

  const score = useMemo(() => {
    let value = 0;

    if (identityChecked) value += 20;
    if (qualificationChecked)
      value += 20;
    if (documentsChecked) value += 20;
    if (experienceChecked)
      value += 20;
    if (interviewChecked) value += 20;

    return value;
  }, [
    identityChecked,
    qualificationChecked,
    documentsChecked,
    experienceChecked,
    interviewChecked,
  ]);

  if (!teacher) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center">
            <h1 className="text-3xl font-bold">
              Teacher Not Found
            </h1>

            <p className="text-slate-400 mt-3">
              The requested teacher
              application does not exist.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const canApprove =
    score === 100;

  const handleApprove = async () => {
    if (!canApprove) {
      alert(
        "Complete every verification before approving."
      );

      return;
    }

    await approveTeacher(teacher.id);

    alert(
      "Teacher approved successfully."
    );

    router.push("/admin/teachers");
  };

  const handleReject = async () => {
    if (
      !confirm(
        "Reject this teacher application?"
      )
    ) {
      return;
    }

    await rejectTeacher(teacher.id);

    alert(
      "Teacher rejected."
    );

    router.push("/admin/teachers");
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl font-bold">
            Teacher Verification
          </h1>

          <p className="text-slate-400 mt-2">
            Verify teacher identity,
            qualifications and uploaded
            documents before approval.
          </p>
        </div>

        <TeacherProfileCard
          teacher={teacher}
        />

        <VerificationScore
          score={score}
        />

        <PersonalInfoCard
          teacher={teacher}
        />

        <AcademicInfoCard
          teacher={teacher}
        />

        <DocumentsGrid
          teacher={teacher}
        />

        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8">

          <h2 className="text-2xl font-bold mb-6">
            Verification Checklist
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            <CheckItem
              label="Identity Verified"
              checked={
                identityChecked
              }
              onChange={
                setIdentityChecked
              }
            />

            <CheckItem
              label="Qualification Verified"
              checked={
                qualificationChecked
              }
              onChange={
                setQualificationChecked
              }
            />

            <CheckItem
              label="Documents Verified"
              checked={
                documentsChecked
              }
              onChange={
                setDocumentsChecked
              }
            />

            <CheckItem
              label="Experience Verified"
              checked={
                experienceChecked
              }
              onChange={
                setExperienceChecked
              }
            />

            <CheckItem
              label="Interview Passed"
              checked={
                interviewChecked
              }
              onChange={
                setInterviewChecked
              }
            />

          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8">

          <h2 className="text-2xl font-bold mb-5">
            Admin Notes
          </h2>

          <textarea
            value={adminNote}
            onChange={(e) =>
              setAdminNote(
                e.target.value
              )
            }
            placeholder="Write internal notes..."
            className="
            w-full
            h-40
            rounded-2xl
            bg-slate-900
            border
            border-slate-700
            p-5
            outline-none
            resize-none
            "
          />

        </div>

        {teacher.status ===
          "PENDING" && (
          <div className="flex flex-wrap gap-5 pb-10">

            <button
              onClick={handleApprove}
              disabled={!canApprove}
              className={`
                px-8
                py-4
                rounded-2xl
                font-semibold
                transition

                ${
                  canApprove
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-slate-700 cursor-not-allowed"
                }
              `}
            >
              Approve Teacher
            </button>

            <button
              onClick={handleReject}
              className="
                px-8
                py-4
                rounded-2xl
                bg-red-600
                hover:bg-red-500
                font-semibold
              "
            >
              Reject Teacher
            </button>

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
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label
      className="
      flex
      items-center
      gap-4
      bg-slate-900
      rounded-2xl
      p-5
      cursor-pointer
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
        className="w-5 h-5"
      />

      <span className="font-medium">
        {label}
      </span>
    </label>
  );
}
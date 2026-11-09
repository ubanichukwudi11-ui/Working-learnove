"use client";

import { RegisterData } from "../hooks/useRegisterState";

type Props = {
  data: RegisterData;
  updateData: (
    field: keyof RegisterData,
    value: string | string[]
  ) => void;
  errors: Record<string, string>;
};

const SUBJECTS = [
  "Math",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
];

export default function StepLearningProfile({
  data,
  updateData,
  errors,
}: Props) {
  const toggleSubject = (
    subject: string
  ) => {
    const exists =
      data.subjects.includes(subject);

    if (exists) {
      updateData(
        "subjects",
        data.subjects.filter(
          (item) => item !== subject
        )
      );
    } else {
      updateData("subjects", [
        ...data.subjects,
        subject,
      ]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-slate-300 mb-2">
          What are you preparing for?
        </label>

        <select
          value={data.examType}
          onChange={(e) =>
            updateData(
              "examType",
              e.target.value
            )
          }
          className={`
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border
            text-white
            focus:outline-none
            ${
              errors.examType
                ? "border-red-500"
                : "border-slate-700 focus:border-[#6D28D9]"
            }
          `}
        >
          <option value="">
            Select Exam Type
          </option>

          <option value="JAMB">
            JAMB
          </option>

          <option value="WAEC">
            WAEC
          </option>

          <option value="NECO">
            NECO
          </option>

          <option value="School Exams">
            School Exams
          </option>

          <option value="General Learning">
            General Learning
          </option>
        </select>

        {errors.examType && (
          <p className="text-red-400 text-sm mt-2">
            {errors.examType}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Current Level
        </label>

        <select
          value={data.level}
          onChange={(e) =>
            updateData("level", e.target.value)
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
            focus:outline-none
            focus:border-[#6D28D9]
          "
        >
          <option value="">
            Select Level
          </option>

          <option value="JSS1">
            JSS1
          </option>

          <option value="JSS2">
            JSS2
          </option>

          <option value="JSS3">
            JSS3
          </option>

          <option value="SSS1">
            SSS1
          </option>

          <option value="SSS2">
            SSS2
          </option>

          <option value="SSS3">
            SSS3
          </option>

          <option value="Graduate Prep">
            Graduate Prep
          </option>

          <option value="Other">
            Other
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-3">
          Favorite Subjects
        </label>

        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => {
            const selected =
              data.subjects.includes(
                subject
              );

            return (
              <button
                key={subject}
                type="button"
                onClick={() =>
                  toggleSubject(subject)
                }
                className={`
                  px-4 py-2 rounded-full text-sm transition
                  ${
                    selected
                      ? "bg-[#6D28D9] text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }
                `}
              >
                {subject}
              </button>
            );
          })}
        </div>

        {errors.subjects && (
          <p className="text-red-400 text-sm mt-3">
            {errors.subjects}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Study Goal
        </label>

        <select
          value={data.studyGoal}
          onChange={(e) =>
            updateData(
              "studyGoal",
              e.target.value
            )
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
            focus:outline-none
            focus:border-[#6D28D9]
          "
        >
          <option value="">
            Select Goal
          </option>

          <option value="Pass Exams">
            Pass Exams
          </option>

          <option value="Improve Grades">
            Improve Grades
          </option>

          <option value="Self Learning">
            Self Learning
          </option>

          <option value="Catch Up">
            Catch Up
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Daily Study Time
        </label>

        <select
          value={data.studyTime}
          onChange={(e) =>
            updateData(
              "studyTime",
              e.target.value
            )
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
            focus:outline-none
            focus:border-[#6D28D9]
          "
        >
          <option value="">
            Select Time
          </option>

          <option value="<1 Hour">
            &lt;1 Hour
          </option>

          <option value="1-2 Hours">
            1–2 Hours
          </option>

          <option value="3-5 Hours">
            3–5 Hours
          </option>
        </select>
      </div>
    </div>
  );
}
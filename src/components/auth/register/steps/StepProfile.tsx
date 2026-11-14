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

export default function StepProfile({
  data,
  updateData,
  errors,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Full Name */}

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Full Name *
        </label>

        <input
          value={data.fullName}
          onChange={(e) =>
            updateData("fullName", e.target.value)
          }
          placeholder="Enter full name"
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
          "
        />

        {errors.fullName && (
          <p className="text-red-400 text-sm mt-2">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Role Specific Fields */}

      {data.role === "STUDENT" && (
        <>
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Student Email
            </label>

            <input
              value={data.studentEmail}
              onChange={(e) =>
                updateData(
                  "studentEmail",
                  e.target.value
                )
              }
              placeholder="student@email.com"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Class Level
            </label>

            <input
              value={data.classLevel}
              onChange={(e) =>
                updateData(
                  "classLevel",
                  e.target.value
                )
              }
              placeholder="SS1"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Age
            </label>

            <input
              value={data.age}
              onChange={(e) =>
                updateData("age", e.target.value)
              }
              placeholder="16"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>
        </>
      )}

      {data.role === "TEACHER" && (
        <>
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Phone Number
            </label>

            <input
              value={data.phone}
              onChange={(e) =>
                updateData(
                  "phone",
                  e.target.value
                )
              }
              placeholder="+234..."
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Qualification
            </label>

            <input
              value={data.qualification}
              onChange={(e) =>
                updateData(
                  "qualification",
                  e.target.value
                )
              }
              placeholder="B.Sc Physics"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Subject
            </label>

            <input
              value={data.subject}
              onChange={(e) =>
                updateData(
                  "subject",
                  e.target.value
                )
              }
              placeholder="Physics"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Experience
            </label>

            <input
              value={data.experience}
              onChange={(e) =>
                updateData(
                  "experience",
                  e.target.value
                )
              }
              placeholder="5 Years"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>
        </>
      )}

      {data.role === "PARENT" && (
        <>
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Child Name
            </label>

            <input
              value={data.studentName}
              onChange={(e) =>
                updateData(
                  "studentName",
                  e.target.value
                )
              }
              placeholder="Student Name"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Child ID Number
            </label>

            <input
              value={data.childIdNumber}
              onChange={(e) =>
                updateData(
                  "childIdNumber",
                  e.target.value
                )
              }
              placeholder="LN-10001"
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Relationship
            </label>

            <select
              value={data.relationship}
              onChange={(e) =>
                updateData(
                  "relationship",
                  e.target.value
                )
              }
              className="
                w-full p-3 rounded-2xl
                bg-[#0F172A]
                border border-slate-700
                text-white
              "
            >
              <option value="">
                Select Relationship
              </option>

              <option value="Father">
                Father
              </option>

              <option value="Mother">
                Mother
              </option>

              <option value="Guardian">
                Guardian
              </option>
            </select>
          </div>
        </>
      )}

      {/* Common Fields */}

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Country
        </label>

        <input
          value={data.country}
          onChange={(e) =>
            updateData("country", e.target.value)
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
          "
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          State
        </label>

        <input
          value={data.state}
          onChange={(e) =>
            updateData("state", e.target.value)
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
          "
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Date of Birth
        </label>

        <input
          type="date"
          value={data.dob}
          onChange={(e) =>
            updateData("dob", e.target.value)
          }
          className="
            w-full p-3 rounded-2xl
            bg-[#0F172A]
            border border-slate-700
            text-white
          "
        />
      </div>
    </div>
  );
}
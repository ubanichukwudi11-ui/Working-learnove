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

export default function StepAccount({
  data,
  updateData,
  errors,
}: Props) {
  return (
    <div className="space-y-5">

      <div>
        <label className="block text-sm text-slate-300 mb-3">
          Account Type
        </label>

        <div className="grid grid-cols-3 gap-3">
          {["STUDENT", "TEACHER", "PARENT"].map(
            (role) => (
              <button
                key={role}
                type="button"
                onClick={() =>
                  updateData(
                    "role",
                    role as RegisterData["role"]
                  )
                }
                className={`p-3 rounded-xl border transition ${
                  data.role === role
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "bg-[#0F172A] border-slate-700 text-slate-300"
                }`}
              >
                {role}
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Email Address
        </label>

        <input
          type="email"
          value={data.email}
          onChange={(e) =>
            updateData("email", e.target.value)
          }
          placeholder="Enter your email"
          className={`w-full p-3 rounded-2xl bg-[#0F172A] border text-white ${
            errors.email
              ? "border-red-500"
              : "border-slate-700"
          }`}
        />

        {errors.email && (
          <p className="text-red-400 text-sm mt-2">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Password
        </label>

        <input
          type="password"
          value={data.password}
          onChange={(e) =>
            updateData("password", e.target.value)
          }
          placeholder="Create password"
          className={`w-full p-3 rounded-2xl bg-[#0F172A] border text-white ${
            errors.password
              ? "border-red-500"
              : "border-slate-700"
          }`}
        />

        {errors.password && (
          <p className="text-red-400 text-sm mt-2">
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Confirm Password
        </label>

        <input
          type="password"
          value={data.confirmPassword}
          onChange={(e) =>
            updateData(
              "confirmPassword",
              e.target.value
            )
          }
          placeholder="Confirm password"
          className={`w-full p-3 rounded-2xl bg-[#0F172A] border text-white ${
            errors.confirmPassword
              ? "border-red-500"
              : "border-slate-700"
          }`}
        />

        {errors.confirmPassword && (
          <p className="text-red-400 text-sm mt-2">
            {errors.confirmPassword}
          </p>
        )}
      </div>

    </div>
  );
}
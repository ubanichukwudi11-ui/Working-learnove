"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  login,
  registerStudent,
  registerTeacher,
  registerParent,
} from "@/lib/auth";

import ProgressBar from "./ProgressBar";
import StepperHeader from "./StepperHeader";
import NavigationButtons from "./NavigationButtons";

import useRegisterState from "./hooks/useRegisterState";

import StepAccount from "./steps/StepAccount";
import StepProfile from "./steps/StepProfile";
import StepLearningProfile from "./steps/StepLearningProfile";
import StepNovaSetup from "./steps/StepNovaSetup";
import CompletionScreen from "./steps/CompletionScreen";

export default function RegisterWizard() {
  const router = useRouter();

  const {
    step,
    data,
    updateData,
    errors,
    setErrors,
    nextStep,
    prevStep,
    clearDraft,
  } = useRegisterState();

  const validateStep = () => {
    if (step === 1) {
      const newErrors: Record<string, string> =
        {};

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(data.email)) {
        newErrors.email =
          "Enter a valid email address";
      }

      if (data.password.length < 6) {
        newErrors.password =
          "Password must be at least 6 characters";
      }

      if (
        data.password !==
        data.confirmPassword
      ) {
        newErrors.confirmPassword =
          "Passwords do not match";
      }

      setErrors(newErrors);

      return (
        Object.keys(newErrors).length === 0
      );
    }

    if (step === 2) {
      const newErrors: Record<string, string> =
        {};

      if (!data.fullName.trim()) {
        newErrors.fullName =
          "Full name is required";
      }

      if (
        data.role === "STUDENT" &&
        !data.studentEmail?.trim()
      ) {
        newErrors.studentEmail =
          "Student email is required";
      }

      if (
        data.role === "TEACHER" &&
        !data.subject?.trim()
      ) {
        newErrors.subject =
          "Subject is required";
      }

      if (
        data.role === "PARENT" &&
        !data.childIdNumber?.trim()
      ) {
        newErrors.childIdNumber =
          "Child ID Number is required";
      }

      setErrors(newErrors);

      return (
        Object.keys(newErrors).length === 0
      );
    }

    if (
      step === 3 &&
      data.role === "STUDENT"
    ) {
      const newErrors: Record<string, string> =
        {};

      if (!data.examType) {
        newErrors.examType =
          "Select an exam type";
      }

      if (data.subjects.length === 0) {
        newErrors.subjects =
          "Select at least one subject";
      }

      setErrors(newErrors);

      return (
        Object.keys(newErrors).length === 0
      );
    }

    return true;
  };

  const handleNext = async () => {
    const valid = validateStep();

    if (!valid) return;

    if (step !== 4) {
      nextStep();
      return;
    }

    try {
      switch (data.role) {
        case "STUDENT":
          await registerStudent({
            ...data,
            age: data.age ? Number(data.age) : undefined,
          });

          await login(
            data.email,
            data.password
          );
          break;

        case "TEACHER":
          await registerTeacher(data);
          break;

        case "PARENT":
          await registerParent(data);

          await login(
            data.email,
            data.password
          );
          break;
      }

      nextStep();
    } catch (error: any) {
      setErrors({
        general:
          error.message ??
          "Registration failed.",
      });
    }
  };

  const handleEnterLearnova = () => {
    clearDraft();

    switch (data.role) {
      case "STUDENT":
        router.push("/dashboard");
        break;

      case "TEACHER":
        router.push("/login");
        break;

      case "PARENT":
        router.push("/parent");
        break;

      default:
        router.push("/dashboard");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepAccount
            data={data}
            updateData={updateData}
            errors={errors}
          />
        );

      case 2:
        return (
          <StepProfile
            data={data}
            updateData={updateData}
            errors={errors}
          />
        );

      case 3:
        return (
          <StepLearningProfile
            data={data}
            updateData={updateData}
            errors={errors}
          />
        );

      case 4:
        return (
          <StepNovaSetup
            data={data}
            updateData={updateData}
          />
        );

      case 5:
        return (
          <CompletionScreen
            data={data}
            onEnter={handleEnterLearnova}
          />
        );

      default:
        return null;
    }
  };

  if (step === 5) {
    return (
      <div className="w-full max-w-[520px]">
        {renderStep()}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px]">
      <div
        className="
          bg-[#111827]
          border
          border-slate-800
          rounded-2xl
          p-6
          md:p-8
          animate-in
          fade-in
          duration-300
        "
      >
        <StepperHeader step={step} />

        <ProgressBar step={step} />

        <div className="mt-4 text-center">
          <span
            className="
              inline-flex
              px-3
              py-1
              rounded-full
              text-xs
              font-medium
              bg-purple-600/20
              text-purple-300
            "
          >
            {data.role} ACCOUNT
          </span>
        </div>

        <div className="mt-8">
          {renderStep()}
        </div>

        {errors.general && (
          <div
            className="
              mt-6
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-3
            "
          >
            <p className="text-sm text-red-400">
              {errors.general}
            </p>
          </div>
        )}

        <NavigationButtons
          step={step}
          onNext={handleNext}
          onBack={prevStep}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="
                text-[#06B6D4]
                hover:text-cyan-400
              "
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

export type RegisterData = {
  role: "STUDENT" | "TEACHER" | "PARENT";

  // Account
  email: string;
  password: string;
  confirmPassword: string;

  // General Profile
  fullName: string;
  country: string;
  state: string;
  dob: string;

  // ==========================
  // STUDENT
  // ==========================

  studentEmail: string;
  classLevel: string;
  age: string;

  // ==========================
  // TEACHER
  // ==========================

  phone: string;
  qualification: string;
  subject: string;
  experience: string;

  // ==========================
  // PARENT
  // ==========================

  childIdNumber: string;
  studentName: string;
  relationship: string;

  // ==========================
  // LEARNING PROFILE
  // ==========================

  examType: string;
  level: string;
  subjects: string[];

  studyGoal: string;
  studyTime: string;

  // ==========================
  // NOVA
  // ==========================

  novaPreference: string;

  status:
    | "PENDING"
    | "ACTIVE"
    | "REJECTED";
};

const initialData: RegisterData = {
  role: "STUDENT",

  // Account
  email: "",
  password: "",
  confirmPassword: "",

  // Profile
  fullName: "",
  country: "Nigeria",
  state: "",
  dob: "",

  // Student
  studentEmail: "",
  classLevel: "",
  age: "",

  // Teacher
  phone: "",
  qualification: "",
  subject: "",
  experience: "",

  // Parent
  childIdNumber: "",
  studentName: "",
  relationship: "",

  // Learning Profile
  examType: "",
  level: "",
  subjects: [],

  studyGoal: "",
  studyTime: "",

  // Nova
  novaPreference: "",

  status: "PENDING",
};

export default function useRegisterState() {
  const [step, setStep] = useState(1);

  const [data, setData] =
    useState<RegisterData>(initialData);

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const saved = localStorage.getItem(
      "learnova-register"
    );

    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (error) {
        console.error(
          "Failed to load registration draft",
          error
        );
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "learnova-register",
      JSON.stringify(data)
    );
  }, [data]);

  const updateData = (
    field: keyof RegisterData,
    value: string | string[]
  ) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const clearDraft = () => {
    localStorage.removeItem(
      "learnova-register"
    );
  };

  return {
    step,
    setStep,

    data,
    updateData,

    errors,
    setErrors,

    nextStep,
    prevStep,

    clearDraft,
  };
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

const DEMO_PROFILES: Record<string, any> = {
  STUDENT: {
    id: "demo-student-01",
    email: "student@learnova.com",
    fullName: "Alex Rivera",
    role: "STUDENT",
    status: "ACTIVE",
    classLevel: "Grade 11 - Science",
  },
  TEACHER: {
    id: "demo-teacher-01",
    email: "teacher@learnova.com",
    fullName: "Dr. Sarah Mitchell",
    role: "TEACHER",
    status: "ACTIVE",
    subject: "Advanced Mathematics",
  },
  ADMIN: {
    id: "demo-admin-01",
    email: "admin@learnova.com",
    fullName: "Marcus Vance",
    role: "ADMIN",
    status: "ACTIVE",
  },
  PARENT: {
    id: "demo-parent-01",
    email: "parent@learnova.com",
    fullName: "Eleanor Rivera",
    role: "PARENT",
    status: "ACTIVE",
    studentName: "Alex Rivera",
  },
};

export default function ProtectedRoute({
  children,
  roles,
}: Props) {
  const router = useRouter();

  const { user, loading, login: saveUser } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const targetRole = roles?.[0] || "STUDENT";
      const demoUser = DEMO_PROFILES[targetRole] || DEMO_PROFILES.STUDENT;
      saveUser(demoUser);
      return;
    }

    if (roles && !roles.includes(user.role)) {
      const targetRole = roles[0];
      const demoUser = DEMO_PROFILES[targetRole] || DEMO_PROFILES.STUDENT;
      saveUser(demoUser);
    }
  }, [user, loading, roles, router, saveUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (
    roles &&
    !roles.includes(user.role)
  ) {
    return null;
  }

  return <>{children}</>;
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export default function ProtectedRoute({
  children,
  roles,
}: Props) {
  const router = useRouter();

  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (
      roles &&
      !roles.includes(user.role)
    ) {
      switch (user.role) {
        case "STUDENT":
          router.replace("/dashboard");
          break;

        case "TEACHER":
          router.replace("/teacher");
          break;

        case "PARENT":
          router.replace("/parent");
          break;

        case "ADMIN":
          router.replace("/admin");
          break;

        default:
          router.replace("/login");
      }
    }
  }, [user, loading, roles, router]);

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
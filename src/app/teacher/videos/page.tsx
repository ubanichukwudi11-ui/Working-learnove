"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import TeacherVideoStudio from "@frontend/components/videos/TeacherVideoStudio";

export default function TeacherVideosPage() {
  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <TeacherVideoStudio />
      </AppLayout>
    </ProtectedRoute>
  );
}

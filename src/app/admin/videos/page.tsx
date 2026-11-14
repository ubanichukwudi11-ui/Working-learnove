"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import AdminVideoManager from "@frontend/components/videos/AdminVideoManager";

export default function AdminVideosPage() {
  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <AdminVideoManager />
      </AppLayout>
    </ProtectedRoute>
  );
}

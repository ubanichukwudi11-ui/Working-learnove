"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import StudentVideoPortal from "@frontend/components/videos/StudentVideoPortal";

export default function VideoLessonsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense
          fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Loading video lessons...
            </div>
          }
        >
          <StudentVideoPortal />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import StudentVideoPortal from "@frontend/components/videos/StudentVideoPortal";
import { CardSkeleton } from "@/components/ui";

export default function VideoLessonsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<CardSkeleton lines={6} />}>
          <StudentVideoPortal />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

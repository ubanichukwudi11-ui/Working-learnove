"use client";

import { use } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherLiveClassroom from "@/components/live-class/TeacherLiveClassroom";

export default function TeacherLiveClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <TeacherLiveClassroom classId={id} />
    </ProtectedRoute>
  );
}
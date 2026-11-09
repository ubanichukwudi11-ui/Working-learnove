"use client";

import StudentSidebar from "./StudentSidebar";
import TeacherSidebar from "./TeacherSidebar";
import ParentSidebar from "./ParentSidebar";
import AdminSidebar from "./AdminSidebar";

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "PARENT"
  | "ADMIN";

type Props = {
  role: UserRole;
};

export default function RoleSidebar({
  role,
}: Props) {
  switch (role) {
    case "ADMIN":
      return <AdminSidebar />;

    case "TEACHER":
      return <TeacherSidebar />;

    case "PARENT":
      return <ParentSidebar />;

    case "STUDENT":
      return <StudentSidebar />;

    default:
      return <StudentSidebar />;
  }
}
"use client";

import StudentSidebar from "./StudentSidebar";
import TeacherSidebar from "./TeacherSidebar";
import ParentSidebar from "./ParentSidebar";
import AdminSidebar from "./AdminSidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";

export type UserRole =
  | "SUPER_ADMIN"
  | "STUDENT"
  | "TEACHER"
  | "PARENT"
  | "ADMIN";

type Props = {
  role: UserRole;
};

export default function RoleSidebar({ role }: Props) {
  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminSidebar />;

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
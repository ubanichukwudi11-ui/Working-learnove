export type UserRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export const roles = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;
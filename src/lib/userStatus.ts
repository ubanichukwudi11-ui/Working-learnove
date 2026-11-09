export type UserStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED";

export const userStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
} as const;
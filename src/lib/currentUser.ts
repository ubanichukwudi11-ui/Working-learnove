import { UserRole } from "./roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const currentUser: CurrentUser = {
  id: "1",
  name: "School Admin",
  email: "admin@learnova.com",
  role: "ADMIN",
};
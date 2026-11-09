import { UserRole } from "./roles";

export function getDashboardRoute(
  role: UserRole
) {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "TEACHER":
      return "/teacher";

    case "PARENT":
      return "/parent";

    default:
      return "/dashboard";
  }
}
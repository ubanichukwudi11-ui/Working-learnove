import { NextRequest, NextResponse } from "next/server";
import {
  resolveSessionFromRequest,
  type AuthenticatedSessionUser,
} from "./authService";
import type { LmsUserRole } from "./lmsTypes";

export type { AuthenticatedSessionUser };

export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthenticatedSessionUser | null> {
  const { user } = await resolveSessionFromRequest(req);
  return user;
}

export async function requireApiAuth(
  req: NextRequest,
  allowedRoles?: LmsUserRole[]
): Promise<
  | { user: AuthenticatedSessionUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      ),
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Your account is currently suspended. Contact school administration." },
        { status: 403 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

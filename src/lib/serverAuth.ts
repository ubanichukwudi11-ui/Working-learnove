import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "./supabaseServer";
import { loadLmsState } from "./lmsDb";
import type { LmsUserRole } from "./lmsTypes";

export interface AuthenticatedSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: LmsUserRole;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
}

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const t = authHeader.slice(7).trim();
    if (t) return t;
  }
  const cookieToken = req.cookies.get("learnova_access_token")?.value;
  if (cookieToken) return cookieToken;
  return null;
}

export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthenticatedSessionUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  const sb = getSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await sb.auth.getUser(token);
  if (error || !authUser) return null;

  const [{ data: profile }, state] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    loadLmsState(),
  ]);

  let role = (profile?.role || authUser.user_metadata?.role || "STUDENT") as LmsUserRole;
  const email = (authUser.email || profile?.email || "").toLowerCase();

  const superAdminSet = new Set(
    (state.platformSettings.superAdminEmails || []).map((e) => e.toLowerCase())
  );
  if (role === "ADMIN" && superAdminSet.has(email)) {
    role = "SUPER_ADMIN";
  }

  return {
    id: authUser.id,
    email: authUser.email || profile?.email || "",
    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0] ||
      "User",
    role,
    status: (profile?.status || "ACTIVE") as AuthenticatedSessionUser["status"],
  };
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

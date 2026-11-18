import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "./supabaseServer";
import type { LmsUserRole } from "./lmsTypes";

export class AuthServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface AuthenticatedSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: LmsUserRole;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
}

async function getSuperAdminEmailSet(
  sb: ReturnType<typeof getSupabaseServerClient>
): Promise<Set<string>> {
  const envAdmins = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  try {
    const { data: settingsRow } = await sb
      .from("platform_settings")
      .select("super_admin_emails")
      .eq("id", "global")
      .maybeSingle();

    const dbAdmins = Array.isArray(settingsRow?.super_admin_emails)
      ? settingsRow.super_admin_emails
          .map((e: unknown) => String(e).trim().toLowerCase())
          .filter(Boolean)
      : [];

    return new Set([...dbAdmins, ...envAdmins]);
  } catch {
    return new Set(envAdmins);
  }
}

export async function authenticateAccessToken(
  token: string
): Promise<AuthenticatedSessionUser | null> {
  if (!isSupabaseServerConfigured || !token) return null;

  const sb = getSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await sb.auth.getUser(token);
  if (error || !authUser) return null;

  const [{ data: profile }, superAdminSet] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    getSuperAdminEmailSet(sb),
  ]);

  let role = (profile?.role || authUser.user_metadata?.role || "STUDENT") as LmsUserRole;
  const email = (authUser.email || profile?.email || "").toLowerCase();

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

export async function getSessionUserById(
  userId: string
): Promise<AuthenticatedSessionUser | null> {
  if (!isSupabaseServerConfigured || !userId) return null;
  const sb = getSupabaseServerClient();
  const [{ data: profile }, superAdminSet] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    getSuperAdminEmailSet(sb),
  ]);
  if (!profile) return null;

  let role = (profile.role || "STUDENT") as LmsUserRole;
  const email = String(profile.email || "").toLowerCase();
  if (role === "ADMIN" && superAdminSet.has(email)) {
    role = "SUPER_ADMIN";
  }

  return {
    id: profile.id,
    email: profile.email || "",
    fullName: profile.full_name || email.split("@")[0] || "User",
    role,
    status: (profile.status || "ACTIVE") as AuthenticatedSessionUser["status"],
  };
}

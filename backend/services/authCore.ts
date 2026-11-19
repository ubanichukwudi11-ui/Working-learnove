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
  avatarUrl?: string;
  phone?: string;
  gender?: string;
  country?: string;
  state?: string;
  address?: string;
  dob?: string;
  classLevel?: string;
  age?: number | null;
  schoolName?: string;
  examPreparation?: string;
  studyHours?: string;
  studyTime?: string;
  learningGoal?: string;
  reminders?: string;
  profileCompleted?: boolean;
  needsProfileCompletion?: boolean;
  authProvider?: string;
}

export function extractAuthProvider(authUser?: {
  app_metadata?: Record<string, unknown>;
  identities?: Array<{ provider?: string }>;
} | null): string | undefined {
  if (!authUser) return undefined;
  const primary = authUser.app_metadata?.provider;
  if (typeof primary === "string" && primary) return primary;
  const providers = authUser.app_metadata?.providers;
  if (Array.isArray(providers) && providers.length > 0) {
    if (providers.includes("google")) return "google";
    return String(providers[0]);
  }
  const identityProvider = authUser.identities?.[0]?.provider;
  return typeof identityProvider === "string" ? identityProvider : undefined;
}

export function computeStudentProfileCompletion(params: {
  role: LmsUserRole;
  authProvider?: string;
  profileDob?: string | null;
  studentProfile?: Record<string, unknown> | null;
  userMetadata?: Record<string, unknown> | null;
}) {
  if (params.role !== "STUDENT") {
    return {
      schoolName: undefined,
      classLevel: undefined,
      age: undefined,
      profileCompleted: true,
      needsProfileCompletion: false,
    };
  }

  const sp = params.studentProfile || {};
  const meta = params.userMetadata || {};

  const schoolName =
    (typeof sp.school_name === "string" && sp.school_name.trim()) ||
    (typeof meta.school_name === "string" && meta.school_name.trim()) ||
    undefined;

  const classLevel =
    (typeof sp.class_level === "string" && sp.class_level.trim()) ||
    (typeof meta.class_level === "string" && meta.class_level.trim()) ||
    undefined;

  const rawAge = sp.age ?? meta.age;
  const age =
    rawAge !== null && rawAge !== undefined && !Number.isNaN(Number(rawAge))
      ? Number(rawAge)
      : undefined;

  const dob =
    (typeof params.profileDob === "string" && params.profileDob.trim()) ||
    (typeof meta.dob === "string" && meta.dob.trim()) ||
    undefined;

  const explicitCompleted = Boolean(
    sp.profile_completed === true || meta.profile_completed === true
  );

  const isGoogleUser = params.authProvider === "google";
  const hasRequiredFields = Boolean(schoolName && classLevel && (age || dob));

  if (explicitCompleted || hasRequiredFields) {
    return {
      schoolName,
      classLevel: classLevel || "SS1",
      age: age ?? null,
      profileCompleted: true,
      needsProfileCompletion: false,
    };
  }

  // Non-Google legacy/seeded students who already completed onboarding retain access,
  // while Google sign-ups and brand-new uncompleted records must complete their academic profile.
  const isPreExistingEmailStudent =
    !isGoogleUser &&
    sp.profile_completed !== false &&
    Boolean(classLevel && (age || dob || sp.exam_preparation));

  return {
    schoolName,
    classLevel,
    age: age ?? null,
    profileCompleted: isPreExistingEmailStudent,
    needsProfileCompletion: !isPreExistingEmailStudent,
  };
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

  const authProvider = extractAuthProvider(authUser);

  let studentProfile: Record<string, unknown> | null = null;
  if (role === "STUDENT") {
    const { data: sp } = await sb
      .from("student_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    studentProfile = sp;
  }

  const completion = computeStudentProfileCompletion({
    role,
    authProvider,
    profileDob: profile?.dob || null,
    studentProfile,
    userMetadata: (authUser.user_metadata || {}) as Record<string, unknown>,
  });

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
    status: (profile?.status || (role === "TEACHER" ? "PENDING" : "ACTIVE")) as AuthenticatedSessionUser["status"],
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
    phone: profile?.phone || undefined,
    gender: profile?.gender || undefined,
    country: profile?.country || undefined,
    state: profile?.state || undefined,
    address: profile?.address || undefined,
    dob: profile?.dob || (authUser.user_metadata?.dob as string | undefined) || undefined,
    classLevel: completion.classLevel,
    age: completion.age,
    schoolName: completion.schoolName,
    examPreparation:
      typeof studentProfile?.exam_preparation === "string"
        ? studentProfile.exam_preparation
        : undefined,
    studyHours:
      typeof studentProfile?.study_hours === "string"
        ? studentProfile.study_hours
        : undefined,
    studyTime:
      typeof studentProfile?.study_time === "string"
        ? studentProfile.study_time
        : undefined,
    learningGoal:
      typeof studentProfile?.learning_goal === "string"
        ? studentProfile.learning_goal
        : undefined,
    reminders:
      typeof studentProfile?.reminders === "string"
        ? studentProfile.reminders
        : undefined,
    profileCompleted: completion.profileCompleted,
    needsProfileCompletion: completion.needsProfileCompletion,
    authProvider,
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

  let studentProfile: Record<string, unknown> | null = null;
  if (role === "STUDENT") {
    const { data: sp } = await sb
      .from("student_profiles")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();
    studentProfile = sp;
  }

  const completion = computeStudentProfileCompletion({
    role,
    profileDob: profile.dob || null,
    studentProfile,
  });

  return {
    id: profile.id,
    email: profile.email || "",
    fullName: profile.full_name || email.split("@")[0] || "User",
    role,
    status: (profile.status || "ACTIVE") as AuthenticatedSessionUser["status"],
    avatarUrl: profile.avatar_url || undefined,
    dob: profile.dob || undefined,
    classLevel: completion.classLevel,
    age: completion.age,
    schoolName: completion.schoolName,
    profileCompleted: completion.profileCompleted,
    needsProfileCompletion: completion.needsProfileCompletion,
  };
}

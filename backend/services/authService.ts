import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { z } from "zod";
import {
  getSupabaseAuthClient,
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "./supabaseServer";
import { appendAuditLog, appendNotification, loadLmsState, mutateLmsState } from "./lmsDb";
import type { LmsStateData, LmsUserRole } from "./lmsTypes";

const AUTH_VAULT_BUCKET = "learnova-auth-credentials";
const AUTH_VAULT_OBJECT = "credentials_v1.json";

const ACCESS_COOKIE = "learnova_access_token";
const REFRESH_COOKIE = "learnova_refresh_token";
const USER_COOKIE = "learnova_user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
  subject?: string;
  qualification?: string;
  institution?: string;
  experience?: string;
  licenseNumber?: string;
  classLevel?: string;
  age?: number;
  studentName?: string;
  childIdNumber?: string;
  relationship?: string;
}

/* ============================================================================
   INPUT VALIDATION SCHEMAS (ZOD)
============================================================================ */

export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .max(254, "Email address is too long.")
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password must not exceed 128 characters."),
});

const optionalTrimmedString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalStringArray = z.array(z.string().trim().max(120)).max(30).optional();

export const registerInputSchema = z
  .object({
    role: z
      .enum(["STUDENT", "TEACHER", "PARENT"])
      .optional()
      .default("STUDENT"),
    fullName: optionalTrimmedString(120),
    firstName: optionalTrimmedString(60),
    lastName: optionalTrimmedString(60),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .max(254, "Email address is too long.")
      .email("Please enter a valid email address.")
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(128, "Password must not exceed 128 characters."),
    phone: optionalTrimmedString(40),
    gender: optionalTrimmedString(30),
    country: optionalTrimmedString(80),
    state: optionalTrimmedString(80),
    address: optionalTrimmedString(250),
    dob: optionalTrimmedString(32),
    profilePhoto: optionalTrimmedString(2048),

    // Student fields
    classLevel: optionalTrimmedString(60),
    age: z.union([z.number(), z.string()]).optional(),
    aiPurpose: optionalStringArray,
    examPreparation: optionalTrimmedString(120),
    favouriteSubjects: optionalStringArray,
    learningStyle: optionalStringArray,
    studyHours: optionalTrimmedString(60),
    studyTime: optionalTrimmedString(60),
    learningGoal: optionalTrimmedString(500),
    reminders: optionalTrimmedString(120),

    // Teacher fields
    subject: optionalTrimmedString(120),
    subjectApplications: z
      .array(
        z.object({
          subjectId: z.string().trim().min(1).max(80),
          classLevelIds: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
        })
      )
      .max(15)
      .optional(),
    qualification: optionalTrimmedString(200),
    institution: optionalTrimmedString(200),
    experience: optionalTrimmedString(80),
    licenseNumber: optionalTrimmedString(80),
    bio: optionalTrimmedString(1000),
    certificate: optionalTrimmedString(2048),
    degreeCertificate: optionalTrimmedString(2048),
    governmentId: optionalTrimmedString(2048),
    cv: optionalTrimmedString(2048),

    // Parent fields
    studentName: optionalTrimmedString(120),
    childIdNumber: optionalTrimmedString(80),
    relationship: optionalTrimmedString(60),
  })
  .superRefine((data, ctx) => {
    const resolvedName = (
      data.fullName ||
      (data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : data.firstName || "")
    ).trim();
    if (resolvedName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "Full name must be at least 2 characters.",
      });
    }
  });

export const sessionExchangeSchema = z.object({
  accessToken: z.string().trim().min(10, "Valid access token is required."),
  refreshToken: z.string().trim().optional(),
});

/* ============================================================================
   SLIDING-WINDOW RATE LIMITER
============================================================================ */

interface RateLimitBucket {
  timestamps: number[];
}

const gAuth = globalThis as unknown as {
  __learnovaAuthRateLimits?: Map<string, RateLimitBucket>;
  __learnovaAuthVault?: Record<string, StoredCredentialRecord>;
  __learnovaAuthVaultLoaded?: boolean;
  __learnovaAuthVaultWriteChain?: Promise<unknown>;
};

export function checkAuthRateLimit(
  req: NextRequest,
  scope: "login" | "register",
  identifier: string,
  maxAttempts = 20,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  if (!gAuth.__learnovaAuthRateLimits) {
    gAuth.__learnovaAuthRateLimits = new Map();
  }
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const clientIp = forwarded.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${clientIp}:${identifier.toLowerCase()}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = gAuth.__learnovaAuthRateLimits.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= maxAttempts) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    gAuth.__learnovaAuthRateLimits.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  gAuth.__learnovaAuthRateLimits.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

/* ============================================================================
   PASSWORD HASHING (SCRYPT + CONSTANT-TIME COMPARISON)
============================================================================ */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

interface StoredCredentialRecord {
  userId: string;
  email: string;
  passwordHash: string;
  updatedAt: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString("hex")}`;
}

export function verifyPasswordHash(password: string, encoded: string): boolean {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expectedHex = parts[5];

  if (!n || !r || !p || !salt || !expectedHex) {
    return false;
  }

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const derivedBuf = crypto.scryptSync(password, salt, expectedBuf.length, { N: n, r, p });
  if (derivedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(derivedBuf, expectedBuf);
}

async function loadCredentialVault(): Promise<Record<string, StoredCredentialRecord>> {
  if (gAuth.__learnovaAuthVaultLoaded && gAuth.__learnovaAuthVault) {
    return gAuth.__learnovaAuthVault;
  }

  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb.storage
      .from(AUTH_VAULT_BUCKET)
      .download(AUTH_VAULT_OBJECT);
    if (!error && data) {
      const parsed = JSON.parse(await data.text()) as Record<string, StoredCredentialRecord>;
      gAuth.__learnovaAuthVault = parsed || {};
      gAuth.__learnovaAuthVaultLoaded = true;
      return gAuth.__learnovaAuthVault;
    }
  } catch {
    // Vault may not exist yet on first run
  }

  gAuth.__learnovaAuthVault = gAuth.__learnovaAuthVault || {};
  gAuth.__learnovaAuthVaultLoaded = true;
  return gAuth.__learnovaAuthVault;
}

async function persistCredentialHash(
  userId: string,
  email: string,
  password: string
): Promise<void> {
  const prev = gAuth.__learnovaAuthVaultWriteChain || Promise.resolve();
  const next = prev.then(async () => {
    const vault = await loadCredentialVault();
    const cleanEmail = email.trim().toLowerCase();
    vault[cleanEmail] = {
      userId,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      updatedAt: new Date().toISOString(),
    };
    gAuth.__learnovaAuthVault = vault;

    try {
      const sb = getSupabaseServerClient();
      const { data: buckets } = await sb.storage.listBuckets();
      if (!buckets?.some((b) => b.id === AUTH_VAULT_BUCKET)) {
        await sb.storage.createBucket(AUTH_VAULT_BUCKET, { public: false });
      }
      await sb.storage
        .from(AUTH_VAULT_BUCKET)
        .upload(AUTH_VAULT_OBJECT, Buffer.from(JSON.stringify(vault), "utf-8"), {
          contentType: "application/json",
          upsert: true,
        });
    } catch (err) {
      console.warn("Credential vault persistence warning:", err);
    }
  });
  gAuth.__learnovaAuthVaultWriteChain = next.catch(() => {});
  await next;
}

/* ============================================================================
   COOKIE & SESSION HELPERS
============================================================================ */

function isHttpsRequest(req: NextRequest): boolean {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https:") ? "https" : "http");
  return proto.includes("https");
}

export function applyAuthCookies(
  req: NextRequest,
  res: NextResponse,
  params: {
    user: AuthenticatedSessionUser;
    accessToken?: string | null;
    refreshToken?: string | null;
  }
) {
  const isHttps = isHttpsRequest(req);
  const base = {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    secure: isHttps,
  };

  res.cookies.set(USER_COOKIE, JSON.stringify(params.user), base);

  if (params.accessToken) {
    res.cookies.set(ACCESS_COOKIE, params.accessToken, {
      ...base,
      httpOnly: true,
    });
  }

  if (params.refreshToken) {
    res.cookies.set(REFRESH_COOKIE, params.refreshToken, {
      ...base,
      httpOnly: true,
    });
  }
}

export function clearAuthCookies(req: NextRequest, res: NextResponse) {
  const isHttps = isHttpsRequest(req);
  const expiredBase = {
    path: "/",
    expires: new Date(0),
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    secure: isHttps,
  };

  res.cookies.set(ACCESS_COOKIE, "", { ...expiredBase, httpOnly: true });
  res.cookies.set(REFRESH_COOKIE, "", { ...expiredBase, httpOnly: true });
  res.cookies.set(USER_COOKIE, "", expiredBase);
}

export function extractBearerOrCookieToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value;
  return cookieToken || null;
}

/* ============================================================================
   USER PROFILE HYDRATION
============================================================================ */

export async function hydrateUserProfile(
  authUser: SupabaseAuthUser,
  existingState?: LmsStateData
): Promise<AuthenticatedSessionUser> {
  const sb = getSupabaseServerClient();

  const [{ data: profile }, state] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    existingState ? Promise.resolve(existingState) : loadLmsState(),
  ]);

  let role = (profile?.role || authUser.user_metadata?.role || "STUDENT") as LmsUserRole;
  const cleanEmail = (authUser.email || profile?.email || "").toLowerCase();

  const superAdminSet = new Set(
    (state.platformSettings.superAdminEmails || []).map((e) => e.toLowerCase())
  );
  if (role === "ADMIN" && superAdminSet.has(cleanEmail)) {
    role = "SUPER_ADMIN";
  }

  let teacherData: Record<string, any> | null = null;
  let studentData: Record<string, any> | null = null;
  let parentData: Record<string, any> | null = null;

  if (role === "TEACHER") {
    const { data } = await sb
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    teacherData = data;
  } else if (role === "STUDENT") {
    const { data } = await sb
      .from("student_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    studentData = data;
  } else if (role === "PARENT") {
    const { data } = await sb
      .from("parent_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    parentData = data;
  }

  return {
    id: authUser.id,
    email: authUser.email || profile?.email || "",
    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      cleanEmail.split("@")[0] ||
      "User",
    role,
    status: (profile?.status ||
      (role === "TEACHER" ? "PENDING" : "ACTIVE")) as AuthenticatedSessionUser["status"],
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
    phone: profile?.phone ?? undefined,
    gender: profile?.gender ?? undefined,
    country: profile?.country ?? undefined,
    state: profile?.state ?? undefined,
    address: profile?.address ?? undefined,
    dob: profile?.dob ?? undefined,
    subject: teacherData?.subject ?? undefined,
    qualification: teacherData?.qualification ?? undefined,
    institution: teacherData?.institution ?? undefined,
    experience: teacherData?.experience ?? undefined,
    licenseNumber: teacherData?.license_number ?? undefined,
    classLevel: studentData?.class_level ?? undefined,
    age: studentData?.age ?? undefined,
    studentName: parentData?.student_name ?? undefined,
    childIdNumber: parentData?.child_id_number ?? undefined,
    relationship: parentData?.relationship ?? undefined,
  };
}

/* ============================================================================
   LOGIN / REGISTER / SESSION VERIFICATION FLOWS
============================================================================ */

export class AuthServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<{ user: AuthenticatedSessionUser; session: Session | null }> {
  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(
      "Supabase Auth is not configured. Please check your Supabase URL and keys.",
      500
    );
  }

  const sbAuth = getSupabaseAuthClient();
  const cleanEmail = email.trim().toLowerCase();

  // Check if a local scrypt hash exists; verify against it if present
  const vault = await loadCredentialVault();
  const storedCred = vault[cleanEmail];
  if (storedCred && !verifyPasswordHash(password, storedCred.passwordHash)) {
    // Also check Supabase Auth in case password was changed via Supabase reset flow
    const { data: resetCheck, error: resetErr } = await sbAuth.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (resetErr || !resetCheck.user) {
      throw new AuthServiceError("Invalid email or password.", 401);
    }
    await persistCredentialHash(resetCheck.user.id, cleanEmail, password);
    const hydrated = await hydrateUserProfile(resetCheck.user);
    if (hydrated.status === "SUSPENDED") {
      throw new AuthServiceError(
        "Your account is currently suspended. Contact school administration.",
        403
      );
    }
    return { user: hydrated, session: resetCheck.session };
  }

  const { data, error } = await sbAuth.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    throw new AuthServiceError(
      error?.message || "Invalid login credentials.",
      401
    );
  }

  // Ensure scrypt credential record is stored/synced
  if (!storedCred) {
    await persistCredentialHash(data.user.id, cleanEmail, password);
  }

  const user = await hydrateUserProfile(data.user);
  if (user.status === "SUSPENDED") {
    throw new AuthServiceError(
      "Your account is currently suspended. Contact school administration.",
      403
    );
  }

  return { user, session: data.session };
}

export type RegisterPayload = z.infer<typeof registerInputSchema>;

export async function registerNewAccount(input: RegisterPayload): Promise<{
  user: AuthenticatedSessionUser;
  session: Session | null;
  requiresEmailConfirmation: boolean;
}> {
  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(
      "Supabase Auth is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      500
    );
  }

  const sbAdmin = getSupabaseServerClient();
  const sbAuth = getSupabaseAuthClient();

  const resolvedFullName = (
    input.fullName ||
    (input.firstName && input.lastName
      ? `${input.firstName} ${input.lastName}`
      : input.firstName || "")
  ).trim();

  const safeRole: LmsUserRole =
    input.role === "TEACHER" || input.role === "PARENT" ? input.role : "STUDENT";
  const userStatus = safeRole === "TEACHER" ? "PENDING" : "ACTIVE";
  const cleanEmail = input.email.trim().toLowerCase();

  // Create account via Supabase Admin API so signup works smoothly with immediate confirmation
  let authUser: SupabaseAuthUser | null = null;
  let session: Session | null = null;

  const { data: adminCreated, error: adminErr } = await sbAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: resolvedFullName,
      role: safeRole,
      avatar_url: input.profilePhoto || null,
    },
  });

  if (adminErr) {
    const msg = adminErr.message || "Failed to create account.";
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
      throw new AuthServiceError("An account with this email already exists.", 409);
    }

    // Fallback to standard signUp if admin.createUser is unavailable
    const { data: signUpData, error: signUpErr } = await sbAuth.auth.signUp({
      email: cleanEmail,
      password: input.password,
      options: {
        data: {
          full_name: resolvedFullName,
          role: safeRole,
          avatar_url: input.profilePhoto || null,
        },
      },
    });

    if (signUpErr || !signUpData.user) {
      throw new AuthServiceError(signUpErr?.message || msg, 400);
    }
    authUser = signUpData.user;
    session = signUpData.session;
  } else {
    authUser = adminCreated.user;
    const { data: signInData } = await sbAuth.auth.signInWithPassword({
      email: cleanEmail,
      password: input.password,
    });
    session = signInData?.session ?? null;
  }

  if (!authUser) {
    throw new AuthServiceError("Failed to register account.", 500);
  }

  // Persist salted scrypt password hash in private credential vault
  await persistCredentialHash(authUser.id, cleanEmail, input.password);

  // Upsert public.profiles
  const { error: profileError } = await sbAdmin.from("profiles").upsert({
    id: authUser.id,
    email: authUser.email || cleanEmail,
    full_name: resolvedFullName,
    role: safeRole,
    status: userStatus,
    avatar_url: input.profilePhoto || null,
    phone: input.phone || null,
    gender: input.gender || null,
    country: input.country || null,
    state: input.state || null,
    address: input.address || null,
    dob: input.dob || null,
  });

  if (profileError) {
    console.warn("Profiles table upsert warning:", profileError.message);
  }

  // Upsert role-specific profile + LMS domain state
  try {
    if (safeRole === "STUDENT") {
      const numericAge =
        input.age !== undefined && input.age !== "" && Number.isFinite(Number(input.age))
          ? Number(input.age)
          : null;

      await sbAdmin.from("student_profiles").upsert({
        user_id: authUser.id,
        class_level: input.classLevel || "SS1",
        age: numericAge,
        profile_photo: input.profilePhoto || null,
        ai_purpose: input.aiPurpose || [],
        exam_preparation: input.examPreparation || null,
        favourite_subjects: input.favouriteSubjects || [],
        learning_style: input.learningStyle || [],
        study_hours: input.studyHours || null,
        study_time: input.studyTime || null,
        learning_goal: input.learningGoal || null,
        reminders: input.reminders || null,
      });

      await mutateLmsState((lms) => {
        const matchedLevel =
          lms.classLevels.find(
            (l) =>
              l.code.toLowerCase() ===
                String(input.classLevel || "SS1").replace(/\s+/g, "").toLowerCase() ||
              l.name.toLowerCase() === String(input.classLevel || "").toLowerCase()
          ) || lms.classLevels.find((l) => l.code === "SS1")!;

        lms.studentEnrolments = lms.studentEnrolments.filter(
          (e) => e.studentUserId !== authUser.id
        );
        lms.studentEnrolments.push({
          id: `enr-${authUser.id}`,
          studentUserId: authUser.id,
          studentName: resolvedFullName,
          studentEmail: cleanEmail,
          classLevelId: matchedLevel.id,
          subjectIds: [],
          status: "REGISTERED",
          updatedAt: new Date().toISOString(),
        });

        lms.studentEntitlements = lms.studentEntitlements.filter(
          (e) => e.studentUserId !== authUser.id
        );
        lms.studentEntitlements.push({
          id: `ent-${authUser.id}`,
          studentUserId: authUser.id,
          studentName: resolvedFullName,
          studentEmail: cleanEmail,
          classLevelId: matchedLevel.id,
          subjectIds: [],
          allSubjects: false,
          accessStatus: "REGISTERED",
          startsAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    } else if (safeRole === "TEACHER") {
      await sbAdmin.from("teacher_profiles").upsert({
        user_id: authUser.id,
        subject: input.subject || "General",
        qualification: input.qualification || null,
        institution: input.institution || null,
        experience: input.experience || null,
        license_number: input.licenseNumber || null,
        profile_photo: input.profilePhoto || null,
        teaching_certificate: input.certificate || null,
        degree_certificate: input.degreeCertificate || null,
        government_id: input.governmentId || null,
        cv: input.cv || null,
        verification_score: 0,
      });

      await mutateLmsState((lms) => {
        const appsInput =
          Array.isArray(input.subjectApplications) && input.subjectApplications.length > 0
            ? input.subjectApplications
            : [
                {
                  subjectId:
                    lms.subjects.find(
                      (s) =>
                        s.name.toLowerCase() ===
                        String(input.subject || "").trim().toLowerCase()
                    )?.id || lms.subjects[0].id,
                  classLevelIds: ["lvl-jss1", "lvl-jss2", "lvl-jss3"],
                },
              ];

        for (const item of appsInput) {
          const subObj =
            lms.subjects.find((s) => s.id === item.subjectId) || lms.subjects[0];
          lms.teacherApplications.unshift({
            id: `tapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teacherUserId: authUser.id,
            teacherName: resolvedFullName,
            teacherEmail: cleanEmail,
            subjectId: subObj.id,
            subjectName: subObj.name,
            classLevelIds:
              Array.isArray(item.classLevelIds) && item.classLevelIds.length > 0
                ? item.classLevelIds
                : subObj.classLevelIds,
            qualification: input.qualification || "Pending specification",
            institution: input.institution || "Not provided",
            experience: input.experience || "Not provided",
            licenseNumber: input.licenseNumber || "",
            bio: input.bio || "",
            documentUrls: {
              profilePhoto: input.profilePhoto || undefined,
              teachingCertificate: input.certificate || undefined,
              degreeCertificate: input.degreeCertificate || undefined,
              governmentId: input.governmentId || undefined,
              cv: input.cv || undefined,
            },
            status: "PENDING_REVIEW",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        appendNotification(lms, {
          recipientUserId: authUser.id,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: "Teacher Application Received",
          message:
            "Your subject qualification application has been received and queued for School Admin review.",
          href: "/teacher/applications",
        });

        appendNotification(lms, {
          recipientUserId: "ALL_ADMINS",
          recipientRole: "ALL_ADMINS",
          category: "TEACHER_APPLICATION",
          title: `New Teacher Application: ${resolvedFullName}`,
          message: `${resolvedFullName} applied to teach and requires approval in the Teacher Approval Centre.`,
          href: `/admin/teachers/${authUser.id}`,
        });

        appendAuditLog(lms, {
          actorUserId: authUser.id,
          actorEmail: cleanEmail,
          actorRole: "TEACHER",
          action: "TEACHER_APPLICATION_SUBMITTED",
          entityType: "teacher_application",
          entityId: authUser.id,
        });
      });
    } else if (safeRole === "PARENT") {
      await sbAdmin.from("parent_profiles").upsert({
        user_id: authUser.id,
        student_name: input.studentName || null,
        child_id_number: input.childIdNumber || null,
        relationship: input.relationship || "Parent",
      });
    }
  } catch (roleErr) {
    console.warn("Role profile setup warning:", roleErr);
  }

  const hydratedUser = await hydrateUserProfile(authUser);

  return {
    user: hydratedUser,
    session,
    requiresEmailConfirmation: !session,
  };
}

export async function resolveSessionFromRequest(req: NextRequest): Promise<{
  user: AuthenticatedSessionUser | null;
  refreshedSession: Session | null;
}> {
  const sb = getSupabaseServerClient();
  const token = extractBearerOrCookieToken(req);

  if (token) {
    const {
      data: { user: authUser },
      error,
    } = await sb.auth.getUser(token);

    if (!error && authUser) {
      const user = await hydrateUserProfile(authUser);
      return { user, refreshedSession: null };
    }
  }

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const sbAuth = getSupabaseAuthClient();
    const { data, error } = await sbAuth.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (!error && data.user && data.session) {
      const user = await hydrateUserProfile(data.user);
      return { user, refreshedSession: data.session };
    }
  }

  return { user: null, refreshedSession: null };
}

export async function exchangeAccessTokenForUser(
  accessToken: string
): Promise<AuthenticatedSessionUser> {
  const sb = getSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await sb.auth.getUser(accessToken);

  if (error || !authUser) {
    throw new AuthServiceError("Invalid or expired session token.", 401);
  }

  const user = await hydrateUserProfile(authUser);
  if (user.status === "SUSPENDED") {
    throw new AuthServiceError(
      "Your account is currently suspended. Contact school administration.",
      403
    );
  }

  return user;
}

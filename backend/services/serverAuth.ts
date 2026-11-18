import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
  SUPABASE_SERVER_CONFIG_ERROR,
} from "./supabaseServer";
import {
  appendAuditLog,
  appendNotification,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { LmsUserRole } from "./lmsTypes";
import { sendWelcomeEmail } from "./emailService";
import {
  AuthServiceError,
  authenticateAccessToken,
  getSessionUserById,
  type AuthenticatedSessionUser,
} from "./authCore";

export {
  AuthServiceError,
  authenticateAccessToken,
  getSessionUserById,
  type AuthenticatedSessionUser,
};

export function resolvePublicAppOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  if (configured) return configured;

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()?.replace(/\/+$/, "");
  if (railwayDomain) {
    return `https://${railwayDomain}`;
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    const proto = req.nextUrl.protocol.replace(":", "") || "https";
    return `${proto}://${host}`;
  }

  return req.nextUrl.origin || "http://localhost:3000";
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
  if (!isSupabaseServerConfigured) return null;
  const token = extractToken(req);
  if (!token) return null;
  return authenticateAccessToken(token);
}

export async function requireApiAuth(
  req: NextRequest,
  allowedRoles?: LmsUserRole[]
): Promise<
  | { user: AuthenticatedSessionUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  if (!isSupabaseServerConfigured) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: SUPABASE_SERVER_CONFIG_ERROR },
        { status: 503 }
      ),
    };
  }

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

export async function registerLearnovaAccount(body: Record<string, unknown>) {
  const {
    role = "STUDENT",
    fullName,
    firstName,
    lastName,
    email,
    password,
    phone,
    gender,
    country,
    state,
    address,
    dob,
    profilePhoto,
    classLevel,
    age,
    aiPurpose,
    examPreparation,
    favouriteSubjects,
    learningStyle,
    studyHours,
    studyTime,
    learningGoal,
    reminders,
    subject,
    subjectApplications,
    qualification,
    institution,
    experience,
    licenseNumber,
    bio,
    certificate,
    degreeCertificate,
    governmentId,
    cv,
    studentName,
    childIdNumber,
    relationship,
  } = body as Record<string, any>;

  const resolvedFullName = (
    fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : firstName || "")
  ).trim();

  if (!email || !password || !resolvedFullName) {
    throw new AuthServiceError(
      "Full name, email, and password are required.",
      400
    );
  }

  // Prevent self-registration as ADMIN or SUPER_ADMIN
  const safeRole =
    role === "TEACHER" || role === "PARENT" ? role : "STUDENT";

  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(SUPABASE_SERVER_CONFIG_ERROR, 503);
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim().toLowerCase(),
    password: String(password),
    options: {
      data: {
        full_name: resolvedFullName,
        role: safeRole,
        avatar_url: profilePhoto || null,
      },
    },
  });

  if (error || !data.user) {
    throw new AuthServiceError(
      error?.message || "Failed to register account.",
      400
    );
  }

  const authUser = data.user;
  const userStatus = safeRole === "TEACHER" ? "PENDING" : "ACTIVE";
  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    await supabase.from("profiles").upsert({
      id: authUser.id,
      email: authUser.email || normalizedEmail,
      full_name: resolvedFullName,
      role: safeRole,
      status: userStatus,
      avatar_url: profilePhoto || null,
      phone: phone || null,
      gender: gender || null,
      country: country || null,
      state: state || null,
      address: address || null,
      dob: dob || null,
    });
  } catch (profileErr) {
    console.warn("Profiles table upsert warning:", profileErr);
  }

  try {
    if (safeRole === "STUDENT") {
      await supabase.from("student_profiles").upsert({
        user_id: authUser.id,
        class_level: classLevel || "SS1",
        age: age ? Number(age) : null,
        profile_photo: profilePhoto || null,
        ai_purpose: aiPurpose || [],
        exam_preparation: examPreparation || null,
        favourite_subjects: favouriteSubjects || [],
        learning_style: learningStyle || [],
        study_hours: studyHours || null,
        study_time: studyTime || null,
        learning_goal: learningGoal || null,
        reminders: reminders || null,
      });

      await mutateLmsState((lms) => {
        const matchedLevel =
          lms.classLevels.find(
            (l) =>
              l.code.toLowerCase() ===
                String(classLevel || "SS1")
                  .replace(/\s+/g, "")
                  .toLowerCase() ||
              l.name.toLowerCase() === String(classLevel || "").toLowerCase()
          ) || lms.classLevels.find((l) => l.code === "SS1")!;

        lms.studentEnrolments.push({
          id: `enr-${authUser.id}`,
          studentUserId: authUser.id,
          studentName: resolvedFullName,
          studentEmail: authUser.email || normalizedEmail,
          classLevelId: matchedLevel.id,
          subjectIds: [],
          status: "REGISTERED",
          updatedAt: new Date().toISOString(),
        });

        lms.studentEntitlements.push({
          id: `ent-${authUser.id}`,
          studentUserId: authUser.id,
          studentName: resolvedFullName,
          studentEmail: authUser.email || normalizedEmail,
          classLevelId: matchedLevel.id,
          subjectIds: [],
          allSubjects: false,
          accessStatus: "REGISTERED",
          startsAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    } else if (safeRole === "TEACHER") {
      await supabase.from("teacher_profiles").upsert({
        user_id: authUser.id,
        subject: subject || "General",
        qualification: qualification || null,
        institution: institution || null,
        experience: experience || null,
        license_number: licenseNumber || null,
        profile_photo: profilePhoto || null,
        teaching_certificate: certificate || null,
        degree_certificate: degreeCertificate || null,
        government_id: governmentId || null,
        cv: cv || null,
        verification_score: 0,
      });

      await mutateLmsState((lms) => {
        const appsInput =
          Array.isArray(subjectApplications) && subjectApplications.length > 0
            ? subjectApplications
            : [
                {
                  subjectId:
                    lms.subjects.find(
                      (s) =>
                        s.name.toLowerCase() ===
                        String(subject || "").trim().toLowerCase()
                    )?.id || lms.subjects[0].id,
                  classLevelIds: ["lvl-jss1", "lvl-jss2", "lvl-jss3"],
                },
              ];

        for (const item of appsInput) {
          const subObj =
            lms.subjects.find((s) => s.id === item.subjectId) ||
            lms.subjects[0];
          lms.teacherApplications.unshift({
            id: `tapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teacherUserId: authUser.id,
            teacherName: resolvedFullName,
            teacherEmail: authUser.email || normalizedEmail,
            subjectId: subObj.id,
            subjectName: subObj.name,
            classLevelIds:
              Array.isArray(item.classLevelIds) && item.classLevelIds.length > 0
                ? item.classLevelIds
                : subObj.classLevelIds,
            qualification: qualification || "Pending specification",
            institution: institution || "Not provided",
            experience: experience || "Not provided",
            licenseNumber: licenseNumber || "",
            bio: bio || "",
            documentUrls: {
              profilePhoto: profilePhoto || undefined,
              teachingCertificate: certificate || undefined,
              degreeCertificate: degreeCertificate || undefined,
              governmentId: governmentId || undefined,
              cv: cv || undefined,
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
          actorEmail: authUser.email || String(email),
          actorRole: "TEACHER",
          action: "TEACHER_APPLICATION_SUBMITTED",
          entityType: "teacher_application",
          entityId: authUser.id,
        });
      });
    } else if (safeRole === "PARENT") {
      await supabase.from("parent_profiles").upsert({
        user_id: authUser.id,
        student_name: studentName || null,
        child_id_number: childIdNumber || null,
        relationship: relationship || "Parent",
      });
    }
  } catch (roleErr) {
    console.warn("Role table upsert warning:", roleErr);
  }

  const user = {
    id: authUser.id,
    email: authUser.email || String(email),
    fullName: resolvedFullName,
    role: safeRole,
    status: userStatus,
    avatarUrl: profilePhoto,
    phone,
    gender,
    country,
    state,
    address,
    dob,
    subject,
    classLevel,
    studentName,
  };

  sendWelcomeEmail({
    to: user.email,
    fullName: user.fullName,
    role: user.role,
  }).catch((err) => console.warn("Welcome email dispatch warning:", err));

  return {
    session: data.session,
    user,
    requiresEmailConfirmation: !data.session,
  };
}

export async function loginLearnovaAccount(input: {
  email?: string;
  password?: string;
}) {
  const email = String(input.email || "");
  const password = String(input.password || "");

  if (!email || !password) {
    throw new AuthServiceError("Email and password are required.", 400);
  }

  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(SUPABASE_SERVER_CONFIG_ERROR, 503);
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    throw new AuthServiceError(
      error?.message || "Invalid login credentials.",
      401
    );
  }

  const authUser = data.user;

  const [{ data: profile }, state] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    loadLmsState(),
  ]);

  let teacherData: Record<string, unknown> | null = null;
  let studentData: Record<string, unknown> | null = null;
  let parentData: Record<string, unknown> | null = null;

  let role = profile?.role || authUser.user_metadata?.role || "STUDENT";
  const cleanEmail = (authUser.email || email).toLowerCase();
  if (
    role === "ADMIN" &&
    (state.platformSettings.superAdminEmails || [])
      .map((e) => e.toLowerCase())
      .includes(cleanEmail)
  ) {
    role = "SUPER_ADMIN";
  }

  if (role === "TEACHER") {
    const { data: t } = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    teacherData = t;
  } else if (role === "STUDENT") {
    const { data: s } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    studentData = s;
  } else if (role === "PARENT") {
    const { data: p } = await supabase
      .from("parent_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    parentData = p;
  }

  const user = {
    id: authUser.id,
    email: authUser.email || email,
    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0],
    role,
    status: profile?.status || (role === "TEACHER" ? "PENDING" : "ACTIVE"),
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    phone: profile?.phone,
    gender: profile?.gender,
    country: profile?.country,
    state: profile?.state,
    address: profile?.address,
    dob: profile?.dob,
    subject: teacherData?.subject,
    qualification: teacherData?.qualification,
    institution: teacherData?.institution,
    experience: teacherData?.experience,
    licenseNumber: teacherData?.license_number,
    classLevel: studentData?.class_level,
    age: studentData?.age,
    studentName: parentData?.student_name,
    childIdNumber: parentData?.child_id_number,
    relationship: parentData?.relationship,
  };

  return {
    session: data.session,
    user,
  };
}

export async function exchangeOAuthSessionToken(accessTokenInput: string) {
  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(SUPABASE_SERVER_CONFIG_ERROR, 503);
  }

  const accessToken = String(accessTokenInput || "").trim();
  if (!accessToken) {
    throw new AuthServiceError("Access token required.", 400);
  }

  const sb = getSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await sb.auth.getUser(accessToken);
  if (error || !authUser) {
    throw new AuthServiceError("Invalid session token.", 401);
  }

  const [{ data: profile }, state] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    loadLmsState(),
  ]);

  let role = profile?.role || authUser.user_metadata?.role || "STUDENT";
  const email = (authUser.email || profile?.email || "").toLowerCase();
  if (
    role === "ADMIN" &&
    (state.platformSettings.superAdminEmails || [])
      .map((e) => e.toLowerCase())
      .includes(email)
  ) {
    role = "SUPER_ADMIN";
  }

  const user = {
    id: authUser.id,
    email: authUser.email || "",
    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      "User",
    role,
    status: profile?.status || "ACTIVE",
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
  };

  return { accessToken, user };
}

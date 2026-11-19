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
import { toPgUuid } from "./pgRepository";
import type { LmsUserRole } from "./lmsTypes";
import { sendWelcomeEmail } from "./emailService";
import {
  AuthServiceError,
  authenticateAccessToken,
  computeStudentProfileCompletion,
  extractAuthProvider,
  getSessionUserById,
  type AuthenticatedSessionUser,
} from "./authCore";

export {
  AuthServiceError,
  authenticateAccessToken,
  getSessionUserById,
  type AuthenticatedSessionUser,
};

async function upsertStudentProfileSafe(
  sb: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  payload: Record<string, unknown>
) {
  const { error } = await sb.from("student_profiles").upsert(
    {
      user_id: userId,
      ...payload,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    // Graceful fallback if school_name or profile_completed migration has not been applied yet
    const fallbackPayload = { ...payload };
    delete fallbackPayload.school_name;
    delete fallbackPayload.profile_completed;
    await sb.from("student_profiles").upsert(
      {
        user_id: userId,
        ...fallbackPayload,
      },
      { onConflict: "user_id" }
    );
  }
}

async function isEmailAssociatedWithTeacher(
  sb: ReturnType<typeof getSupabaseServerClient>,
  email: string
): Promise<boolean> {
  if (!email) return false;
  try {
    const { data: emailProfile } = await sb
      .from("profiles")
      .select("role")
      .ilike("email", email)
      .maybeSingle();
    if (emailProfile?.role === "TEACHER") return true;
  } catch {
    // Ignore transient query issue and also check LMS state
  }
  try {
    const lms = await loadLmsState();
    if (
      lms.teacherApplications.some(
        (app) => app.teacherEmail.trim().toLowerCase() === email.toLowerCase()
      )
    ) {
      return true;
    }
  } catch {
    // Ignore if state unavailable
  }
  return false;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function extractHostOnly(hostHeader: string): string {
  const withoutPort = hostHeader.replace(/:\d+$/, "").trim().toLowerCase();
  return withoutPort;
}

export function shouldUseSecureCookie(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  const host = extractHostOnly(
    req.headers.get("x-forwarded-host")?.split(",")[0] ||
      req.headers.get("host") ||
      ""
  );
  if (host && LOCAL_HOSTS.has(host)) {
    return false;
  }
  if (req.nextUrl?.protocol === "https:") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

export function resolvePublicAppOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = req.headers.get("host")?.trim();
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()?.replace(/\/+$/, "");

  const requestHost = forwardedHost || host || railwayDomain || "";
  const requestIsLocal = requestHost ? LOCAL_HOSTS.has(extractHostOnly(requestHost)) : false;

  const configuredRaw = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  if (configuredRaw) {
    try {
      const parsed = new URL(configuredRaw);
      const configuredIsLocal = LOCAL_HOSTS.has(parsed.hostname.toLowerCase());
      if (!configuredIsLocal || requestIsLocal) {
        if (!configuredIsLocal && parsed.protocol === "http:") {
          const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
          if (forwardedProto === "https" || process.env.NODE_ENV === "production") {
            return `https://${parsed.host}`;
          }
        }
        return parsed.origin;
      }
    } catch {
      // Ignore malformed NEXT_PUBLIC_APP_URL and derive from request headers
    }
  }

  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || (LOCAL_HOSTS.has(extractHostOnly(forwardedHost)) ? "http" : "https");
    return `${proto}://${forwardedHost}`;
  }

  if (railwayDomain) {
    return `https://${railwayDomain}`;
  }

  if (host) {
    const isLocal = LOCAL_HOSTS.has(extractHostOnly(host));
    const proto = forwardedProto || req.nextUrl.protocol.replace(":", "") || (isLocal ? "http" : "https");
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

export function canTeacherAccessPlatform(
  user: Pick<AuthenticatedSessionUser, "role" | "status"> | null | undefined
): boolean {
  if (!user) return false;
  return user.role !== "TEACHER" || user.status === "ACTIVE";
}

export async function requireApiAuth(
  req: NextRequest,
  allowedRoles?: LmsUserRole[],
  options?: { allowUnapprovedTeacher?: boolean }
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

  const allowUnapprovedTeacher = Boolean(options?.allowUnapprovedTeacher);

  if (
    user.status === "SUSPENDED" &&
    !(allowUnapprovedTeacher && user.role === "TEACHER" && req.method === "GET")
  ) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Your account is currently suspended. Contact school administration." },
        { status: 403 }
      ),
    };
  }

  if (
    user.role === "TEACHER" &&
    user.status !== "ACTIVE" &&
    !allowUnapprovedTeacher
  ) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error:
            user.status === "REJECTED"
              ? "Your teacher application was not approved. Open Teacher Applications for feedback."
              : user.status === "SUSPENDED"
              ? "Your teacher access is currently suspended. Contact School Administration."
              : "Your teacher account is pending School Administrator verification and approval.",
          code: "TEACHER_NOT_APPROVED",
          accountStatus: user.status,
        },
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

export async function registerLearnovaAccount(
  body: Record<string, unknown>,
  appOrigin?: string
) {
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
    schoolName,
    aiPurpose,
    examPreparation,
    favouriteSubjects,
    learningStyle,
    studyHours,
    studyTime,
    learningGoal,
    reminders,
    subject,
    subjects,
    classLevelIds,
    subjectApplications,
    qualification,
    institution,
    experience,
    licenseNumber,
    bio,
    certificate,
    teachingCertificate,
    degreeCertificate,
    governmentId,
    cv,
    studentName,
    childIdNumber,
    relationship,
  } = body as Record<string, any>;

  const resolvedCertificate = teachingCertificate || certificate;

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

  const resolvedRedirectOrigin =
    appOrigin?.trim()?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "") ||
    (process.env.RAILWAY_PUBLIC_DOMAIN?.trim()
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim().replace(/\/+$/, "")}`
      : "");

  const cleanSchoolName = typeof schoolName === "string" ? schoolName.trim() : "";
  const isManualStudentCompleted =
    safeRole === "STUDENT" &&
    Boolean(classLevel && cleanSchoolName && (age || dob));

  const { data, error } = await supabase.auth.signUp({
    email: String(email).trim().toLowerCase(),
    password: String(password),
    options: {
      ...(resolvedRedirectOrigin
        ? { emailRedirectTo: `${resolvedRedirectOrigin}/auth/callback` }
        : {}),
      data: {
        full_name: resolvedFullName,
        role: safeRole,
        avatar_url: profilePhoto || null,
        ...(safeRole === "STUDENT"
          ? {
              school_name: cleanSchoolName || null,
              class_level: classLevel || "SS1",
              age: age ? Number(age) : null,
              dob: dob || null,
              profile_completed: isManualStudentCompleted,
            }
          : {}),
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
      await upsertStudentProfileSafe(supabase, authUser.id, {
        class_level: classLevel || "SS1",
        age: age ? Number(age) : null,
        school_name: cleanSchoolName || null,
        profile_completed: isManualStudentCompleted,
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
      const requestedSubjectList: string[] = Array.isArray(subjects)
        ? subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
        : subject
        ? [String(subject).trim()]
        : [];
      const requestedLevelList: string[] = Array.isArray(classLevelIds)
        ? classLevelIds.map((l: unknown) => String(l).trim()).filter(Boolean)
        : [];
      const primarySubjectLabel =
        requestedSubjectList[0] ||
        (Array.isArray(subjectApplications) && subjectApplications[0]?.subjectName) ||
        subject ||
        "General";
      const nowIso = new Date().toISOString();

      const teacherProfilePayload = {
        user_id: authUser.id,
        subject: primarySubjectLabel,
        qualification: qualification || null,
        institution: institution || null,
        experience: experience || null,
        license_number: licenseNumber || null,
        bio: bio ? String(bio).trim() : null,
        requested_subjects: requestedSubjectList,
        requested_class_levels: requestedLevelList,
        profile_photo: profilePhoto || null,
        teaching_certificate: resolvedCertificate || null,
        degree_certificate: degreeCertificate || null,
        government_id: governmentId || null,
        cv: cv || null,
        verification_score: 0,
        updated_at: nowIso,
      };

      const { error: tpErr } = await supabase
        .from("teacher_profiles")
        .upsert(teacherProfilePayload);
      if (tpErr) {
        const fallbackTp = { ...teacherProfilePayload } as Record<string, unknown>;
        delete fallbackTp.bio;
        delete fallbackTp.requested_subjects;
        delete fallbackTp.requested_class_levels;
        delete fallbackTp.updated_at;
        await supabase.from("teacher_profiles").upsert(fallbackTp);
      }

      await mutateLmsState((lms) => {
        const defaultLevels =
          requestedLevelList.length > 0
            ? requestedLevelList
            : ["lvl-jss1", "lvl-jss2", "lvl-jss3"];

        let appsInput: Array<{ subjectId?: string; subjectName?: string; classLevelIds?: string[] }> = [];
        if (Array.isArray(subjectApplications) && subjectApplications.length > 0) {
          appsInput = subjectApplications;
        } else if (requestedSubjectList.length > 0) {
          appsInput = requestedSubjectList.map((rawSub) => {
            const matched = lms.subjects.find(
              (s) =>
                s.id === rawSub ||
                s.name.toLowerCase() === rawSub.toLowerCase() ||
                s.code.toLowerCase() === rawSub.toLowerCase()
            );
            return {
              subjectId: matched?.id || lms.subjects[0].id,
              classLevelIds: defaultLevels,
            };
          });
        } else {
          appsInput = [
            {
              subjectId:
                lms.subjects.find(
                  (s) =>
                    s.name.toLowerCase() ===
                    String(subject || "").trim().toLowerCase()
                )?.id || lms.subjects[0].id,
              classLevelIds: defaultLevels,
            },
          ];
        }

        const seenSubjectIds = new Set<string>();
        for (const item of appsInput) {
          const subObj =
            lms.subjects.find(
              (s) =>
                s.id === item.subjectId ||
                (item.subjectName &&
                  s.name.toLowerCase() === String(item.subjectName).toLowerCase())
            ) || lms.subjects[0];
          if (seenSubjectIds.has(subObj.id)) continue;
          seenSubjectIds.add(subObj.id);

          const chosenLevels =
            Array.isArray(item.classLevelIds) && item.classLevelIds.length > 0
              ? item.classLevelIds.filter((lvl) =>
                  lms.classLevels.some((c) => c.id === lvl)
                )
              : defaultLevels;

          lms.teacherApplications.unshift({
            id: `tapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teacherUserId: authUser.id,
            teacherName: resolvedFullName,
            teacherEmail: authUser.email || normalizedEmail,
            subjectId: subObj.id,
            subjectName: subObj.name,
            classLevelIds:
              chosenLevels.length > 0 ? chosenLevels : subObj.classLevelIds,
            qualification: qualification || "Pending specification",
            institution: institution || "Not provided",
            experience: experience || "Not provided",
            licenseNumber: licenseNumber || "",
            bio: bio ? String(bio).trim() : "",
            documentUrls: {
              profilePhoto: profilePhoto || undefined,
              teachingCertificate: resolvedCertificate || undefined,
              degreeCertificate: degreeCertificate || undefined,
              governmentId: governmentId || undefined,
              cv: cv || undefined,
            },
            status: "PENDING_REVIEW",
            history: [
              {
                id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                action: "APPLICATION_SUBMITTED",
                fromStatus: "NEW",
                toStatus: "PENDING_REVIEW",
                actorUserId: authUser.id,
                actorName: resolvedFullName,
                actorRole: "TEACHER",
                note: `Educator registration submitted for ${subObj.name}.`,
                timestamp: nowIso,
              },
            ],
            createdAt: nowIso,
            updatedAt: nowIso,
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
          metadata: {
            subjects: Array.from(seenSubjectIds),
            classLevels: defaultLevels,
          },
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
    age: age ? Number(age) : null,
    schoolName: cleanSchoolName || undefined,
    profileCompleted: safeRole === "STUDENT" ? isManualStudentCompleted : true,
    needsProfileCompletion: safeRole === "STUDENT" ? !isManualStudentCompleted : false,
    authProvider: "email",
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

  const [{ data: profile }, { data: settingsRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("platform_settings")
      .select("super_admin_emails")
      .eq("id", "global")
      .maybeSingle(),
  ]);

  let teacherData: Record<string, unknown> | null = null;
  let studentData: Record<string, unknown> | null = null;
  let parentData: Record<string, unknown> | null = null;

  let role = (profile?.role || authUser.user_metadata?.role || "STUDENT") as LmsUserRole;
  const cleanEmail = (authUser.email || email).toLowerCase();
  const superAdminSet = new Set([
    ...((Array.isArray(settingsRow?.super_admin_emails)
      ? settingsRow.super_admin_emails
      : []) as unknown[]).map((e) => String(e).trim().toLowerCase()),
    ...(process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ]);
  if (role === "ADMIN" && superAdminSet.has(cleanEmail)) {
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

  const authProvider = extractAuthProvider(authUser) || "email";
  const completion = computeStudentProfileCompletion({
    role,
    authProvider,
    profileDob: profile?.dob || null,
    studentProfile: studentData,
    userMetadata: (authUser.user_metadata || {}) as Record<string, unknown>,
  });

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
    classLevel: completion.classLevel ?? studentData?.class_level,
    age: completion.age ?? studentData?.age,
    schoolName: completion.schoolName,
    profileCompleted: completion.profileCompleted,
    needsProfileCompletion: completion.needsProfileCompletion,
    authProvider,
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

  const email = (authUser.email || "").trim().toLowerCase();

  const [{ data: initialProfile }, { data: settingsRow }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    sb
      .from("platform_settings")
      .select("super_admin_emails")
      .eq("id", "global")
      .maybeSingle(),
  ]);
  let profile = initialProfile;

  // Prevent duplicate accounts by checking case-insensitive email match if ID has no profile row
  if (!profile && email) {
    const { data: emailMatchedProfile } = await sb
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (emailMatchedProfile) {
      profile = emailMatchedProfile;
    }
  }

  const teacherBlocked =
    profile?.role === "TEACHER" ||
    authUser.user_metadata?.role === "TEACHER" ||
    (await isEmailAssociatedWithTeacher(sb, email));

  if (teacherBlocked) {
    throw new AuthServiceError(
      "Teacher accounts cannot sign in or register with Google. Please sign in with your educator email and password, or apply via Teacher Registration.",
      403
    );
  }

  const needsRoleSelection = !profile || !profile.role;

  let role = (profile?.role || authUser.user_metadata?.role || "STUDENT") as LmsUserRole;
  const resolvedEmail = (authUser.email || profile?.email || "").toLowerCase();
  const superAdminEmails = new Set([
    ...((Array.isArray(settingsRow?.super_admin_emails)
      ? settingsRow.super_admin_emails
      : []) as unknown[]).map((e) => String(e).trim().toLowerCase()),
    ...(process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ]);
  if (role === "ADMIN" && superAdminEmails.has(resolvedEmail)) {
    role = "SUPER_ADMIN";
  }

  let studentData: Record<string, unknown> | null = null;
  if (!needsRoleSelection && role === "STUDENT") {
    const { data: s } = await sb
      .from("student_profiles")
      .select("*")
      .eq("user_id", profile?.id || authUser.id)
      .maybeSingle();
    studentData = s;
  }

  const authProvider = extractAuthProvider(authUser) || "google";
  const completion = computeStudentProfileCompletion({
    role: needsRoleSelection ? "STUDENT" : role,
    authProvider,
    profileDob: profile?.dob || null,
    studentProfile: studentData,
    userMetadata: (authUser.user_metadata || {}) as Record<string, unknown>,
  });

  const user = {
    id: profile?.id || authUser.id,
    email: authUser.email || profile?.email || "",
    fullName:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      resolvedEmail.split("@")[0] ||
      "User",
    role,
    status: profile?.status || "ACTIVE",
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    dob: profile?.dob || undefined,
    classLevel: completion.classLevel,
    age: completion.age,
    schoolName: completion.schoolName,
    profileCompleted: needsRoleSelection ? false : completion.profileCompleted,
    needsProfileCompletion: needsRoleSelection ? true : completion.needsProfileCompletion,
    authProvider,
  };

  return { accessToken, user, needsRoleSelection };
}

export async function completeOAuthRoleSelection(
  accessTokenInput: string,
  requestedRole: string
) {
  if (!isSupabaseServerConfigured) {
    throw new AuthServiceError(SUPABASE_SERVER_CONFIG_ERROR, 503);
  }

  const accessToken = String(accessTokenInput || "").trim();
  if (!accessToken) {
    throw new AuthServiceError("Authentication session required.", 401);
  }

  const normalizedRequested = String(requestedRole || "").trim().toUpperCase();
  if (normalizedRequested === "TEACHER") {
    throw new AuthServiceError(
      "Teachers cannot register or sign in via Google. Please complete the Teacher Application form with an email and password.",
      403
    );
  }

  const safeRole =
    normalizedRequested === "PARENT"
      ? "PARENT"
      : normalizedRequested === "STUDENT"
      ? "STUDENT"
      : null;

  if (!safeRole) {
    throw new AuthServiceError(
      "Invalid role selected. Only Student and Parent roles are eligible for Google sign-up.",
      400
    );
  }

  const sb = getSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await sb.auth.getUser(accessToken);
  if (error || !authUser) {
    throw new AuthServiceError("Invalid or expired authentication session.", 401);
  }

  const cleanEmail = (authUser.email || "").trim().toLowerCase();

  const { data: existingProfile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existingProfile && cleanEmail) {
    const { data: duplicateEmailProfile } = await sb
      .from("profiles")
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (duplicateEmailProfile) {
      if (duplicateEmailProfile.role === "TEACHER") {
        throw new AuthServiceError(
          "Teacher accounts cannot sign in or register with Google. Please use your educator email and password.",
          403
        );
      }
      throw new AuthServiceError(
        "An account with this email already exists. Please sign in using your original sign-in method.",
        409
      );
    }
  }

  if (
    existingProfile?.role === "TEACHER" ||
    (await isEmailAssociatedWithTeacher(sb, cleanEmail))
  ) {
    throw new AuthServiceError(
      "Teacher accounts cannot sign in or register with Google. Please use your educator email and password.",
      403
    );
  }

  // Do not allow downgrading/overwriting existing ADMIN or SUPER_ADMIN roles
  const effectiveRole: LmsUserRole =
    existingProfile?.role === "SUPER_ADMIN" || existingProfile?.role === "ADMIN"
      ? existingProfile.role
      : safeRole;

  const fullName =
    existingProfile?.full_name ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    (authUser.email ? authUser.email.split("@")[0] : "Learnova User");
  const avatarUrl =
    existingProfile?.avatar_url || authUser.user_metadata?.avatar_url || null;
  const effectiveStatus = existingProfile?.status || "ACTIVE";

  const { error: upsertError } = await sb.from("profiles").upsert({
    id: authUser.id,
    email: cleanEmail || existingProfile?.email || "",
    full_name: fullName,
    avatar_url: avatarUrl,
    role: effectiveRole,
    status: effectiveStatus,
  });

  if (upsertError) {
    throw new AuthServiceError(upsertError.message || "Could not save profile role.", 400);
  }

  let needsProfileCompletion = false;
  let profileCompleted = true;

  if (effectiveRole === "STUDENT") {
    await upsertStudentProfileSafe(sb, authUser.id, {
      profile_completed: false,
    });
    needsProfileCompletion = true;
    profileCompleted = false;
    try {
      const nowIso = new Date().toISOString();
      const defaultClassLevelUuid = toPgUuid("lvl-ss1");
      const defaultSubjectUuid = toPgUuid("sub-math");
      const entitlementExternalId = `ent-${authUser.id}`;

      await Promise.all([
        sb.from("student_enrolments").upsert(
          {
            student_user_id: authUser.id,
            class_level_id: defaultClassLevelUuid,
            subject_id: defaultSubjectUuid,
            status: "REGISTERED",
          },
          { onConflict: "student_user_id,class_level_id,subject_id" }
        ),
        sb.from("subscription_entitlements").upsert(
          {
            id: toPgUuid(entitlementExternalId),
            external_id: entitlementExternalId,
            student_user_id: authUser.id,
            student_name: fullName,
            student_email: cleanEmail || existingProfile?.email || "",
            class_level_id: defaultClassLevelUuid,
            subject_ids: [],
            all_subjects: false,
            access_status: "REGISTERED",
            starts_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        ),
      ]);
    } catch (enrolErr) {
      console.warn("OAuth student enrolment initialization warning:", enrolErr);
    }
  } else if (effectiveRole === "PARENT") {
    await sb.from("parent_profiles").upsert({ user_id: authUser.id });
  }

  return {
    accessToken,
    user: {
      id: authUser.id,
      email: authUser.email || existingProfile?.email || "",
      fullName,
      role: effectiveRole,
      status: effectiveStatus,
      avatarUrl,
      profileCompleted,
      needsProfileCompletion,
      authProvider: extractAuthProvider(authUser) || "google",
    },
  };
}

import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
  SUPABASE_SERVER_CONFIG_ERROR,
} from "./supabaseServer";
import {
  LmsStateData,
  LmsUserRole,
  PersistentNotification,
  AuditLogRecord,
} from "./lmsTypes";
import { createInitialVideoCurriculum } from "./videoLessonsService";
import { loadLmsStateFromPg, saveLmsStateToPg } from "./pgRepository";

export interface DirectoryUser {
  id: string;
  email: string;
  fullName: string;
  role: LmsUserRole;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
  classLevel?: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  state?: string;
  qualification?: string;
  institution?: string;
  experience?: string;
  licenseNumber?: string;
  subject?: string;
  profilePhoto?: string;
  teachingCertificate?: string;
  degreeCertificate?: string;
  governmentId?: string;
  cv?: string;
}

const g = globalThis as unknown as {
  __learnovaLmsWriteChain?: Promise<unknown>;
  __learnovaLmsCache?: LmsStateData;
};

export function createInitialLmsState(): LmsStateData {
  const schoolId = "school-learnova-ng";
  const sessionId = "sess-2025-2026";
  const termId = "term-second-2026";

  const classLevels = [
    { id: "lvl-jss1", schoolId, code: "JSS1", name: "Junior Secondary 1 (JSS 1)", category: "JSS" as const, sortOrder: 1, isActive: true },
    { id: "lvl-jss2", schoolId, code: "JSS2", name: "Junior Secondary 2 (JSS 2)", category: "JSS" as const, sortOrder: 2, isActive: true },
    { id: "lvl-jss3", schoolId, code: "JSS3", name: "Junior Secondary 3 (JSS 3)", category: "JSS" as const, sortOrder: 3, isActive: true },
    { id: "lvl-ss1", schoolId, code: "SS1", name: "Senior Secondary 1 (SS 1)", category: "SSS" as const, sortOrder: 4, isActive: true },
    { id: "lvl-ss2", schoolId, code: "SS2", name: "Senior Secondary 2 (SS 2)", category: "SSS" as const, sortOrder: 5, isActive: true },
    { id: "lvl-ss3", schoolId, code: "SS3", name: "Senior Secondary 3 (SS 3)", category: "SSS" as const, sortOrder: 6, isActive: true },
  ];

  const allLevelIds = classLevels.map((c) => c.id);
  const sssLevelIds = ["lvl-ss1", "lvl-ss2", "lvl-ss3"];

  const subjects = [
    { id: "sub-math", schoolId, code: "MTH", name: "Mathematics", department: "Core" as const, description: "Number & numeration, algebra, geometry, trigonometry & statistics.", classLevelIds: allLevelIds, isActive: true },
    { id: "sub-eng", schoolId, code: "ENG", name: "English Language", department: "Core" as const, description: "Grammar, essay writing, comprehension, summary & oral English.", classLevelIds: allLevelIds, isActive: true },
    { id: "sub-bio", schoolId, code: "BIO", name: "Biology", department: "Science" as const, description: "Cell biology, genetics, ecology, plant & animal physiology.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-chem", schoolId, code: "CHM", name: "Chemistry", department: "Science" as const, description: "Atomic structure, stoichiometry, equilibrium & organic chemistry.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-phy", schoolId, code: "PHY", name: "Physics", department: "Science" as const, description: "Mechanics, optics, waves, electricity & laboratory practicals.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-econ", schoolId, code: "ECO", name: "Economics", department: "Commercial" as const, description: "Microeconomics, national income, public finance & Nigerian economy.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-gov", schoolId, code: "GOV", name: "Government", department: "Arts" as const, description: "Constitutional governance, political institutions & West African affairs.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-lit", schoolId, code: "LIT", name: "Literature in English", department: "Arts" as const, description: "Prose, African & non-African poetry, and WAEC prescribed drama.", classLevelIds: sssLevelIds, isActive: true },
    { id: "sub-fmath", schoolId, code: "FMT", name: "Further Mathematics", department: "Science" as const, description: "Calculus, vectors, matrices, probability & mechanics.", classLevelIds: sssLevelIds, isActive: true },
  ];

  const videoSeed = createInitialVideoCurriculum();

  return {
    schools: [
      {
        id: schoolId,
        name: "Learnova Digital Academy (Nigeria)",
        code: "LNV-NG-001",
        state: "Lagos",
        address: "Victoria Island, Lagos State, Nigeria",
        timezone: "Africa/Lagos",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
    ],
    classLevels,
    subjects,
    sessions: [
      { id: sessionId, name: "2025/2026 Academic Session", isCurrent: true },
    ],
    terms: [
      {
        id: "term-first-2025",
        sessionId,
        name: "First Term",
        startsAt: "2025-09-08",
        endsAt: "2025-12-12",
        isCurrent: false,
      },
      {
        id: termId,
        sessionId,
        name: "Second Term",
        startsAt: "2026-01-12",
        endsAt: "2026-04-03",
        isCurrent: true,
      },
      {
        id: "term-third-2026",
        sessionId,
        name: "Third Term",
        startsAt: "2026-04-27",
        endsAt: "2026-07-24",
        isCurrent: false,
      },
    ],
    subscriptionPlans: [
      {
        id: "plan-term-full",
        name: "Scholar Term Plan",
        billingCycle: "TERM",
        priceNgn: 12000,
        allSubjectsIncluded: true,
        includedSubjectIds: subjects.map((s) => s.id),
        durationDays: 90,
        isActive: true,
        description: "Full access for an entire term: live classes, all topic videos, unlimited Nova AI & PDF report cards.",
      },
      {
        id: "plan-monthly-full",
        name: "Monthly Scholar Pass",
        billingCycle: "MONTHLY",
        priceNgn: 4500,
        allSubjectsIncluded: true,
        includedSubjectIds: subjects.map((s) => s.id),
        durationDays: 30,
        isActive: true,
        description: "30-day access to all enrolled subjects, live classrooms, topic videos, and Nova AI study tools.",
      },
      {
        id: "plan-single-subject",
        name: "Single Subject Term Pass",
        billingCycle: "TERM",
        priceNgn: 4000,
        allSubjectsIncluded: false,
        includedSubjectIds: [],
        durationDays: 90,
        isActive: true,
        description: "Full term access to one selected subject (e.g. Mathematics or English Language).",
      },
    ],
    platformSettings: {
      platformName: "Learnova Nigeria",
      defaultTimezone: "Africa/Lagos",
      defaultRoomCapacity: 50,
      paystackPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
      allowManualBankTransfer: true,
      superAdminEmails: (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    },
    teacherApplications: [],
    teacherApprovals: [],
    studentEnrolments: [],
    paymentRecords: [],
    studentEntitlements: [],
    timetableEntries: [],
    studentGroups: [],
    classrooms: [],
    attendanceRecords: [],
    curriculumTopics: videoSeed.curriculumTopics,
    videoLessons: videoSeed.videoLessons,
    videoUploadRequests: [],
    quizAttempts: [],
    videoQuestions: [],
    parentStudentLinks: [],
    notifications: [],
    auditLogs: [],
  };
}

export async function loadLmsState(): Promise<LmsStateData> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  return loadLmsStateFromPg(createInitialLmsState);
}

export async function saveLmsState(
  state: LmsStateData,
  prevState?: LmsStateData
): Promise<void> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  await saveLmsStateToPg(state, prevState);
}

/**
 * Serialized mutation helper that loads fresh state from PostgreSQL and persists normalized changes.
 */
export async function mutateLmsState<T>(
  fn: (state: LmsStateData) => Promise<T> | T
): Promise<T> {
  const prev = g.__learnovaLmsWriteChain || Promise.resolve();
  let result!: T;
  const next = prev.then(async () => {
    const state = await loadLmsState();
    const snapshotBefore = structuredClone(state);
    result = await fn(state);
    await saveLmsState(state, snapshotBefore);
  });
  g.__learnovaLmsWriteChain = next.catch(() => {});
  await next;
  return result;
}

export async function fetchDirectoryUsers(): Promise<DirectoryUser[]> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  const sb = getSupabaseServerClient();
  const [{ data: profiles }, { data: teachers }, { data: students }, { data: settingsRow }] =
    await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("teacher_profiles").select("*"),
      sb.from("student_profiles").select("*"),
      sb.from("platform_settings").select("super_admin_emails").eq("id", "global").maybeSingle(),
    ]);

  const tMap = new Map<string, any>();
  for (const t of teachers || []) tMap.set(t.user_id, t);
  const sMap = new Map<string, any>();
  for (const s of students || []) sMap.set(s.user_id, s);

  const superEmails = new Set<string>(
    [
      ...((settingsRow?.super_admin_emails as string[]) || []),
      ...(process.env.SUPER_ADMIN_EMAILS || "").split(","),
    ]
      .map((e) => String(e).trim().toLowerCase())
      .filter(Boolean)
  );

  return (profiles || []).map((p: any) => {
    const t = tMap.get(p.id);
    const s = sMap.get(p.id);
    let role: LmsUserRole = (p.role || "STUDENT") as LmsUserRole;
    if (role === "ADMIN" && superEmails.has(String(p.email || "").toLowerCase())) {
      role = "SUPER_ADMIN";
    }
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name || p.email,
      role,
      status: p.status || "ACTIVE",
      avatarUrl: p.avatar_url || t?.profile_photo || undefined,
      phone: p.phone || undefined,
      country: p.country || undefined,
      state: p.state || undefined,
      classLevel: s?.class_level || undefined,
      subject: t?.subject || undefined,
      qualification: t?.qualification || undefined,
      institution: t?.institution || undefined,
      experience: t?.experience || undefined,
      licenseNumber: t?.license_number || undefined,
      profilePhoto: t?.profile_photo || undefined,
      teachingCertificate: t?.teaching_certificate || undefined,
      degreeCertificate: t?.degree_certificate || undefined,
      governmentId: t?.government_id || undefined,
      cv: t?.cv || undefined,
    };
  });
}

export function appendNotification(
  state: LmsStateData,
  input: Omit<PersistentNotification, "id" | "isRead" | "createdAt">
) {
  state.notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...input,
  });
  if (state.notifications.length > 500) {
    state.notifications = state.notifications.slice(0, 500);
  }
}

export function appendAuditLog(
  state: LmsStateData,
  input: Omit<AuditLogRecord, "id" | "createdAt">
) {
  state.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...input,
  });
  if (state.auditLogs.length > 500) {
    state.auditLogs = state.auditLogs.slice(0, 500);
  }
}

export function isStudentEntitledForSubject(
  state: LmsStateData,
  studentUserId: string,
  subjectId: string,
  classLevelId?: string
): { entitled: boolean; reason: string; status: string } {
  const ent = state.studentEntitlements.find((e) => e.studentUserId === studentUserId);
  if (!ent) {
    return {
      entitled: false,
      status: "REGISTERED",
      reason: "No active enrolment or subscription found for your account.",
    };
  }

  if (classLevelId && ent.classLevelId !== classLevelId) {
    return {
      entitled: false,
      status: ent.accessStatus,
      reason: "This classroom is for a different class level than your enrolled class.",
    };
  }

  if (ent.accessStatus === "EXPIRED") {
    return {
      entitled: false,
      status: "EXPIRED",
      reason: "Your subscription has expired. Please renew to regain classroom access.",
    };
  }

  if (ent.expiresAt && new Date(ent.expiresAt).getTime() < Date.now()) {
    return {
      entitled: false,
      status: "EXPIRED",
      reason: "Your subscription validity period has elapsed.",
    };
  }

  if (
    ent.accessStatus !== "ACTIVE_PAID" &&
    ent.accessStatus !== "SCHOLARSHIP_GRANTED"
  ) {
    return {
      entitled: false,
      status: ent.accessStatus,
      reason:
        ent.accessStatus === "AWAITING_CONFIRMATION"
          ? "Your payment is awaiting verification before classroom access unlocks."
          : "An active paid subscription or administrator authorization is required.",
    };
  }

  if (!ent.allSubjects && !ent.subjectIds.includes(subjectId)) {
    return {
      entitled: false,
      status: ent.accessStatus,
      reason: "Your current plan does not cover this subject.",
    };
  }

  return { entitled: true, status: ent.accessStatus, reason: "Authorized" };
}

export const DEFAULT_SUPER_ADMIN_EMAILS = ["ubanichukwudi11@gmail.com"];

export function getCachedSuperAdminEmails(): string[] | null {
  const emails = g.__learnovaLmsCache?.platformSettings?.superAdminEmails;
  return Array.isArray(emails) ? emails : null;
}


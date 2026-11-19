import crypto from "crypto";
import { getSupabaseServerClient, isSupabaseServerConfigured, SUPABASE_SERVER_CONFIG_ERROR } from "./supabaseServer";
import type {
  AcademicSessionRecord,
  AcademicTermRecord,
  AttendanceRecord,
  AuditLogRecord,
  ClassLevelRecord,
  ClassroomMaterialRecord,
  ClassroomRecord,
  CurriculumTopicRecord,
  LmsStateData,
  LmsUserRole,
  ParentStudentLinkRecord,
  PaymentRecord,
  PersistentNotification,
  PlatformSettingsRecord,
  QuizAttemptRecord,
  SchoolRecord,
  StudentEnrolmentRecord,
  StudentEntitlementRecord,
  StudentGroupRecord,
  SubjectRecord,
  SubscriptionPlanRecord,
  TeacherSubjectApplication,
  TeacherSubjectApproval,
  TimetableEntryRecord,
  VideoLessonRecord,
  VideoQuestionRecord,
  VideoUploadRequestRecord,
} from "./lmsTypes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toPgUuid(rawId: string): string {
  const clean = String(rawId || "").trim();
  if (UUID_RE.test(clean)) return clean.toLowerCase();
  const hash = crypto.createHash("sha256").update(`learnova-uuid:${clean}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function isRealUuid(rawId: string | undefined | null): boolean {
  return Boolean(rawId && UUID_RE.test(String(rawId).trim()));
}

function resolveId(
  row: { id: string; external_id?: string | null },
  uuidToExt: Map<string, string>
): string {
  const ext = row.external_id || uuidToExt.get(row.id) || row.id;
  uuidToExt.set(row.id, ext);
  return ext;
}

function mapFk(uuid: string | null | undefined, uuidToExt: Map<string, string>): string {
  if (!uuid) return "";
  return uuidToExt.get(uuid) || uuid;
}

function buildReverseMap(rows: Array<{ id: string; external_id?: string | null }>, uuidToExt: Map<string, string>) {
  for (const r of rows) {
    if (r?.id) {
      uuidToExt.set(r.id, r.external_id || r.id);
    }
  }
}

export async function seedInitialCatalogToPg(initial: LmsStateData): Promise<void> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  const sb = getSupabaseServerClient();

  await sb.from("schools").upsert(
    initial.schools.map((s) => ({
      id: toPgUuid(s.id),
      external_id: s.id,
      name: s.name,
      code: s.code,
      state: s.state,
      address: s.address,
      timezone: s.timezone,
      status: s.status,
      created_at: s.createdAt,
    })),
    { onConflict: "id" }
  );

  await sb.from("class_levels").upsert(
    initial.classLevels.map((c) => ({
      id: toPgUuid(c.id),
      external_id: c.id,
      school_id: toPgUuid(c.schoolId),
      code: c.code,
      name: c.name,
      category: c.category,
      sort_order: c.sortOrder,
      is_active: c.isActive,
    })),
    { onConflict: "id" }
  );

  await sb.from("subjects").upsert(
    initial.subjects.map((sub) => ({
      id: toPgUuid(sub.id),
      external_id: sub.id,
      school_id: toPgUuid(sub.schoolId),
      code: sub.code,
      name: sub.name,
      department: sub.department,
      description: sub.description,
      is_active: sub.isActive,
    })),
    { onConflict: "id" }
  );

  const sclRows: Array<{ subject_id: string; class_level_id: string }> = [];
  for (const sub of initial.subjects) {
    for (const lvlId of sub.classLevelIds) {
      sclRows.push({
        subject_id: toPgUuid(sub.id),
        class_level_id: toPgUuid(lvlId),
      });
    }
  }
  if (sclRows.length > 0) {
    await sb
      .from("subject_class_levels")
      .upsert(sclRows, { onConflict: "subject_id,class_level_id" });
  }

  await sb.from("academic_sessions").upsert(
    initial.sessions.map((s) => ({
      id: toPgUuid(s.id),
      external_id: s.id,
      school_id: toPgUuid(initial.schools[0].id),
      name: s.name,
      is_current: s.isCurrent,
    })),
    { onConflict: "id" }
  );

  await sb.from("academic_terms").upsert(
    initial.terms.map((t) => ({
      id: toPgUuid(t.id),
      external_id: t.id,
      session_id: toPgUuid(t.sessionId),
      name: t.name,
      starts_at: t.startsAt,
      ends_at: t.endsAt,
      is_current: t.isCurrent,
    })),
    { onConflict: "id" }
  );

  await sb.from("subscription_plans").upsert(
    initial.subscriptionPlans.map((p) => ({
      id: toPgUuid(p.id),
      external_id: p.id,
      name: p.name,
      billing_cycle: p.billingCycle,
      price_ngn: p.priceNgn,
      included_subject_ids: p.includedSubjectIds,
      all_subjects_included: p.allSubjectsIncluded,
      duration_days: p.durationDays,
      is_active: p.isActive,
      description: p.description,
    })),
    { onConflict: "id" }
  );

  await sb.from("platform_settings").upsert(
    {
      id: "global",
      platform_name: initial.platformSettings.platformName,
      default_timezone: initial.platformSettings.defaultTimezone,
      default_room_capacity: initial.platformSettings.defaultRoomCapacity,
      allow_manual_bank_transfer: initial.platformSettings.allowManualBankTransfer,
      super_admin_emails: initial.platformSettings.superAdminEmails,
    },
    { onConflict: "id" }
  );

  if (initial.curriculumTopics.length > 0) {
    await sb.from("curriculum_topics").upsert(
      initial.curriculumTopics.map((t) => ({
        id: toPgUuid(t.id),
        external_id: t.id,
        subject_id: toPgUuid(t.subjectId),
        term_id: toPgUuid(t.termId),
        class_level_id: toPgUuid(t.classLevelId),
        topic_order: t.topicOrder,
        week_label: t.weekLabel || null,
        title: t.title,
        description: t.description,
        is_published: t.isPublished,
        created_by: t.createdBy,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  if (initial.videoLessons.length > 0) {
    await sb.from("video_lessons").upsert(
      initial.videoLessons.map((v) => ({
        id: toPgUuid(v.id),
        external_id: v.id,
        topic_id: toPgUuid(v.topicId),
        subject_id: toPgUuid(v.subjectId),
        term_id: toPgUuid(v.termId),
        class_level_id: toPgUuid(v.classLevelId),
        title: v.title,
        description: v.description,
        source_type: v.sourceType,
        video_url: v.videoUrl,
        youtube_video_id: v.youtubeVideoId || null,
        storage_path: v.storagePath || null,
        mime_type: v.mimeType || null,
        file_size_bytes: v.fileSizeBytes ?? null,
        duration_label: v.durationLabel || null,
        materials: v.materials || [],
        uploaded_by_user_id: v.uploadedByUserId,
        uploaded_by_name: v.uploadedByName,
        uploaded_by_role: v.uploadedByRole,
        status: v.status,
        review_notes: v.reviewNotes || null,
        request_id: v.requestId || null,
        view_count: v.viewCount,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
      })),
      { onConflict: "id" }
    );
  }
}

export async function loadLmsStateFromPg(
  createInitialLmsState: () => LmsStateData,
  allowSeed = true
): Promise<LmsStateData> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  const sb = getSupabaseServerClient();

  const [
    schoolsRes,
    levelsRes,
    subjectsRes,
    sclRes,
    sessionsRes,
    termsRes,
    plansRes,
    settingsRes,
    appsRes,
    approvalsRes,
    enrolmentsRes,
    paymentsRes,
    entitlementsRes,
    timetableRes,
    taRes,
    groupsRes,
    gmRes,
    classroomsRes,
    attendanceRes,
    materialsRes,
    topicsRes,
    videosRes,
    vreqRes,
    quizRes,
    vqaRes,
    parentLinksRes,
    notifRes,
    auditRes,
    profilesRes,
  ] = await Promise.all([
    sb.from("schools").select("*").order("created_at", { ascending: true }),
    sb.from("class_levels").select("*").order("sort_order", { ascending: true }),
    sb.from("subjects").select("*").order("name", { ascending: true }),
    sb.from("subject_class_levels").select("*"),
    sb.from("academic_sessions").select("*"),
    sb.from("academic_terms").select("*").order("starts_at", { ascending: true }),
    sb.from("subscription_plans").select("*").order("price_ngn", { ascending: true }),
    sb.from("platform_settings").select("*").eq("id", "global").maybeSingle(),
    sb.from("teacher_subject_applications").select("*").order("created_at", { ascending: false }),
    sb.from("teacher_subject_approvals").select("*").order("approved_at", { ascending: false }),
    sb.from("student_enrolments").select("*"),
    sb.from("payment_records").select("*").order("created_at", { ascending: false }),
    sb.from("subscription_entitlements").select("*").order("updated_at", { ascending: false }),
    sb.from("timetable_entries").select("*").order("created_at", { ascending: false }),
    sb.from("teacher_assignments").select("*"),
    sb.from("student_groups").select("*").order("group_number", { ascending: true }),
    sb.from("student_group_memberships").select("*"),
    sb.from("classroom_records").select("*").order("created_at", { ascending: false }),
    sb.from("attendance_records").select("*"),
    sb.from("learning_materials").select("*").order("created_at", { ascending: false }),
    sb.from("curriculum_topics").select("*").order("topic_order", { ascending: true }),
    sb.from("video_lessons").select("*").order("created_at", { ascending: false }),
    sb.from("video_upload_requests").select("*").order("created_at", { ascending: false }),
    sb.from("quiz_attempts").select("*").order("created_at", { ascending: false }),
    sb.from("video_questions").select("*").order("created_at", { ascending: false }),
    sb.from("parent_student_links").select("*").order("linked_at", { ascending: false }),
    sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("profiles").select("id, full_name, email"),
  ]);

  const initial = createInitialLmsState();

  const coreCatalogMissing =
    !schoolsRes.error &&
    !levelsRes.error &&
    !subjectsRes.error &&
    ((schoolsRes.data?.length || 0) === 0 ||
      (levelsRes.data?.length || 0) === 0 ||
      (subjectsRes.data?.length || 0) === 0);

  const topicsMissing =
    !topicsRes.error &&
    (topicsRes.data?.length || 0) === 0 &&
    initial.curriculumTopics.length > 0;

  if (allowSeed && (coreCatalogMissing || topicsMissing)) {
    try {
      await seedInitialCatalogToPg(initial);
    } catch (seedErr) {
      console.warn("Catalog auto-seed skipped:", seedErr);
      return initial;
    }
    return loadLmsStateFromPg(createInitialLmsState, false);
  }

  if (schoolsRes.error && levelsRes.error && subjectsRes.error) {
    console.warn("Postgres LMS state unavailable, falling back to initial state:", schoolsRes.error.message);
    return initial;
  }

  const uuidToExt = new Map<string, string>();
  buildReverseMap(schoolsRes.data || [], uuidToExt);
  buildReverseMap(levelsRes.data || [], uuidToExt);
  buildReverseMap(subjectsRes.data || [], uuidToExt);
  buildReverseMap(sessionsRes.data || [], uuidToExt);
  buildReverseMap(termsRes.data || [], uuidToExt);
  buildReverseMap(plansRes.data || [], uuidToExt);
  buildReverseMap(appsRes.data || [], uuidToExt);
  buildReverseMap(approvalsRes.data || [], uuidToExt);
  buildReverseMap(paymentsRes.data || [], uuidToExt);
  buildReverseMap(entitlementsRes.data || [], uuidToExt);
  buildReverseMap(timetableRes.data || [], uuidToExt);
  buildReverseMap(groupsRes.data || [], uuidToExt);
  buildReverseMap(classroomsRes.data || [], uuidToExt);
  buildReverseMap(topicsRes.data || [], uuidToExt);
  buildReverseMap(videosRes.data || [], uuidToExt);
  buildReverseMap(vreqRes.data || [], uuidToExt);
  buildReverseMap(quizRes.data || [], uuidToExt);
  buildReverseMap(vqaRes.data || [], uuidToExt);
  buildReverseMap(parentLinksRes.data || [], uuidToExt);

  const profileMap = new Map<string, { fullName: string; email: string }>();
  for (const p of profilesRes.data || []) {
    profileMap.set(p.id, { fullName: p.full_name || p.email, email: p.email || "" });
  }

  const schools: SchoolRecord[] = (schoolsRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    name: r.name,
    code: r.code,
    state: r.state || "Lagos",
    address: r.address || "",
    timezone: r.timezone || "Africa/Lagos",
    status: r.status || "ACTIVE",
    createdAt: r.created_at || new Date().toISOString(),
  }));

  const classLevels: ClassLevelRecord[] = (levelsRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    schoolId: mapFk(r.school_id, uuidToExt) || schools[0]?.id || "school-learnova-ng",
    code: r.code,
    name: r.name,
    category: r.category,
    sortOrder: Number(r.sort_order ?? 1),
    isActive: Boolean(r.is_active),
  }));

  const sclBySub = new Map<string, string[]>();
  for (const row of sclRes.data || []) {
    const sId = mapFk(row.subject_id, uuidToExt);
    const lId = mapFk(row.class_level_id, uuidToExt);
    const arr = sclBySub.get(sId) || [];
    arr.push(lId);
    sclBySub.set(sId, arr);
  }

  const subjects: SubjectRecord[] = (subjectsRes.data || []).map((r: any) => {
    const id = resolveId(r, uuidToExt);
    return {
      id,
      schoolId: mapFk(r.school_id, uuidToExt) || schools[0]?.id || "school-learnova-ng",
      code: r.code,
      name: r.name,
      department: (r.department || "Core") as SubjectRecord["department"],
      description: r.description || "",
      classLevelIds: sclBySub.get(id) || [],
      isActive: Boolean(r.is_active),
    };
  });

  const sessions: AcademicSessionRecord[] = (sessionsRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    name: r.name,
    isCurrent: Boolean(r.is_current),
  }));

  const terms: AcademicTermRecord[] = (termsRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    sessionId: mapFk(r.session_id, uuidToExt),
    name: r.name,
    startsAt: String(r.starts_at),
    endsAt: String(r.ends_at),
    isCurrent: Boolean(r.is_current),
  }));

  const subscriptionPlans: SubscriptionPlanRecord[] = (plansRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    name: r.name,
    billingCycle: r.billing_cycle,
    priceNgn: Number(r.price_ngn ?? 0),
    allSubjectsIncluded: Boolean(r.all_subjects_included),
    includedSubjectIds: Array.isArray(r.included_subject_ids) ? r.included_subject_ids : [],
    durationDays: Number(r.duration_days ?? 90),
    isActive: Boolean(r.is_active),
    description: r.description || "",
  }));

  const settingsRow = settingsRes.data as any;
  const platformSettings: PlatformSettingsRecord = {
    platformName: settingsRow?.platform_name || initial.platformSettings.platformName,
    defaultTimezone: settingsRow?.default_timezone || "Africa/Lagos",
    defaultRoomCapacity: Number(settingsRow?.default_room_capacity ?? 50),
    paystackPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
    paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
    allowManualBankTransfer:
      typeof settingsRow?.allow_manual_bank_transfer === "boolean"
        ? settingsRow.allow_manual_bank_transfer
        : true,
    superAdminEmails:
      Array.isArray(settingsRow?.super_admin_emails) && settingsRow.super_admin_emails.length > 0
        ? settingsRow.super_admin_emails
        : initial.platformSettings.superAdminEmails,
  };

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const levelById = new Map(classLevels.map((l) => [l.id, l]));
  const planById = new Map(subscriptionPlans.map((p) => [p.id, p]));

  const teacherApplications: TeacherSubjectApplication[] = (appsRes.data || []).map((r: any) => {
    const p = profileMap.get(r.teacher_user_id);
    const subId = mapFk(r.subject_id, uuidToExt);
    return {
      id: resolveId(r, uuidToExt),
      teacherUserId: r.teacher_user_id,
      teacherName: r.teacher_name || p?.fullName || "Educator",
      teacherEmail: r.teacher_email || p?.email || "",
      subjectId: subId,
      subjectName: r.subject_name || subjectById.get(subId)?.name || "Subject",
      classLevelIds: Array.isArray(r.class_level_ids) ? r.class_level_ids : [],
      qualification: r.qualification || "",
      institution: r.institution || "",
      experience: r.experience_years || "",
      licenseNumber: r.license_number || "",
      bio: r.bio || "",
      documentUrls: r.document_urls || {},
      status: r.status,
      adminExplanation: r.admin_explanation || undefined,
      internalNotes: r.internal_notes || undefined,
      history: Array.isArray(r.history) ? r.history : [],
      reviewedBy: r.reviewed_by || undefined,
      reviewedAt: r.reviewed_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  const teacherApprovals: TeacherSubjectApproval[] = (approvalsRes.data || []).map((r: any) => {
    const p = profileMap.get(r.teacher_user_id);
    const subId = mapFk(r.subject_id, uuidToExt);
    const lvlId = mapFk(r.class_level_id, uuidToExt);
    return {
      id: resolveId(r, uuidToExt),
      teacherUserId: r.teacher_user_id,
      teacherName: r.teacher_name || p?.fullName || "Educator",
      subjectId: subId,
      subjectName: r.subject_name || subjectById.get(subId)?.name || "Subject",
      classLevelId: lvlId,
      classLevelName: r.class_level_name || levelById.get(lvlId)?.code || lvlId,
      applicationId: r.application_id ? mapFk(r.application_id, uuidToExt) : undefined,
      status: r.status,
      approvedBy: r.approved_by || "Admin",
      reason: r.reason || undefined,
      approvedAt: r.approved_at,
    };
  });

  // Group normalized student_enrolments rows by student_user_id
  const enrolmentByStudent = new Map<string, StudentEnrolmentRecord>();
  for (const r of enrolmentsRes.data || []) {
    const sid = r.student_user_id;
    const p = profileMap.get(sid);
    const lvlId = mapFk(r.class_level_id, uuidToExt);
    const subId = mapFk(r.subject_id, uuidToExt);
    const existing = enrolmentByStudent.get(sid);
    if (!existing) {
      enrolmentByStudent.set(sid, {
        id: `enr-${sid}`,
        studentUserId: sid,
        studentName: p?.fullName || "Student",
        studentEmail: p?.email || "",
        classLevelId: lvlId,
        subjectIds: subId ? [subId] : [],
        status: r.status === "REGISTERED" ? "REGISTERED" : "ENROLLED",
        updatedAt: r.created_at || new Date().toISOString(),
      });
    } else if (subId && !existing.subjectIds.includes(subId)) {
      existing.subjectIds.push(subId);
      if (r.status === "ENROLLED") existing.status = "ENROLLED";
    }
  }
  const studentEnrolments = Array.from(enrolmentByStudent.values());

  const paymentRecords: PaymentRecord[] = (paymentsRes.data || []).map((r: any) => {
    const p = profileMap.get(r.student_user_id);
    const planId = r.plan_id ? mapFk(r.plan_id, uuidToExt) : undefined;
    return {
      id: resolveId(r, uuidToExt),
      studentUserId: r.student_user_id,
      studentName: r.student_name || p?.fullName || "Student",
      studentEmail: r.student_email || p?.email || "",
      planId,
      planName: r.plan_name || (planId ? planById.get(planId)?.name : undefined) || "Learnova Plan",
      classLevelId: r.class_level_id ? mapFk(r.class_level_id, uuidToExt) : "",
      subjectIds: Array.isArray(r.subject_ids) ? r.subject_ids : [],
      amountNgn: Number(r.amount_ngn ?? 0),
      provider: r.provider,
      reference: r.reference,
      status: r.status,
      verifiedBy: r.verified_by || undefined,
      verifiedAt: r.verified_at || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    };
  });

  const studentEntitlements: StudentEntitlementRecord[] = (entitlementsRes.data || []).map((r: any) => {
    const p = profileMap.get(r.student_user_id);
    return {
      id: resolveId(r, uuidToExt),
      studentUserId: r.student_user_id,
      studentName: r.student_name || p?.fullName || "Student",
      studentEmail: r.student_email || p?.email || "",
      classLevelId: mapFk(r.class_level_id, uuidToExt),
      subjectIds: Array.isArray(r.subject_ids) ? r.subject_ids : [],
      allSubjects: Boolean(r.all_subjects),
      accessStatus: r.access_status,
      paymentId: r.payment_id ? mapFk(r.payment_id, uuidToExt) : undefined,
      startsAt: r.starts_at,
      expiresAt: r.expires_at || undefined,
      grantedBy: r.granted_by || undefined,
      reason: r.reason || undefined,
      updatedAt: r.updated_at,
    };
  });

  const taByTt = new Map<string, string[]>();
  for (const row of taRes.data || []) {
    const ttId = mapFk(row.timetable_entry_id, uuidToExt);
    const list = taByTt.get(ttId) || [];
    list.push(row.teacher_user_id);
    taByTt.set(ttId, list);
  }

  const timetableEntries: TimetableEntryRecord[] = (timetableRes.data || []).map((r: any) => {
    const id = resolveId(r, uuidToExt);
    return {
      id,
      sessionId: mapFk(r.session_id, uuidToExt) || sessions[0]?.id || "sess-2025-2026",
      termId: mapFk(r.term_id, uuidToExt) || terms.find((t) => t.isCurrent)?.id || "term-second-2026",
      classLevelId: mapFk(r.class_level_id, uuidToExt),
      subjectId: mapFk(r.subject_id, uuidToExt),
      assignedTeacherIds: taByTt.get(id) || [],
      dayOfWeek: r.day_of_week,
      startTime: String(r.start_time).slice(0, 5),
      endTime: String(r.end_time).slice(0, 5),
      durationMinutes: Number(r.duration_minutes ?? 60),
      mode: r.teaching_mode || "ONLINE",
      maxCapacityPerRoom: Number(r.max_capacity_per_room ?? 50),
      publicationStatus: r.publication_status || "DRAFT",
      allocationStatus: r.allocation_status || "UNALLOCATED",
      eligibleStudentCount: Number(r.eligible_student_count ?? 0),
      shortfallCount: Number(r.shortfall_count ?? 0),
      createdBy: r.created_by || "admin",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  const gmByGroup = new Map<string, string[]>();
  for (const row of gmRes.data || []) {
    const gid = mapFk(row.student_group_id, uuidToExt);
    const list = gmByGroup.get(gid) || [];
    list.push(row.student_user_id);
    gmByGroup.set(gid, list);
  }

  const studentGroups: StudentGroupRecord[] = (groupsRes.data || []).map((r: any) => {
    const id = resolveId(r, uuidToExt);
    const p = profileMap.get(r.teacher_user_id);
    return {
      id,
      timetableEntryId: mapFk(r.timetable_entry_id, uuidToExt),
      groupNumber: Number(r.group_number ?? 1),
      groupName: r.group_name,
      teacherUserId: r.teacher_user_id,
      teacherName: r.teacher_name || p?.fullName || "Educator",
      maxCapacity: Number(r.max_capacity ?? 50),
      studentUserIds: gmByGroup.get(id) || [],
      createdAt: r.created_at,
    };
  });

  const groupById = new Map(studentGroups.map((g) => [g.id, g]));
  const ttById = new Map(timetableEntries.map((t) => [t.id, t]));

  const matsByClassroom = new Map<string, ClassroomMaterialRecord[]>();
  for (const m of materialsRes.data || []) {
    if (!m.classroom_id) continue;
    const cid = mapFk(m.classroom_id, uuidToExt);
    const p = profileMap.get(m.uploaded_by);
    const arr = matsByClassroom.get(cid) || [];
    arr.push({
      id: m.id,
      title: m.title,
      type: m.material_type || "PDF",
      url: m.file_url || undefined,
      uploadedBy: p?.fullName || "Educator",
      createdAt: m.created_at,
    });
    matsByClassroom.set(cid, arr);
  }

  const classrooms: ClassroomRecord[] = (classroomsRes.data || []).map((r: any) => {
    const id = resolveId(r, uuidToExt);
    const gid = mapFk(r.student_group_id, uuidToExt);
    const ttid = mapFk(r.timetable_entry_id, uuidToExt);
    const grp = groupById.get(gid);
    const tt = ttById.get(ttid);
    const subId = mapFk(r.subject_id, uuidToExt);
    const lvlId = mapFk(r.class_level_id, uuidToExt);
    const p = profileMap.get(r.teacher_user_id);
    return {
      id,
      timetableEntryId: ttid,
      studentGroupId: gid,
      groupName: r.group_name || grp?.groupName || "Group 1",
      teacherUserId: r.teacher_user_id,
      teacherName: r.teacher_name || p?.fullName || grp?.teacherName || "Educator",
      classLevelId: lvlId,
      classLevelName: r.class_level_name || levelById.get(lvlId)?.code || lvlId,
      subjectId: subId,
      subjectName: r.subject_name || subjectById.get(subId)?.name || subId,
      dayOfWeek: r.day_of_week || tt?.dayOfWeek || "Monday",
      startTime: r.start_time || tt?.startTime || "09:00",
      endTime: r.end_time || tt?.endTime || "10:00",
      mode: r.teaching_mode || tt?.mode || "ONLINE",
      maxCapacity: Number(r.max_capacity ?? grp?.maxCapacity ?? 50),
      studentUserIds: grp?.studentUserIds || [],
      lessonTitle: r.lesson_title || "",
      lessonDescription: r.lesson_description || "",
      lessonObjectives: r.lesson_objectives || "",
      lessonNotes: r.lesson_notes || "",
      assignmentsText: r.assignments_text || "",
      materials: matsByClassroom.get(id) || [],
      status: r.status || "SCHEDULED",
      preparedAt: r.prepared_at || undefined,
      startedAt: r.started_at || undefined,
      endedAt: r.ended_at || undefined,
      durationSeconds: Number(r.duration_seconds ?? 0),
    };
  });

  const attendanceRecords: AttendanceRecord[] = (attendanceRes.data || []).map((r: any) => {
    const p = profileMap.get(r.student_user_id);
    return {
      id: r.id,
      classroomId: mapFk(r.classroom_id, uuidToExt),
      studentUserId: r.student_user_id,
      studentName: r.student_name || p?.fullName || "Student",
      status: r.status,
      joinedAt: r.joined_at || undefined,
      recordedBy: r.recorded_by || "System",
      updatedAt: r.updated_at,
    };
  });

  const curriculumTopics: CurriculumTopicRecord[] = (topicsRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    subjectId: mapFk(r.subject_id, uuidToExt),
    termId: mapFk(r.term_id, uuidToExt),
    classLevelId: mapFk(r.class_level_id, uuidToExt),
    topicOrder: Number(r.topic_order ?? 1),
    weekLabel: r.week_label || undefined,
    title: r.title,
    description: r.description || "",
    isPublished: Boolean(r.is_published),
    createdBy: r.created_by || "system",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const videoLessons: VideoLessonRecord[] = (videosRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    topicId: mapFk(r.topic_id, uuidToExt),
    subjectId: mapFk(r.subject_id, uuidToExt),
    termId: mapFk(r.term_id, uuidToExt),
    classLevelId: mapFk(r.class_level_id, uuidToExt),
    title: r.title,
    description: r.description || "",
    sourceType: r.source_type,
    videoUrl: r.video_url,
    youtubeVideoId: r.youtube_video_id || undefined,
    storagePath: r.storage_path || undefined,
    mimeType: r.mime_type || undefined,
    fileSizeBytes: r.file_size_bytes ? Number(r.file_size_bytes) : undefined,
    durationLabel: r.duration_label || undefined,
    materials: Array.isArray(r.materials) ? r.materials : [],
    uploadedByUserId: r.uploaded_by_user_id,
    uploadedByName: r.uploaded_by_name,
    uploadedByRole: r.uploaded_by_role as LmsUserRole,
    status: r.status,
    reviewNotes: r.review_notes || undefined,
    requestId: r.request_id || undefined,
    viewCount: Number(r.view_count ?? 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const videoUploadRequests: VideoUploadRequestRecord[] = (vreqRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    topicId: mapFk(r.topic_id, uuidToExt),
    subjectId: mapFk(r.subject_id, uuidToExt),
    termId: mapFk(r.term_id, uuidToExt),
    classLevelId: mapFk(r.class_level_id, uuidToExt),
    teacherUserId: r.teacher_user_id,
    teacherName: r.teacher_name,
    requestedByUserId: r.requested_by_user_id || "",
    requestedByName: r.requested_by_name,
    instructions: r.instructions,
    dueDate: r.due_date || undefined,
    status: r.status,
    fulfilledVideoId: r.fulfilled_video_id || undefined,
    adminReviewNotes: r.admin_review_notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const quizAttempts: QuizAttemptRecord[] = (quizRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    studentUserId: r.student_user_id,
    studentName: r.student_name,
    subjectId: mapFk(r.subject_id, uuidToExt),
    subjectName: r.subject_name,
    topicId: r.topic_id || undefined,
    topicTitle: r.topic_title || undefined,
    quizType: r.quiz_type,
    title: r.title,
    score: Number(r.score ?? 0),
    total: Number(r.total ?? 0),
    percentage: Number(r.percentage ?? 0),
    durationSeconds: Number(r.duration_seconds ?? 0),
    createdAt: r.created_at,
  }));

  const videoQuestions: VideoQuestionRecord[] = (vqaRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    videoId: mapFk(r.video_id, uuidToExt),
    topicId: mapFk(r.topic_id, uuidToExt),
    timestampLabel: r.timestamp_label || undefined,
    authorUserId: r.author_user_id,
    authorName: r.author_name,
    authorRole: r.author_role as LmsUserRole,
    question: r.question,
    replies: Array.isArray(r.replies) ? r.replies : [],
    createdAt: r.created_at,
  }));

  const parentStudentLinks: ParentStudentLinkRecord[] = (parentLinksRes.data || []).map((r: any) => ({
    id: resolveId(r, uuidToExt),
    parentUserId: r.parent_user_id,
    parentEmail: r.parent_email,
    studentUserId: r.student_user_id,
    studentEmail: r.student_email,
    relationship: r.relationship || "Parent / Guardian",
    status: r.status || "VERIFIED",
    verificationCode: r.verification_code || undefined,
    verifiedBy: r.verified_by || undefined,
    verifiedAt: r.verified_at || undefined,
    linkedAt: r.linked_at,
  }));

  const notifications: PersistentNotification[] = (notifRes.data || []).map((r: any) => ({
    id: r.id,
    recipientUserId: r.recipient_user_id || "ALL_ADMINS",
    recipientRole: (r.recipient_role || undefined) as PersistentNotification["recipientRole"],
    category: r.category,
    title: r.title,
    message: r.message,
    href: r.href || undefined,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
  }));

  const auditLogs: AuditLogRecord[] = (auditRes.data || []).map((r: any) => ({
    id: r.id,
    actorUserId: r.actor_user_id || "system",
    actorEmail: r.actor_email || "",
    actorRole: r.actor_role || "",
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id || "",
    reason: r.reason || undefined,
    metadata: r.metadata || undefined,
    createdAt: r.created_at,
  }));

  return {
    schools,
    classLevels,
    subjects,
    sessions,
    terms,
    subscriptionPlans,
    platformSettings,
    teacherApplications,
    teacherApprovals,
    studentEnrolments,
    paymentRecords,
    studentEntitlements,
    timetableEntries,
    studentGroups,
    classrooms,
    attendanceRecords,
    curriculumTopics,
    videoLessons,
    videoUploadRequests,
    quizAttempts,
    videoQuestions,
    parentStudentLinks,
    notifications,
    auditLogs,
  };
}

async function deleteMissingByIds(
  table: string,
  prevItems: Array<{ id: string }>,
  nextItems: Array<{ id: string }>
) {
  const nextSet = new Set(nextItems.map((i) => i.id));
  const removed = prevItems.filter((i) => !nextSet.has(i.id)).map((i) => toPgUuid(i.id));
  if (removed.length > 0) {
    const sb = getSupabaseServerClient();
    await sb.from(table).delete().in("id", removed);
  }
}

export async function saveLmsStateToPg(
  state: LmsStateData,
  prevState?: LmsStateData
): Promise<void> {
  if (!isSupabaseServerConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }
  const sb = getSupabaseServerClient();

  // 1. Schools, Class Levels, Subjects, Sessions, Terms, Plans, Settings
  if (state.schools.length > 0) {
    await sb.from("schools").upsert(
      state.schools.map((s) => ({
        id: toPgUuid(s.id),
        external_id: s.id,
        name: s.name,
        code: s.code,
        state: s.state,
        address: s.address,
        timezone: s.timezone,
        status: s.status,
        created_at: s.createdAt,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" }
    );
  }

  if (state.classLevels.length > 0) {
    await sb.from("class_levels").upsert(
      state.classLevels.map((c) => ({
        id: toPgUuid(c.id),
        external_id: c.id,
        school_id: toPgUuid(c.schoolId),
        code: c.code,
        name: c.name,
        category: c.category,
        sort_order: c.sortOrder,
        is_active: c.isActive,
      })),
      { onConflict: "id" }
    );
  }

  if (state.subjects.length > 0) {
    await sb.from("subjects").upsert(
      state.subjects.map((sub) => ({
        id: toPgUuid(sub.id),
        external_id: sub.id,
        school_id: toPgUuid(sub.schoolId),
        code: sub.code,
        name: sub.name,
        department: sub.department,
        description: sub.description,
        is_active: sub.isActive,
      })),
      { onConflict: "id" }
    );

    const sclRows: Array<{ subject_id: string; class_level_id: string }> = [];
    for (const sub of state.subjects) {
      for (const lvlId of sub.classLevelIds) {
        sclRows.push({
          subject_id: toPgUuid(sub.id),
          class_level_id: toPgUuid(lvlId),
        });
      }
    }
    if (sclRows.length > 0) {
      await sb.from("subject_class_levels").upsert(sclRows, {
        onConflict: "subject_id,class_level_id",
      });
    }
  }

  if (state.sessions.length > 0) {
    await sb.from("academic_sessions").upsert(
      state.sessions.map((s) => ({
        id: toPgUuid(s.id),
        external_id: s.id,
        school_id: toPgUuid(state.schools[0]?.id || "school-learnova-ng"),
        name: s.name,
        is_current: s.isCurrent,
      })),
      { onConflict: "id" }
    );
  }

  if (state.terms.length > 0) {
    await sb.from("academic_terms").upsert(
      state.terms.map((t) => ({
        id: toPgUuid(t.id),
        external_id: t.id,
        session_id: toPgUuid(t.sessionId),
        name: t.name,
        starts_at: t.startsAt,
        ends_at: t.endsAt,
        is_current: t.isCurrent,
      })),
      { onConflict: "id" }
    );
  }

  if (state.subscriptionPlans.length > 0) {
    await sb.from("subscription_plans").upsert(
      state.subscriptionPlans.map((p) => ({
        id: toPgUuid(p.id),
        external_id: p.id,
        name: p.name,
        billing_cycle: p.billingCycle,
        price_ngn: p.priceNgn,
        included_subject_ids: p.includedSubjectIds,
        all_subjects_included: p.allSubjectsIncluded,
        duration_days: p.durationDays,
        is_active: p.isActive,
        description: p.description,
      })),
      { onConflict: "id" }
    );
  }

  await sb.from("platform_settings").upsert(
    {
      id: "global",
      platform_name: state.platformSettings.platformName,
      default_timezone: state.platformSettings.defaultTimezone,
      default_room_capacity: state.platformSettings.defaultRoomCapacity,
      allow_manual_bank_transfer: state.platformSettings.allowManualBankTransfer,
      super_admin_emails: state.platformSettings.superAdminEmails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // 2. Teacher Applications & Approvals
  const validApps = state.teacherApplications.filter((a) => isRealUuid(a.teacherUserId));
  if (validApps.length > 0) {
    await sb.from("teacher_subject_applications").upsert(
      validApps.map((a) => ({
        id: toPgUuid(a.id),
        external_id: a.id,
        teacher_user_id: a.teacherUserId,
        teacher_name: a.teacherName,
        teacher_email: a.teacherEmail,
        subject_id: toPgUuid(a.subjectId),
        subject_name: a.subjectName,
        class_level_ids: a.classLevelIds,
        qualification: a.qualification,
        institution: a.institution,
        experience_years: a.experience,
        license_number: a.licenseNumber,
        bio: a.bio,
        document_urls: a.documentUrls,
        status: a.status,
        admin_explanation: a.adminExplanation || null,
        internal_notes: a.internalNotes || null,
        history: Array.isArray(a.history) ? a.history : [],
        reviewed_by: isRealUuid(a.reviewedBy) ? a.reviewedBy : null,
        reviewed_at: a.reviewedAt || null,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  const validApprovals = state.teacherApprovals.filter((a) => isRealUuid(a.teacherUserId));
  if (validApprovals.length > 0) {
    await sb.from("teacher_subject_approvals").upsert(
      validApprovals.map((a) => ({
        id: toPgUuid(a.id),
        external_id: a.id,
        teacher_user_id: a.teacherUserId,
        teacher_name: a.teacherName,
        subject_id: toPgUuid(a.subjectId),
        subject_name: a.subjectName,
        class_level_id: toPgUuid(a.classLevelId),
        class_level_name: a.classLevelName,
        application_id: a.applicationId ? toPgUuid(a.applicationId) : null,
        status: a.status,
        approved_by: isRealUuid(a.approvedBy) ? a.approvedBy : null,
        reason: a.reason || null,
        approved_at: a.approvedAt,
      })),
      { onConflict: "teacher_user_id,subject_id,class_level_id" }
    );
  }

  // 3. Student Enrolments (sync per student)
  for (const enr of state.studentEnrolments) {
    if (!isRealUuid(enr.studentUserId)) continue;
    const prevEnr = prevState?.studentEnrolments.find((e) => e.studentUserId === enr.studentUserId);
    const changed =
      !prevEnr ||
      prevEnr.classLevelId !== enr.classLevelId ||
      prevEnr.status !== enr.status ||
      JSON.stringify(prevEnr.subjectIds) !== JSON.stringify(enr.subjectIds);
    if (!changed) continue;

    await sb.from("student_enrolments").delete().eq("student_user_id", enr.studentUserId);
    const subList = enr.subjectIds.length > 0 ? enr.subjectIds : [state.subjects[0]?.id].filter(Boolean);
    if (subList.length > 0 && enr.classLevelId) {
      await sb.from("student_enrolments").upsert(
        subList.map((sid) => ({
          student_user_id: enr.studentUserId,
          class_level_id: toPgUuid(enr.classLevelId),
          subject_id: toPgUuid(sid),
          status: enr.status === "REGISTERED" ? "REGISTERED" : "ENROLLED",
        })),
        { onConflict: "student_user_id,class_level_id,subject_id" }
      );
    }
  }

  // 4. Payments & Entitlements
  const validPayments = state.paymentRecords.filter((p) => isRealUuid(p.studentUserId));
  if (validPayments.length > 0) {
    await sb.from("payment_records").upsert(
      validPayments.map((p) => ({
        id: toPgUuid(p.id),
        external_id: p.id,
        student_user_id: p.studentUserId,
        student_name: p.studentName,
        student_email: p.studentEmail,
        plan_id: p.planId ? toPgUuid(p.planId) : null,
        plan_name: p.planName,
        class_level_id: p.classLevelId ? toPgUuid(p.classLevelId) : null,
        subject_ids: p.subjectIds,
        amount_ngn: p.amountNgn,
        provider: p.provider,
        reference: p.reference,
        status: p.status,
        verified_by: isRealUuid(p.verifiedBy) ? p.verifiedBy : null,
        verified_at: p.verifiedAt || null,
        notes: p.notes || null,
        created_at: p.createdAt,
      })),
      { onConflict: "id" }
    );
  }

  const validEntitlements = state.studentEntitlements.filter((e) => isRealUuid(e.studentUserId));
  if (validEntitlements.length > 0) {
    await sb.from("subscription_entitlements").upsert(
      validEntitlements.map((e) => ({
        id: toPgUuid(e.id),
        external_id: e.id,
        student_user_id: e.studentUserId,
        student_name: e.studentName,
        student_email: e.studentEmail,
        class_level_id: toPgUuid(e.classLevelId),
        subject_ids: e.subjectIds,
        all_subjects: e.allSubjects,
        access_status: e.accessStatus,
        payment_id: e.paymentId ? toPgUuid(e.paymentId) : null,
        starts_at: e.startsAt,
        expires_at: e.expiresAt || null,
        granted_by: isRealUuid(e.grantedBy) ? e.grantedBy : null,
        reason: e.reason || null,
        updated_at: e.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  // 5. Timetable Entries & Teacher Assignments
  if (prevState) {
    await deleteMissingByIds("timetable_entries", prevState.timetableEntries, state.timetableEntries);
  }
  if (state.timetableEntries.length > 0) {
    await sb.from("timetable_entries").upsert(
      state.timetableEntries.map((t) => ({
        id: toPgUuid(t.id),
        external_id: t.id,
        session_id: toPgUuid(t.sessionId),
        term_id: toPgUuid(t.termId),
        class_level_id: toPgUuid(t.classLevelId),
        subject_id: toPgUuid(t.subjectId),
        day_of_week: t.dayOfWeek,
        start_time: t.startTime,
        end_time: t.endTime,
        duration_minutes: t.durationMinutes,
        teaching_mode: t.mode,
        max_capacity_per_room: t.maxCapacityPerRoom,
        publication_status: t.publicationStatus,
        allocation_status: t.allocationStatus,
        eligible_student_count: t.eligibleStudentCount,
        shortfall_count: t.shortfallCount,
        created_by: isRealUuid(t.createdBy) ? t.createdBy : null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      { onConflict: "id" }
    );

    for (const t of state.timetableEntries) {
      await sb.from("teacher_assignments").delete().eq("timetable_entry_id", toPgUuid(t.id));
      const validTeachers = t.assignedTeacherIds.filter((tid) => isRealUuid(tid));
      if (validTeachers.length > 0) {
        await sb.from("teacher_assignments").upsert(
          validTeachers.map((tid) => ({
            timetable_entry_id: toPgUuid(t.id),
            teacher_user_id: tid,
          })),
          { onConflict: "timetable_entry_id,teacher_user_id" }
        );
      }
    }
  }

  // 6. Student Groups & Memberships
  if (prevState) {
    await deleteMissingByIds("student_groups", prevState.studentGroups, state.studentGroups);
  }
  const validGroups = state.studentGroups.filter((g) => isRealUuid(g.teacherUserId));
  if (validGroups.length > 0) {
    await sb.from("student_groups").upsert(
      validGroups.map((g) => ({
        id: toPgUuid(g.id),
        external_id: g.id,
        timetable_entry_id: toPgUuid(g.timetableEntryId),
        group_name: g.groupName,
        group_number: g.groupNumber,
        teacher_user_id: g.teacherUserId,
        teacher_name: g.teacherName,
        max_capacity: g.maxCapacity,
        created_at: g.createdAt,
      })),
      { onConflict: "id" }
    );

    for (const g of validGroups) {
      await sb.from("student_group_memberships").delete().eq("student_group_id", toPgUuid(g.id));
      const validStudents = g.studentUserIds.filter((sid) => isRealUuid(sid));
      if (validStudents.length > 0) {
        await sb.from("student_group_memberships").upsert(
          validStudents.map((sid) => ({
            student_group_id: toPgUuid(g.id),
            timetable_entry_id: toPgUuid(g.timetableEntryId),
            student_user_id: sid,
          })),
          { onConflict: "timetable_entry_id,student_user_id" }
        );
      }
    }
  }

  // 7. Classroom Records, Attendance, Materials
  if (prevState) {
    await deleteMissingByIds("classroom_records", prevState.classrooms, state.classrooms);
  }
  const validClassrooms = state.classrooms.filter((c) => isRealUuid(c.teacherUserId));
  if (validClassrooms.length > 0) {
    await sb.from("classroom_records").upsert(
      validClassrooms.map((c) => ({
        id: toPgUuid(c.id),
        external_id: c.id,
        timetable_entry_id: toPgUuid(c.timetableEntryId),
        student_group_id: toPgUuid(c.studentGroupId),
        teacher_user_id: c.teacherUserId,
        teacher_name: c.teacherName,
        group_name: c.groupName,
        class_level_id: toPgUuid(c.classLevelId),
        class_level_name: c.classLevelName,
        subject_id: toPgUuid(c.subjectId),
        subject_name: c.subjectName,
        day_of_week: c.dayOfWeek,
        start_time: c.startTime,
        end_time: c.endTime,
        teaching_mode: c.mode,
        max_capacity: c.maxCapacity,
        lesson_title: c.lessonTitle,
        lesson_description: c.lessonDescription,
        lesson_objectives: c.lessonObjectives,
        lesson_notes: c.lessonNotes,
        assignments_text: c.assignmentsText,
        status: c.status,
        prepared_at: c.preparedAt || null,
        started_at: c.startedAt || null,
        ended_at: c.endedAt || null,
        duration_seconds: c.durationSeconds,
      })),
      { onConflict: "id" }
    );
  }

  const validAtt = state.attendanceRecords.filter((a) => isRealUuid(a.studentUserId));
  if (validAtt.length > 0) {
    await sb.from("attendance_records").upsert(
      validAtt.map((a) => ({
        id: toPgUuid(a.id),
        classroom_id: toPgUuid(a.classroomId),
        student_user_id: a.studentUserId,
        student_name: a.studentName,
        status: a.status,
        joined_at: a.joinedAt || null,
        recorded_by: isRealUuid(a.recordedBy) ? a.recordedBy : null,
        updated_at: a.updatedAt,
      })),
      { onConflict: "classroom_id,student_user_id" }
    );
  }

  // 8. Curriculum Topics, Video Lessons, Requests, Quiz Attempts, Video Q&A
  if (prevState) {
    await deleteMissingByIds("video_lessons", prevState.videoLessons, state.videoLessons);
    await deleteMissingByIds("curriculum_topics", prevState.curriculumTopics, state.curriculumTopics);
  }
  if (state.curriculumTopics.length > 0) {
    await sb.from("curriculum_topics").upsert(
      state.curriculumTopics.map((t) => ({
        id: toPgUuid(t.id),
        external_id: t.id,
        subject_id: toPgUuid(t.subjectId),
        term_id: toPgUuid(t.termId),
        class_level_id: toPgUuid(t.classLevelId),
        topic_order: t.topicOrder,
        week_label: t.weekLabel || null,
        title: t.title,
        description: t.description,
        is_published: t.isPublished,
        created_by: t.createdBy,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  if (state.videoLessons.length > 0) {
    await sb.from("video_lessons").upsert(
      state.videoLessons.map((v) => ({
        id: toPgUuid(v.id),
        external_id: v.id,
        topic_id: toPgUuid(v.topicId),
        subject_id: toPgUuid(v.subjectId),
        term_id: toPgUuid(v.termId),
        class_level_id: toPgUuid(v.classLevelId),
        title: v.title,
        description: v.description,
        source_type: v.sourceType,
        video_url: v.videoUrl,
        youtube_video_id: v.youtubeVideoId || null,
        storage_path: v.storagePath || null,
        mime_type: v.mimeType || null,
        file_size_bytes: v.fileSizeBytes ?? null,
        duration_label: v.durationLabel || null,
        materials: v.materials || [],
        uploaded_by_user_id: v.uploadedByUserId,
        uploaded_by_name: v.uploadedByName,
        uploaded_by_role: v.uploadedByRole,
        status: v.status,
        review_notes: v.reviewNotes || null,
        request_id: v.requestId || null,
        view_count: v.viewCount,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  const validVreqs = state.videoUploadRequests.filter((r) => isRealUuid(r.teacherUserId));
  if (validVreqs.length > 0) {
    await sb.from("video_upload_requests").upsert(
      validVreqs.map((r) => ({
        id: toPgUuid(r.id),
        external_id: r.id,
        topic_id: toPgUuid(r.topicId),
        subject_id: toPgUuid(r.subjectId),
        term_id: toPgUuid(r.termId),
        class_level_id: toPgUuid(r.classLevelId),
        teacher_user_id: r.teacherUserId,
        teacher_name: r.teacherName,
        requested_by_user_id: isRealUuid(r.requestedByUserId) ? r.requestedByUserId : null,
        requested_by_name: r.requestedByName,
        instructions: r.instructions,
        due_date: r.dueDate || null,
        status: r.status,
        fulfilled_video_id: r.fulfilledVideoId || null,
        admin_review_notes: r.adminReviewNotes || null,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      })),
      { onConflict: "id" }
    );
  }

  const validQuizzes = state.quizAttempts.filter((q) => isRealUuid(q.studentUserId));
  if (validQuizzes.length > 0) {
    await sb.from("quiz_attempts").upsert(
      validQuizzes.map((q) => ({
        id: toPgUuid(q.id),
        external_id: q.id,
        student_user_id: q.studentUserId,
        student_name: q.studentName,
        subject_id: toPgUuid(q.subjectId),
        subject_name: q.subjectName,
        topic_id: q.topicId || null,
        topic_title: q.topicTitle || null,
        quiz_type: q.quizType,
        title: q.title,
        score: q.score,
        total: q.total,
        percentage: q.percentage,
        duration_seconds: q.durationSeconds,
        created_at: q.createdAt,
      })),
      { onConflict: "id" }
    );
  }

  const validVqa = state.videoQuestions.filter((q) => isRealUuid(q.authorUserId));
  if (validVqa.length > 0) {
    await sb.from("video_questions").upsert(
      validVqa.map((q) => ({
        id: toPgUuid(q.id),
        external_id: q.id,
        video_id: toPgUuid(q.videoId),
        topic_id: toPgUuid(q.topicId),
        timestamp_label: q.timestampLabel || null,
        author_user_id: q.authorUserId,
        author_name: q.authorName,
        author_role: q.authorRole,
        question: q.question,
        replies: q.replies,
        created_at: q.createdAt,
      })),
      { onConflict: "id" }
    );
  }

  // 9. Parent Student Links (including deletes)
  if (prevState) {
    await deleteMissingByIds("parent_student_links", prevState.parentStudentLinks, state.parentStudentLinks);
  }
  const validLinks = state.parentStudentLinks.filter(
    (l) => isRealUuid(l.parentUserId) && isRealUuid(l.studentUserId)
  );
  if (validLinks.length > 0) {
    await sb.from("parent_student_links").upsert(
      validLinks.map((l) => ({
        id: toPgUuid(l.id),
        external_id: l.id,
        parent_user_id: l.parentUserId,
        parent_email: l.parentEmail,
        student_user_id: l.studentUserId,
        student_email: l.studentEmail,
        relationship: l.relationship,
        status: l.status || "PENDING_VERIFICATION",
        verification_code: l.verificationCode || null,
        verified_by: l.verifiedBy || null,
        verified_at: l.verifiedAt || null,
        linked_at: l.linkedAt,
      })),
      { onConflict: "parent_user_id,student_user_id" }
    );
  }

  // 10. Notifications & Audit Logs (upsert recent delta)
  const notifBatch = state.notifications.slice(0, 120);
  if (notifBatch.length > 0) {
    await sb.from("notifications").upsert(
      notifBatch.map((n) => ({
        id: toPgUuid(n.id),
        recipient_user_id:
          n.recipientUserId !== "ALL_ADMINS" && isRealUuid(n.recipientUserId)
            ? n.recipientUserId
            : null,
        recipient_role: n.recipientRole || (n.recipientUserId === "ALL_ADMINS" ? "ALL_ADMINS" : null),
        category: n.category,
        title: n.title,
        message: n.message,
        href: n.href || null,
        is_read: n.isRead,
        created_at: n.createdAt,
      })),
      { onConflict: "id" }
    );
  }

  const auditBatch = state.auditLogs.slice(0, 120);
  if (auditBatch.length > 0) {
    await sb.from("audit_logs").upsert(
      auditBatch.map((a) => ({
        id: toPgUuid(a.id),
        actor_user_id: isRealUuid(a.actorUserId) ? a.actorUserId : null,
        actor_email: a.actorEmail,
        actor_role: a.actorRole,
        action: a.action,
        entity_type: a.entityType,
        entity_id: a.entityId,
        reason: a.reason || null,
        metadata: a.metadata || {},
        created_at: a.createdAt,
      })),
      { onConflict: "id" }
    );
  }
}

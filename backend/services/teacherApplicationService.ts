import path from "path";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type {
  TeacherApplicationHistoryEntry,
  TeacherApplicationStatus,
} from "./lmsTypes";
import type { AuthenticatedSessionUser } from "./serverAuth";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "./supabaseServer";
import { sendTeacherApplicationStatusEmail } from "./emailService";
import { normalizeTeacherApplicationStatus } from "@/lib/teacherStatus";

export class TeacherApplicationServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isProtectedStorageRef(rawValue?: string): boolean {
  if (!rawValue) return false;
  const clean = rawValue.trim();
  return (
    clean.startsWith("storage://") ||
    clean.startsWith("supabase://") ||
    clean.includes("/storage/v1/object/public/teacher-documents/")
  );
}

export function buildAuthenticatedDocProxyUrl(params: {
  rawValue?: string;
  teacherId: string;
  docKey:
    | "profilePhoto"
    | "teachingCertificate"
    | "degreeCertificate"
    | "governmentId"
    | "cv";
  appId?: string;
}): string | undefined {
  const { rawValue, teacherId, docKey, appId } = params;
  if (!rawValue) return undefined;
  const clean = rawValue.trim();
  if (!clean) return undefined;
  if (clean.startsWith("data:") || clean.startsWith("/api/lms/teacher-documents")) {
    return clean;
  }
  if (isProtectedStorageRef(clean)) {
    const filePart = path.posix.basename(clean.split("?")[0]) || `${docKey}.pdf`;
    const qs = new URLSearchParams({
      teacherId,
      docKey,
      file: filePart,
    });
    if (appId) qs.set("appId", appId);
    return `/api/lms/teacher-documents?${qs.toString()}`;
  }
  return clean;
}

function sanitizeIncomingDocUrls(
  incoming: Record<string, string | undefined> | undefined
): Record<string, string | undefined> {
  if (!incoming || typeof incoming !== "object") return {};
  const cleaned: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    // Do not overwrite raw storage:// references with proxy URLs sent back from UI
    if (trimmed.startsWith("/api/lms/teacher-documents")) continue;
    cleaned[k] = trimmed;
  }
  return cleaned;
}

function makeHistoryEntry(input: {
  action: string;
  fromStatus?: string;
  toStatus: string;
  user: AuthenticatedSessionUser;
  note?: string;
}): TeacherApplicationHistoryEntry {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: input.action,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorUserId: input.user.id,
    actorName: input.user.fullName,
    actorRole: input.user.role,
    note: input.note?.trim() || undefined,
    timestamp: new Date().toISOString(),
  };
}

export async function getTeacherApplicationsOverview(
  user: AuthenticatedSessionUser
) {
  const [state, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const rawApplications = isAdmin
    ? state.teacherApplications
    : state.teacherApplications.filter((a) => a.teacherUserId === user.id);

  const applications = rawApplications.map((app) => ({
    ...app,
    internalNotes: isAdmin ? app.internalNotes : undefined,
    documentUrls: {
      profilePhoto: buildAuthenticatedDocProxyUrl({
        rawValue: app.documentUrls?.profilePhoto,
        teacherId: app.teacherUserId,
        docKey: "profilePhoto",
        appId: app.id,
      }),
      teachingCertificate: buildAuthenticatedDocProxyUrl({
        rawValue: app.documentUrls?.teachingCertificate,
        teacherId: app.teacherUserId,
        docKey: "teachingCertificate",
        appId: app.id,
      }),
      degreeCertificate: buildAuthenticatedDocProxyUrl({
        rawValue: app.documentUrls?.degreeCertificate,
        teacherId: app.teacherUserId,
        docKey: "degreeCertificate",
        appId: app.id,
      }),
      governmentId: buildAuthenticatedDocProxyUrl({
        rawValue: app.documentUrls?.governmentId,
        teacherId: app.teacherUserId,
        docKey: "governmentId",
        appId: app.id,
      }),
      cv: buildAuthenticatedDocProxyUrl({
        rawValue: app.documentUrls?.cv,
        teacherId: app.teacherUserId,
        docKey: "cv",
        appId: app.id,
      }),
    },
  }));

  const mapTeacherDirectoryRecord = (
    t: (typeof users)[number]
  ) => {
    const certProxy = buildAuthenticatedDocProxyUrl({
      rawValue: t.teachingCertificate || t.certificate,
      teacherId: t.id,
      docKey: "teachingCertificate",
    });
    return {
      ...t,
      adminNotes: isAdmin ? t.adminNotes : undefined,
      profilePhoto: buildAuthenticatedDocProxyUrl({
        rawValue: t.profilePhoto,
        teacherId: t.id,
        docKey: "profilePhoto",
      }),
      teachingCertificate: certProxy,
      certificate: certProxy,
      degreeCertificate: buildAuthenticatedDocProxyUrl({
        rawValue: t.degreeCertificate,
        teacherId: t.id,
        docKey: "degreeCertificate",
      }),
      governmentId: buildAuthenticatedDocProxyUrl({
        rawValue: t.governmentId,
        teacherId: t.id,
        docKey: "governmentId",
      }),
      cv: buildAuthenticatedDocProxyUrl({
        rawValue: t.cv,
        teacherId: t.id,
        docKey: "cv",
      }),
    };
  };

  const teachers = isAdmin
    ? users
        .filter((u) => u.role === "TEACHER")
        .map(mapTeacherDirectoryRecord)
    : [];

  const selfTeacher = !isAdmin
    ? users.find((u) => u.id === user.id)
    : undefined;

  const classrooms = isAdmin
    ? state.classrooms.map((c) => ({
        id: c.id,
        subjectId: c.subjectId,
        subjectName: c.subjectName,
        classLevelId: c.classLevelId,
        classLevelName: c.classLevelName,
        groupName: c.groupName,
        teacherUserId: c.teacherUserId,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        status: c.status,
        studentCount: c.studentUserIds.length,
        maxCapacity: c.maxCapacity,
      }))
    : [];

  const auditLogs = isAdmin
    ? state.auditLogs
        .filter((log) =>
          [
            "teacher_application",
            "teacher_approval",
            "teacher_profile",
            "teacher_status",
          ].includes(log.entityType)
        )
        .slice(0, 150)
    : [];

  return {
    applications,
    approvals: isAdmin
      ? state.teacherApprovals
      : state.teacherApprovals.filter((a) => a.teacherUserId === user.id),
    teachers,
    teacherProfile: selfTeacher ? mapTeacherDirectoryRecord(selfTeacher) : null,
    subjects: state.subjects.filter((s) => s.isActive),
    classLevels: state.classLevels.filter((c) => c.isActive),
    classrooms,
    auditLogs,
  };
}

export async function handleTeacherApplicationMutation(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const action = String(body.action || "");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const adminOnlyActions = [
    "REVIEW_APPLICATION",
    "MARK_UNDER_REVIEW",
    "TOGGLE_SUBJECT_APPROVAL",
    "SAVE_TEACHER_ASSIGNMENTS",
    "UPDATE_TEACHER_STATUS",
    "UPDATE_TEACHER_PROFILE",
  ];
  if (adminOnlyActions.includes(action) && !isAdmin) {
    throw new TeacherApplicationServiceError(
      "Only School Administrators can review, assign, or manage educator accounts.",
      403
    );
  }

  if (
    ["SUBMIT_APPLICATION", "RESUBMIT_APPLICATION", "SAVE_DRAFT"].includes(action) &&
    !isAdmin &&
    user.status === "SUSPENDED"
  ) {
    throw new TeacherApplicationServiceError(
      "Your educator account is suspended. Contact School Administration for assistance.",
      403
    );
  }

  const users = await fetchDirectoryUsers();

  const result = await mutateLmsState(async (state) => {
    switch (action) {
      case "SUBMIT_APPLICATION":
      case "RESUBMIT_APPLICATION":
      case "SAVE_DRAFT": {
        const subjectId = String(body.subjectId || "").trim();
        const classLevelIds: string[] = Array.isArray(body.classLevelIds)
          ? body.classLevelIds.map(String)
          : [];
        const qualification = String(body.qualification || "").trim();
        const institution = String(body.institution || "").trim();
        const experience = String(body.experience || "").trim();
        const licenseNumber = String(body.licenseNumber || "").trim();
        const bio = String(body.bio || "").trim();
        const incomingDocs = sanitizeIncomingDocUrls(
          body.documentUrls as Record<string, string | undefined> | undefined
        );

        const subject = state.subjects.find((s) => s.id === subjectId);
        if (!subject || classLevelIds.length === 0) {
          throw new TeacherApplicationServiceError(
            "Select a subject and at least one class level.",
            400
          );
        }
        if (action !== "SAVE_DRAFT" && !qualification) {
          throw new TeacherApplicationServiceError(
            "Qualification details are required to submit for review.",
            400
          );
        }

        const nextStatus: TeacherApplicationStatus =
          action === "SAVE_DRAFT" ? "DRAFT" : "PENDING_REVIEW";

        const existingId = body.applicationId
          ? String(body.applicationId)
          : null;
        let record = existingId
          ? state.teacherApplications.find(
              (a) => a.id === existingId && a.teacherUserId === user.id
            )
          : undefined;

        const nowIso = new Date().toISOString();

        if (record) {
          const prevStatus = record.status;
          record.subjectId = subject.id;
          record.subjectName = subject.name;
          record.classLevelIds = classLevelIds;
          record.qualification = qualification || record.qualification;
          record.institution = institution;
          record.experience = experience;
          record.licenseNumber = licenseNumber;
          record.bio = bio;
          record.documentUrls = {
            ...(record.documentUrls || {}),
            ...incomingDocs,
          };
          record.status = nextStatus;
          record.history = [
            ...(Array.isArray(record.history) ? record.history : []),
            makeHistoryEntry({
              action:
                action === "SAVE_DRAFT"
                  ? "APPLICATION_DRAFT_SAVED"
                  : prevStatus === "RESUBMISSION_REQUIRED" || prevStatus === "REJECTED"
                  ? "APPLICATION_RESUBMITTED"
                  : "APPLICATION_SUBMITTED",
              fromStatus: prevStatus,
              toStatus: nextStatus,
              user,
              note:
                Object.keys(incomingDocs).length > 0
                  ? `Updated application details and credentials (${Object.keys(incomingDocs).join(", ")}).`
                  : undefined,
            }),
          ];
          record.updatedAt = nowIso;
        } else {
          record = {
            id: `tapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teacherUserId: user.id,
            teacherName: user.fullName,
            teacherEmail: user.email,
            subjectId: subject.id,
            subjectName: subject.name,
            classLevelIds,
            qualification: qualification || "Draft",
            institution,
            experience,
            licenseNumber,
            bio,
            documentUrls: incomingDocs,
            status: nextStatus,
            history: [
              makeHistoryEntry({
                action:
                  action === "SAVE_DRAFT"
                    ? "APPLICATION_DRAFT_SAVED"
                    : "APPLICATION_SUBMITTED",
                fromStatus: "NEW",
                toStatus: nextStatus,
                user,
              }),
            ],
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          state.teacherApplications.unshift(record);
        }

        // Sync updated documents & profile metadata to teacher_profiles
        if (isSupabaseServerConfigured) {
          try {
            const sb = getSupabaseServerClient();
            const tpUpdate: Record<string, unknown> = {
              user_id: user.id,
              qualification: qualification || undefined,
              institution: institution || undefined,
              experience: experience || undefined,
              license_number: licenseNumber || undefined,
              bio: bio || undefined,
              updated_at: nowIso,
            };
            if (incomingDocs.profilePhoto) tpUpdate.profile_photo = incomingDocs.profilePhoto;
            if (incomingDocs.teachingCertificate) {
              tpUpdate.teaching_certificate = incomingDocs.teachingCertificate;
            }
            if (incomingDocs.degreeCertificate) {
              tpUpdate.degree_certificate = incomingDocs.degreeCertificate;
            }
            if (incomingDocs.governmentId) tpUpdate.government_id = incomingDocs.governmentId;
            if (incomingDocs.cv) tpUpdate.cv = incomingDocs.cv;

            Object.keys(tpUpdate).forEach((k) => {
              if (tpUpdate[k] === undefined) delete tpUpdate[k];
            });

            const { error: tpErr } = await sb
              .from("teacher_profiles")
              .upsert(tpUpdate, { onConflict: "user_id" });
            if (tpErr) {
              delete tpUpdate.bio;
              delete tpUpdate.updated_at;
              await sb
                .from("teacher_profiles")
                .upsert(tpUpdate, { onConflict: "user_id" });
            }

            if (nextStatus === "PENDING_REVIEW" && user.status === "REJECTED") {
              await sb
                .from("profiles")
                .update({ status: "PENDING" })
                .eq("id", user.id);
            }
          } catch {
            // non-fatal sync warning
          }
        }

        if (nextStatus === "PENDING_REVIEW") {
          appendNotification(state, {
            recipientUserId: user.id,
            recipientRole: "TEACHER",
            category: "TEACHER_APPLICATION",
            title: `Application submitted: ${subject.name}`,
            message:
              "Your subject teaching application and credentials are queued for School Admin review.",
            href: "/teacher/applications",
          });
          appendNotification(state, {
            recipientUserId: "ALL_ADMINS",
            recipientRole: "ALL_ADMINS",
            category: "TEACHER_APPLICATION",
            title: `Teacher Approval Required: ${user.fullName}`,
            message: `${user.fullName} submitted credentials to teach ${subject.name}.`,
            href: `/admin/teachers/${user.id}`,
          });
          appendAuditLog(state, {
            actorUserId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action:
              action === "RESUBMIT_APPLICATION"
                ? "RESUBMIT_TEACHER_APPLICATION"
                : "SUBMIT_TEACHER_SUBJECT_APPLICATION",
            entityType: "teacher_application",
            entityId: record.id,
            metadata: { subjectId, classLevelIds },
          });
        }

        return { application: record };
      }

      case "MARK_UNDER_REVIEW": {
        const applicationId = String(body.applicationId || "");
        const internalNotes =
          typeof body.internalNotes === "string"
            ? body.internalNotes.trim()
            : undefined;
        const app = state.teacherApplications.find(
          (a) => a.id === applicationId
        );
        if (!app) {
          throw new TeacherApplicationServiceError(
            "Teacher subject application not found.",
            404
          );
        }

        const prevStatus = app.status;
        app.status = "UNDER_REVIEW";
        if (internalNotes !== undefined) app.internalNotes = internalNotes;
        app.reviewedBy = user.id;
        app.reviewedAt = new Date().toISOString();
        app.updatedAt = new Date().toISOString();
        app.history = [
          ...(Array.isArray(app.history) ? app.history : []),
          makeHistoryEntry({
            action: "MARKED_UNDER_REVIEW",
            fromStatus: prevStatus,
            toStatus: "UNDER_REVIEW",
            user,
            note: internalNotes || "School Admin began reviewing submitted credentials.",
          }),
        ];

        appendNotification(state, {
          recipientUserId: app.teacherUserId,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: `${app.subjectName} Application Under Review`,
          message:
            "A School Administrator is currently inspecting your credentials for this subject.",
          href: "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "TEACHER_APPLICATION_UNDER_REVIEW",
          entityType: "teacher_application",
          entityId: app.id,
          metadata: { teacherUserId: app.teacherUserId, subjectId: app.subjectId },
        });

        return { application: app };
      }

      case "REVIEW_APPLICATION": {
        const applicationId = String(body.applicationId || "");
        const normalizedDecision = normalizeTeacherApplicationStatus(
          String(body.decision || "")
        );
        const approvedClassLevelIds: string[] = Array.isArray(
          body.approvedClassLevelIds
        )
          ? body.approvedClassLevelIds.map(String)
          : [];
        const explanation = String(body.explanation || "").trim();
        const internalNotes =
          typeof body.internalNotes === "string"
            ? body.internalNotes.trim()
            : undefined;

        const app = state.teacherApplications.find(
          (a) => a.id === applicationId
        );
        if (!app) {
          throw new TeacherApplicationServiceError(
            "Teacher subject application not found.",
            404
          );
        }
        if (
          !normalizedDecision ||
          ![
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMISSION_REQUIRED",
            "SUSPENDED",
          ].includes(normalizedDecision)
        ) {
          throw new TeacherApplicationServiceError(
            "Invalid decision status.",
            400
          );
        }

        const prevStatus = app.status;
        const decision = normalizedDecision as TeacherApplicationStatus;
        app.status = decision;
        app.adminExplanation = explanation || undefined;
        if (internalNotes !== undefined) {
          app.internalNotes = internalNotes;
        }
        app.reviewedBy = user.id;
        app.reviewedAt = new Date().toISOString();
        app.updatedAt = new Date().toISOString();

        const levelsToApprove =
          approvedClassLevelIds.length > 0
            ? approvedClassLevelIds
            : app.classLevelIds;

        app.history = [
          ...(Array.isArray(app.history) ? app.history : []),
          makeHistoryEntry({
            action: `APPLICATION_${decision}`,
            fromStatus: prevStatus,
            toStatus: decision,
            user,
            note:
              explanation ||
              (decision === "APPROVED"
                ? `Approved for ${levelsToApprove.length} class level(s).`
                : undefined),
          }),
        ];

        const sb = isSupabaseServerConfigured ? getSupabaseServerClient() : null;

        if (decision === "APPROVED") {
          for (const lvlId of Array.from(new Set([...app.classLevelIds, ...levelsToApprove]))) {
            const lvlObj = state.classLevels.find((c) => c.id === lvlId);
            const existing = state.teacherApprovals.find(
              (ap) =>
                ap.teacherUserId === app.teacherUserId &&
                ap.subjectId === app.subjectId &&
                ap.classLevelId === lvlId
            );
            const isSelected = levelsToApprove.includes(lvlId);
            if (isSelected) {
              if (existing) {
                existing.status = "APPROVED";
                existing.approvedBy = user.id;
                existing.reason = explanation;
                existing.approvedAt = new Date().toISOString();
              } else {
                state.teacherApprovals.push({
                  id: `aprv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                  teacherUserId: app.teacherUserId,
                  teacherName: app.teacherName,
                  subjectId: app.subjectId,
                  subjectName: app.subjectName,
                  classLevelId: lvlId,
                  classLevelName: lvlObj?.code || lvlObj?.name || lvlId,
                  applicationId: app.id,
                  status: "APPROVED",
                  approvedBy: user.id,
                  reason: explanation,
                  approvedAt: new Date().toISOString(),
                });
              }
            } else if (existing) {
              existing.status = "REVOKED";
              existing.reason =
                explanation || "Not included in approved class levels";
            }
          }

          if (sb) {
            await sb
              .from("profiles")
              .update({ status: "ACTIVE" })
              .eq("id", app.teacherUserId);
            await sb
              .from("teacher_profiles")
              .update({
                admin_notes: explanation || internalNotes || null,
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                verification_score: 100,
              })
              .eq("user_id", app.teacherUserId);
          }
        } else if (decision !== "UNDER_REVIEW") {
          state.teacherApprovals.forEach((ap) => {
            if (
              ap.teacherUserId === app.teacherUserId &&
              ap.subjectId === app.subjectId
            ) {
              ap.status = decision === "SUSPENDED" ? "SUSPENDED" : "REVOKED";
              ap.reason = explanation || `Application marked ${decision}`;
            }
          });

          if (sb && (decision === "REJECTED" || decision === "SUSPENDED" || decision === "RESUBMISSION_REQUIRED")) {
            const stillHasAnyApproved = state.teacherApprovals.some(
              (ap) =>
                ap.teacherUserId === app.teacherUserId &&
                ap.status === "APPROVED"
            );
            if (!stillHasAnyApproved) {
              await sb
                .from("profiles")
                .update({
                  status:
                    decision === "SUSPENDED"
                      ? "SUSPENDED"
                      : decision === "REJECTED"
                      ? "REJECTED"
                      : "PENDING",
                })
                .eq("id", app.teacherUserId);
            }
          }
        }

        appendNotification(state, {
          recipientUserId: app.teacherUserId,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: `${app.subjectName} Application: ${decision.replace(/_/g, " ")}`,
          message:
            explanation ||
            `Your application to teach ${app.subjectName} has been updated to ${decision.replace(/_/g, " ")}.`,
          href: "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: `TEACHER_APPLICATION_${decision}`,
          entityType: "teacher_application",
          entityId: app.id,
          reason: explanation,
          metadata: {
            teacherUserId: app.teacherUserId,
            subjectId: app.subjectId,
            approvedClassLevelIds: levelsToApprove,
          },
        });

        return { application: app, approvals: state.teacherApprovals };
      }

      case "SAVE_TEACHER_ASSIGNMENTS": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        const reason = String(body.reason || "").trim();
        const rawAssignments = Array.isArray(body.assignments)
          ? (body.assignments as Array<{
              subjectId?: unknown;
              classLevelIds?: unknown;
            }>)
          : [];

        const teacherUser = users.find(
          (u) => u.id === teacherUserId && u.role === "TEACHER"
        );
        if (!teacherUser) {
          throw new TeacherApplicationServiceError(
            "Target teacher account was not found.",
            404
          );
        }
        if (teacherUser.status === "SUSPENDED") {
          throw new TeacherApplicationServiceError(
            "Reactivate the suspended teacher account before updating active teaching assignments.",
            400
          );
        }

        const desiredMap = new Map<
          string,
          { subjectId: string; classLevelId: string }
        >();
        const approvedSubjectNames = new Set<string>();

        for (const item of rawAssignments) {
          const subject = state.subjects.find(
            (s) => s.id === String(item.subjectId || "")
          );
          if (!subject) continue;
          const levelIds = Array.isArray(item.classLevelIds)
            ? item.classLevelIds.map(String)
            : [];
          for (const lvlId of levelIds) {
            const lvl = state.classLevels.find((c) => c.id === lvlId);
            if (!lvl) continue;
            desiredMap.set(`${subject.id}::${lvl.id}`, {
              subjectId: subject.id,
              classLevelId: lvl.id,
            });
            approvedSubjectNames.add(subject.name);
          }
        }

        const nowIso = new Date().toISOString();

        // Update existing approvals for this teacher
        for (const ap of state.teacherApprovals) {
          if (ap.teacherUserId !== teacherUserId) continue;
          const key = `${ap.subjectId}::${ap.classLevelId}`;
          if (desiredMap.has(key)) {
            ap.status = "APPROVED";
            ap.approvedBy = user.id;
            ap.reason = reason || ap.reason || "Assigned by School Administrator";
            ap.approvedAt = nowIso;
            desiredMap.delete(key);
          } else if (ap.status === "APPROVED") {
            ap.status = "REVOKED";
            ap.reason = reason || "Removed by School Administrator";
          }
        }

        // Insert newly assigned pairs
        for (const pair of desiredMap.values()) {
          const subject = state.subjects.find((s) => s.id === pair.subjectId);
          const lvl = state.classLevels.find((c) => c.id === pair.classLevelId);
          if (!subject || !lvl) continue;
          state.teacherApprovals.push({
            id: `aprv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teacherUserId,
            teacherName: teacherUser.fullName,
            subjectId: subject.id,
            subjectName: subject.name,
            classLevelId: lvl.id,
            classLevelName: lvl.code || lvl.name,
            status: "APPROVED",
            approvedBy: user.id,
            reason: reason || "Assigned by School Administrator",
            approvedAt: nowIso,
          });
        }

        const activeCount = state.teacherApprovals.filter(
          (a) => a.teacherUserId === teacherUserId && a.status === "APPROVED"
        ).length;

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          if (activeCount > 0 && teacherUser.status !== "ACTIVE") {
            await sb
              .from("profiles")
              .update({ status: "ACTIVE" })
              .eq("id", teacherUserId);
          }
          if (approvedSubjectNames.size > 0) {
            await sb
              .from("teacher_profiles")
              .update({
                subject: Array.from(approvedSubjectNames).join(", "),
                approved_by: user.id,
                approved_at: nowIso,
                updated_at: nowIso,
              })
              .eq("user_id", teacherUserId);
          }
        }

        appendNotification(state, {
          recipientUserId: teacherUserId,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: "Teaching Assignments Updated",
          message:
            activeCount > 0
              ? `School Admin updated your approved teaching scope (${Array.from(approvedSubjectNames).join(", ")}).`
              : "School Admin cleared your active subject-level assignments.",
          href: "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "SAVE_TEACHER_ASSIGNMENTS",
          entityType: "teacher_approval",
          entityId: teacherUserId,
          reason: reason || undefined,
          metadata: {
            teacherUserId,
            assignments: rawAssignments,
            activeCount,
          },
        });

        return {
          approvals: state.teacherApprovals.filter(
            (a) => a.teacherUserId === teacherUserId
          ),
        };
      }

      case "UPDATE_TEACHER_STATUS": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        const nextStatus = String(body.status || "").toUpperCase() as
          | "ACTIVE"
          | "SUSPENDED"
          | "REJECTED"
          | "PENDING";
        const reason = String(body.reason || "").trim();
        const restoreApprovals = body.restoreApprovals !== false;

        if (!["ACTIVE", "SUSPENDED", "REJECTED", "PENDING"].includes(nextStatus)) {
          throw new TeacherApplicationServiceError(
            "Invalid teacher account status.",
            400
          );
        }

        const teacherUser = users.find(
          (u) => u.id === teacherUserId && u.role === "TEACHER"
        );
        if (!teacherUser) {
          throw new TeacherApplicationServiceError(
            "Target teacher account was not found.",
            404
          );
        }

        const prevStatus = teacherUser.status;
        if (nextStatus === "SUSPENDED") {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status === "APPROVED") {
              ap.status = "SUSPENDED";
              ap.reason = reason || "Account suspended by School Administrator";
            }
          }
        } else if (nextStatus === "ACTIVE" && restoreApprovals) {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status === "SUSPENDED") {
              ap.status = "APPROVED";
              ap.reason = reason || "Account reactivated by School Administrator";
            }
          }
        } else if (nextStatus === "REJECTED") {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status !== "REVOKED") {
              ap.status = "REVOKED";
              ap.reason = reason || "Account marked rejected";
            }
          }
        }

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          const { error: statusErr } = await sb
            .from("profiles")
            .update({ status: nextStatus })
            .eq("id", teacherUserId);
          if (statusErr) {
            throw new TeacherApplicationServiceError(statusErr.message, 400);
          }
        }

        appendNotification(state, {
          recipientUserId: teacherUserId,
          recipientRole: "TEACHER",
          category: "SYSTEM_ALERT",
          title:
            nextStatus === "SUSPENDED"
              ? "Educator Access Suspended"
              : nextStatus === "ACTIVE"
              ? "Educator Access Activated"
              : `Educator Status Updated: ${nextStatus}`,
          message:
            reason ||
            `School Administration changed your educator account status to ${nextStatus}.`,
          href: "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: `TEACHER_STATUS_${nextStatus}`,
          entityType: "teacher_status",
          entityId: teacherUserId,
          reason: reason || undefined,
          metadata: { fromStatus: prevStatus, toStatus: nextStatus },
        });

        return { teacherUserId, status: nextStatus };
      }

      case "UPDATE_TEACHER_PROFILE": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        const teacherUser = users.find(
          (u) => u.id === teacherUserId && u.role === "TEACHER"
        );
        if (!teacherUser) {
          throw new TeacherApplicationServiceError(
            "Target teacher account was not found.",
            404
          );
        }

        const fullName =
          typeof body.fullName === "string" && body.fullName.trim()
            ? body.fullName.trim()
            : undefined;
        const phone =
          typeof body.phone === "string" ? body.phone.trim() : undefined;
        const qualification =
          typeof body.qualification === "string"
            ? body.qualification.trim()
            : undefined;
        const institution =
          typeof body.institution === "string"
            ? body.institution.trim()
            : undefined;
        const experience =
          typeof body.experience === "string"
            ? body.experience.trim()
            : undefined;
        const licenseNumber =
          typeof body.licenseNumber === "string"
            ? body.licenseNumber.trim()
            : undefined;
        const bio =
          typeof body.bio === "string" ? body.bio.trim() : undefined;
        const adminNotes =
          typeof body.adminNotes === "string"
            ? body.adminNotes.trim()
            : undefined;

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          const profileUpdates: Record<string, unknown> = {};
          if (fullName !== undefined) profileUpdates.full_name = fullName;
          if (phone !== undefined) profileUpdates.phone = phone || null;
          if (Object.keys(profileUpdates).length > 0) {
            await sb
              .from("profiles")
              .update(profileUpdates)
              .eq("id", teacherUserId);
          }

          const tpUpdates: Record<string, unknown> = {
            user_id: teacherUserId,
            updated_at: new Date().toISOString(),
          };
          if (qualification !== undefined) tpUpdates.qualification = qualification || null;
          if (institution !== undefined) tpUpdates.institution = institution || null;
          if (experience !== undefined) tpUpdates.experience = experience || null;
          if (licenseNumber !== undefined) tpUpdates.license_number = licenseNumber || null;
          if (bio !== undefined) tpUpdates.bio = bio || null;
          if (adminNotes !== undefined) tpUpdates.admin_notes = adminNotes || null;

          const { error: tpErr } = await sb
            .from("teacher_profiles")
            .upsert(tpUpdates, { onConflict: "user_id" });
          if (tpErr) {
            delete tpUpdates.bio;
            delete tpUpdates.updated_at;
            await sb
              .from("teacher_profiles")
              .upsert(tpUpdates, { onConflict: "user_id" });
          }
        }

        if (fullName) {
          for (const app of state.teacherApplications) {
            if (app.teacherUserId === teacherUserId) app.teacherName = fullName;
          }
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId) ap.teacherName = fullName;
          }
          for (const rm of state.classrooms) {
            if (rm.teacherUserId === teacherUserId) rm.teacherName = fullName;
          }
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "UPDATE_TEACHER_PROFILE",
          entityType: "teacher_profile",
          entityId: teacherUserId,
          metadata: {
            updatedFields: Object.keys(body).filter((k) => k !== "action"),
          },
        });

        return { teacherUserId, updated: true };
      }

      case "TOGGLE_SUBJECT_APPROVAL": {
        const approvalId = String(body.approvalId || "");
        const nextStatus = String(body.status || "REVOKED") as
          | "APPROVED"
          | "SUSPENDED"
          | "REVOKED";
        const reason = String(body.reason || "").trim();
        const ap = state.teacherApprovals.find((a) => a.id === approvalId);
        if (!ap) {
          throw new TeacherApplicationServiceError(
            "Approval record not found.",
            404
          );
        }
        ap.status = nextStatus;
        ap.reason = reason || ap.reason;

        if (isSupabaseServerConfigured) {
          try {
            const sb = getSupabaseServerClient();
            const hasApprovedSubject = state.teacherApprovals.some(
              (a) =>
                a.teacherUserId === ap.teacherUserId && a.status === "APPROVED"
            );
            await sb
              .from("profiles")
              .update({
                status: hasApprovedSubject
                  ? "ACTIVE"
                  : nextStatus === "SUSPENDED"
                  ? "SUSPENDED"
                  : "PENDING",
              })
              .eq("id", ap.teacherUserId);
          } catch {}
        }

        appendNotification(state, {
          recipientUserId: ap.teacherUserId,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: `${ap.subjectName} (${ap.classLevelName}) ${nextStatus.toLowerCase()}`,
          message:
            reason ||
            `Admin updated your subject approval status to ${nextStatus}.`,
          href: "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "UPDATE_TEACHER_APPROVAL_STATUS",
          entityType: "teacher_approval",
          entityId: ap.id,
          reason,
          metadata: { nextStatus, teacherUserId: ap.teacherUserId },
        });
        return { approval: ap };
      }

      default:
        throw new TeacherApplicationServiceError(
          "Unsupported teacher application action.",
          400
        );
    }
  });

  if (action === "REVIEW_APPLICATION" && result && "application" in result) {
    const reviewedApp = (
      result as {
        application: {
          teacherEmail: string;
          teacherName: string;
          subjectName: string;
          status: string;
          adminExplanation?: string;
        };
      }
    ).application;
    if (reviewedApp?.teacherEmail) {
      sendTeacherApplicationStatusEmail({
        to: reviewedApp.teacherEmail,
        teacherName: reviewedApp.teacherName,
        subjectName: reviewedApp.subjectName,
        decision: reviewedApp.status,
        explanation: reviewedApp.adminExplanation,
      }).catch((err) => console.warn("Teacher status email warning:", err));
    }
  }

  return { success: true, ...result };
}

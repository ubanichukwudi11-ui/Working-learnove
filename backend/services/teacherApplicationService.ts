import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { TeacherApplicationStatus } from "./lmsTypes";
import type { AuthenticatedSessionUser } from "./serverAuth";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "./supabaseServer";
import { sendTeacherApplicationStatusEmail } from "./emailService";

export class TeacherApplicationServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function buildTeacherDocumentApiUrl(
  teacherUserId: string,
  field: "profilePhoto" | "teachingCertificate" | "degreeCertificate" | "governmentId" | "cv",
  rawValue?: string,
  applicationId?: string
): string | undefined {
  if (!rawValue) return undefined;
  const params = new URLSearchParams({
    teacherUserId,
    field,
  });
  if (applicationId) params.set("applicationId", applicationId);
  return `/api/lms/teacher-applications/document?${params.toString()}`;
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
    documentUrls: {
      profilePhoto: buildTeacherDocumentApiUrl(
        app.teacherUserId,
        "profilePhoto",
        app.documentUrls?.profilePhoto,
        app.id
      ),
      teachingCertificate: buildTeacherDocumentApiUrl(
        app.teacherUserId,
        "teachingCertificate",
        app.documentUrls?.teachingCertificate,
        app.id
      ),
      degreeCertificate: buildTeacherDocumentApiUrl(
        app.teacherUserId,
        "degreeCertificate",
        app.documentUrls?.degreeCertificate,
        app.id
      ),
      governmentId: buildTeacherDocumentApiUrl(
        app.teacherUserId,
        "governmentId",
        app.documentUrls?.governmentId,
        app.id
      ),
      cv: buildTeacherDocumentApiUrl(
        app.teacherUserId,
        "cv",
        app.documentUrls?.cv,
        app.id
      ),
    },
  }));

  const teachers = isAdmin
    ? users
        .filter((u) => u.role === "TEACHER")
        .map((t) => ({
          ...t,
          profilePhoto: buildTeacherDocumentApiUrl(t.id, "profilePhoto", t.profilePhoto),
          teachingCertificate: buildTeacherDocumentApiUrl(
            t.id,
            "teachingCertificate",
            t.teachingCertificate
          ),
          degreeCertificate: buildTeacherDocumentApiUrl(
            t.id,
            "degreeCertificate",
            t.degreeCertificate
          ),
          governmentId: buildTeacherDocumentApiUrl(t.id, "governmentId", t.governmentId),
          cv: buildTeacherDocumentApiUrl(t.id, "cv", t.cv),
        }))
    : [];

  const classrooms = isAdmin
    ? state.classrooms.map((c) => ({
        id: c.id,
        teacherUserId: c.teacherUserId,
        subjectName: c.subjectName,
        classLevelName: c.classLevelName,
        groupName: c.groupName,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        status: c.status,
        studentCount: c.studentUserIds.length,
      }))
    : [];

  const auditLogs = isAdmin
    ? state.auditLogs.filter((l) =>
        [
          "teacher_application",
          "teacher_approval",
          "teacher_assignment",
          "teacher_account",
          "profile",
        ].includes(l.entityType)
      )
    : [];

  return {
    applications,
    approvals: isAdmin
      ? state.teacherApprovals
      : state.teacherApprovals.filter((a) => a.teacherUserId === user.id),
    teachers,
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

  const adminActions = [
    "REVIEW_APPLICATION",
    "TOGGLE_SUBJECT_APPROVAL",
    "ASSIGN_TEACHER_SUBJECTS",
    "UPDATE_TEACHER_DOSSIER",
    "SET_TEACHER_STATUS",
  ];

  if (adminActions.includes(action) && !isAdmin) {
    throw new TeacherApplicationServiceError(
      "Only School Administrators can perform educator verification or assignment actions.",
      403
    );
  }

  const result = await mutateLmsState(async (state) => {
    const nowIso = new Date().toISOString();

    switch (action) {
      case "SUBMIT_APPLICATION":
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
        const documentUrls =
          (body.documentUrls as Record<string, string | undefined>) || {};

        const subject = state.subjects.find((s) => s.id === subjectId);
        if (!subject || classLevelIds.length === 0) {
          throw new Error("Select a subject and at least one class level.");
        }
        if (action === "SUBMIT_APPLICATION" && !qualification) {
          throw new Error(
            "Qualification details are required to submit for review."
          );
        }

        const status: TeacherApplicationStatus =
          action === "SAVE_DRAFT" ? "DRAFT" : "PENDING_REVIEW";

        const existingId = body.applicationId
          ? String(body.applicationId)
          : null;
        let record = existingId
          ? state.teacherApplications.find(
              (a) => a.id === existingId && a.teacherUserId === user.id
            )
          : undefined;

        const cleanDocs = {
          ...(record?.documentUrls || {}),
          ...(documentUrls.profilePhoto ? { profilePhoto: documentUrls.profilePhoto } : {}),
          ...(documentUrls.teachingCertificate
            ? { teachingCertificate: documentUrls.teachingCertificate }
            : {}),
          ...(documentUrls.degreeCertificate
            ? { degreeCertificate: documentUrls.degreeCertificate }
            : {}),
          ...(documentUrls.governmentId ? { governmentId: documentUrls.governmentId } : {}),
          ...(documentUrls.cv ? { cv: documentUrls.cv } : {}),
        };

        if (record) {
          record.subjectId = subject.id;
          record.subjectName = subject.name;
          record.classLevelIds = classLevelIds;
          record.qualification = qualification;
          record.institution = institution;
          record.experience = experience;
          record.licenseNumber = licenseNumber;
          record.bio = bio;
          record.documentUrls = cleanDocs;
          record.status = status;
          record.updatedAt = nowIso;
          if (status === "PENDING_REVIEW") {
            record.statusHistory = [
              ...(record.statusHistory || []),
              {
                status: "PENDING_REVIEW",
                actorName: user.fullName,
                actorRole: user.role,
                note: "Submitted subject application for School Admin review.",
                at: nowIso,
              },
            ];
          }
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
            documentUrls: cleanDocs,
            status,
            statusHistory:
              status === "PENDING_REVIEW"
                ? [
                    {
                      status: "PENDING_REVIEW",
                      actorName: user.fullName,
                      actorRole: user.role,
                      note: "Submitted subject application for School Admin review.",
                      at: nowIso,
                    },
                  ]
                : [],
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          state.teacherApplications.unshift(record);
        }

        if (isSupabaseServerConfigured && Object.keys(cleanDocs).length > 0) {
          try {
            const sb = getSupabaseServerClient();
            const tpPatch: Record<string, unknown> = {
              user_id: user.id,
              qualification: qualification || null,
              institution: institution || null,
              experience: experience || null,
              license_number: licenseNumber || null,
              bio: bio || null,
            };
            if (cleanDocs.profilePhoto) tpPatch.profile_photo = cleanDocs.profilePhoto;
            if (cleanDocs.teachingCertificate)
              tpPatch.teaching_certificate = cleanDocs.teachingCertificate;
            if (cleanDocs.degreeCertificate)
              tpPatch.degree_certificate = cleanDocs.degreeCertificate;
            if (cleanDocs.governmentId) tpPatch.government_id = cleanDocs.governmentId;
            if (cleanDocs.cv) tpPatch.cv = cleanDocs.cv;
            const { error: tpErr } = await sb
              .from("teacher_profiles")
              .upsert(tpPatch, { onConflict: "user_id" });
            if (tpErr) {
              delete tpPatch.bio;
              await sb.from("teacher_profiles").upsert(tpPatch, { onConflict: "user_id" });
            }
          } catch {}
        }

        if (status === "PENDING_REVIEW") {
          appendNotification(state, {
            recipientUserId: user.id,
            recipientRole: "TEACHER",
            category: "TEACHER_APPLICATION",
            title: `Application received: ${subject.name}`,
            message:
              "Your subject teaching application is pending review by School Admin.",
            href: "/teacher/applications",
          });
          appendNotification(state, {
            recipientUserId: "ALL_ADMINS",
            recipientRole: "ALL_ADMINS",
            category: "TEACHER_APPLICATION",
            title: `Teacher Approval Required: ${user.fullName}`,
            message: `${user.fullName} applied to teach ${subject.name}.`,
            href: `/admin/teachers/${user.id}`,
          });
          appendAuditLog(state, {
            actorUserId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "SUBMIT_TEACHER_SUBJECT_APPLICATION",
            entityType: "teacher_application",
            entityId: record.id,
            metadata: { subjectId, classLevelIds },
          });
        }

        return { application: record };
      }

      case "UPLOAD_RESUBMISSION_DOCS": {
        const documentUrls =
          (body.documentUrls as Record<string, string | undefined>) || {};
        const note = String(body.note || "").trim();
        const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
        const qualification =
          typeof body.qualification === "string" ? body.qualification.trim() : undefined;
        const licenseNumber =
          typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : undefined;

        const hasNewDoc = Object.values(documentUrls).some(
          (v) => typeof v === "string" && v.trim().length > 0
        );
        if (!hasNewDoc && !note && !bio && !qualification) {
          throw new Error(
            "Upload at least one updated document or provide updated details to resubmit."
          );
        }

        const myApps = state.teacherApplications.filter(
          (a) => a.teacherUserId === user.id
        );
        for (const app of myApps) {
          app.documentUrls = {
            ...app.documentUrls,
            ...(documentUrls.profilePhoto ? { profilePhoto: documentUrls.profilePhoto } : {}),
            ...(documentUrls.teachingCertificate
              ? { teachingCertificate: documentUrls.teachingCertificate }
              : {}),
            ...(documentUrls.degreeCertificate
              ? { degreeCertificate: documentUrls.degreeCertificate }
              : {}),
            ...(documentUrls.governmentId ? { governmentId: documentUrls.governmentId } : {}),
            ...(documentUrls.cv ? { cv: documentUrls.cv } : {}),
          };
          if (bio !== undefined) app.bio = bio;
          if (qualification) app.qualification = qualification;
          if (licenseNumber !== undefined) app.licenseNumber = licenseNumber;
          if (app.status === "RESUBMISSION_REQUIRED" || app.status === "DRAFT") {
            app.status = "PENDING_REVIEW";
          }
          app.updatedAt = nowIso;
          app.statusHistory = [
            ...(app.statusHistory || []),
            {
              status: "PENDING_REVIEW",
              actorName: user.fullName,
              actorRole: user.role,
              note: note || "Updated verification credentials uploaded for review.",
              at: nowIso,
            },
          ];
        }

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          const tpPatch: Record<string, unknown> = { user_id: user.id };
          if (documentUrls.profilePhoto) tpPatch.profile_photo = documentUrls.profilePhoto;
          if (documentUrls.teachingCertificate)
            tpPatch.teaching_certificate = documentUrls.teachingCertificate;
          if (documentUrls.degreeCertificate)
            tpPatch.degree_certificate = documentUrls.degreeCertificate;
          if (documentUrls.governmentId) tpPatch.government_id = documentUrls.governmentId;
          if (documentUrls.cv) tpPatch.cv = documentUrls.cv;
          if (bio !== undefined) tpPatch.bio = bio;
          if (qualification) tpPatch.qualification = qualification;
          if (licenseNumber !== undefined) tpPatch.license_number = licenseNumber;

          const { error: tpErr } = await sb
            .from("teacher_profiles")
            .upsert(tpPatch, { onConflict: "user_id" });
          if (tpErr) {
            delete tpPatch.bio;
            await sb.from("teacher_profiles").upsert(tpPatch, { onConflict: "user_id" });
          }
        }

        appendNotification(state, {
          recipientUserId: "ALL_ADMINS",
          recipientRole: "ALL_ADMINS",
          category: "TEACHER_APPLICATION",
          title: `Credentials Updated: ${user.fullName}`,
          message:
            note ||
            `${user.fullName} uploaded updated verification documents and requested review.`,
          href: `/admin/teachers/${user.id}`,
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "TEACHER_RESUBMITTED_DOCUMENTS",
          entityType: "teacher_application",
          entityId: user.id,
          reason: note || undefined,
        });

        return { updatedApplications: myApps.length };
      }

      case "REVIEW_APPLICATION": {
        const applicationId = String(body.applicationId || "");
        const decision = String(
          body.decision || ""
        ).toUpperCase() as TeacherApplicationStatus;
        const approvedClassLevelIds: string[] = Array.isArray(
          body.approvedClassLevelIds
        )
          ? body.approvedClassLevelIds.map(String)
          : [];
        const explanation = String(body.explanation || "").trim();
        const internalNotes = String(body.internalNotes || "").trim();

        const app = state.teacherApplications.find(
          (a) => a.id === applicationId
        );
        if (!app) throw new Error("Teacher subject application not found.");
        if (
          ![
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "RESUBMISSION_REQUIRED",
            "SUSPENDED",
          ].includes(decision)
        ) {
          throw new Error("Invalid decision status.");
        }

        app.status = decision;
        app.adminExplanation = explanation || app.adminExplanation;
        if (internalNotes) app.internalNotes = internalNotes;
        app.reviewedBy = user.fullName;
        app.reviewedAt = nowIso;
        app.updatedAt = nowIso;
        app.statusHistory = [
          ...(app.statusHistory || []),
          {
            status: decision,
            actorName: user.fullName,
            actorRole: user.role,
            note: explanation || undefined,
            internalNote: internalNotes || undefined,
            at: nowIso,
          },
        ];

        const levelsToApprove =
          approvedClassLevelIds.length > 0
            ? approvedClassLevelIds
            : app.classLevelIds;

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
                existing.approvedBy = user.fullName;
                existing.reason = explanation || existing.reason;
                existing.approvedAt = nowIso;
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
                  approvedBy: user.fullName,
                  reason: explanation || undefined,
                  approvedAt: nowIso,
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
                admin_notes: internalNotes || explanation || null,
                approved_by: user.id,
                approved_at: nowIso,
                verification_score: 100,
              })
              .eq("user_id", app.teacherUserId);
          }
        } else if (decision === "UNDER_REVIEW") {
          if (sb && (internalNotes || explanation)) {
            await sb
              .from("teacher_profiles")
              .update({
                admin_notes: internalNotes || explanation || null,
              })
              .eq("user_id", app.teacherUserId);
          }
        } else {
          state.teacherApprovals.forEach((ap) => {
            if (
              ap.teacherUserId === app.teacherUserId &&
              ap.subjectId === app.subjectId
            ) {
              ap.status = decision === "SUSPENDED" ? "SUSPENDED" : "REVOKED";
              ap.reason = explanation || `Application marked ${decision}`;
            }
          });

          const stillHasAnyApproved = state.teacherApprovals.some(
            (ap) =>
              ap.teacherUserId === app.teacherUserId &&
              ap.status === "APPROVED"
          );

          if (sb && !stillHasAnyApproved) {
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
            if (internalNotes || explanation) {
              await sb
                .from("teacher_profiles")
                .update({
                  admin_notes: internalNotes || explanation || null,
                })
                .eq("user_id", app.teacherUserId);
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
          href: decision === "APPROVED" ? "/teacher" : "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: `TEACHER_APPLICATION_${decision}`,
          entityType: "teacher_application",
          entityId: app.id,
          reason: explanation || internalNotes || undefined,
          metadata: {
            teacherUserId: app.teacherUserId,
            subjectId: app.subjectId,
            approvedClassLevelIds: levelsToApprove,
            internalNotes: internalNotes || undefined,
          },
        });

        return { application: app, approvals: state.teacherApprovals };
      }

      case "TOGGLE_SUBJECT_APPROVAL": {
        const approvalId = String(body.approvalId || "");
        const nextStatus = String(body.status || "REVOKED") as
          | "APPROVED"
          | "SUSPENDED"
          | "REVOKED";
        const reason = String(body.reason || "").trim();
        const ap = state.teacherApprovals.find((a) => a.id === approvalId);
        if (!ap) throw new Error("Approval record not found.");
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
          metadata: { nextStatus },
        });
        return { approval: ap };
      }

      case "ASSIGN_TEACHER_SUBJECTS": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        const note = String(body.note || "Updated teaching assignments").trim();
        const assignmentsRaw = Array.isArray(body.assignments)
          ? (body.assignments as Array<{ subjectId?: unknown; classLevelIds?: unknown }>)
          : [];

        if (!teacherUserId) {
          throw new Error("teacherUserId is required.");
        }

        const dirUsers = isSupabaseServerConfigured ? await fetchDirectoryUsers() : [];
        const teacherUser = dirUsers.find((u) => u.id === teacherUserId);
        const teacherName =
          teacherUser?.fullName ||
          state.teacherApplications.find((a) => a.teacherUserId === teacherUserId)
            ?.teacherName ||
          "Educator";

        // Build desired (subjectId -> Set<classLevelId>) map
        const desiredMap = new Map<string, Set<string>>();
        for (const item of assignmentsRaw) {
          const subjectId = String(item.subjectId || "").trim();
          const subObj = state.subjects.find((s) => s.id === subjectId);
          if (!subObj) continue;
          const levelIds = Array.isArray(item.classLevelIds)
            ? item.classLevelIds.map(String).filter((lid) =>
                state.classLevels.some((c) => c.id === lid)
              )
            : [];
          if (levelIds.length > 0) {
            const set = desiredMap.get(subObj.id) || new Set<string>();
            for (const lid of levelIds) set.add(lid);
            desiredMap.set(subObj.id, set);
          }
        }

        // Revoke existing approvals not in desiredMap
        for (const existing of state.teacherApprovals) {
          if (existing.teacherUserId !== teacherUserId) continue;
          const wanted = desiredMap.get(existing.subjectId);
          if (wanted && wanted.has(existing.classLevelId)) {
            existing.status = "APPROVED";
            existing.approvedBy = user.fullName;
            existing.approvedAt = nowIso;
            existing.reason = note;
          } else if (existing.status === "APPROVED") {
            existing.status = "REVOKED";
            existing.reason = note;
          }
        }

        // Add any new subject-level pairs
        const assignedSummary: string[] = [];
        for (const [subjectId, levelSet] of desiredMap.entries()) {
          const subObj = state.subjects.find((s) => s.id === subjectId)!;
          const levelCodes: string[] = [];
          for (const lvlId of levelSet) {
            const lvlObj = state.classLevels.find((c) => c.id === lvlId);
            levelCodes.push(lvlObj?.code || lvlId);
            const exists = state.teacherApprovals.find(
              (a) =>
                a.teacherUserId === teacherUserId &&
                a.subjectId === subjectId &&
                a.classLevelId === lvlId
            );
            if (!exists) {
              state.teacherApprovals.push({
                id: `aprv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                teacherUserId,
                teacherName,
                subjectId,
                subjectName: subObj.name,
                classLevelId: lvlId,
                classLevelName: lvlObj?.code || lvlObj?.name || lvlId,
                status: "APPROVED",
                approvedBy: user.fullName,
                reason: note,
                approvedAt: nowIso,
              });
            }
          }
          assignedSummary.push(`${subObj.name} (${levelCodes.join(", ")})`);
        }

        const totalApproved = state.teacherApprovals.filter(
          (a) => a.teacherUserId === teacherUserId && a.status === "APPROVED"
        ).length;

        if (isSupabaseServerConfigured && totalApproved > 0) {
          const sb = getSupabaseServerClient();
          const { data: currentProfile } = await sb
            .from("profiles")
            .select("status")
            .eq("id", teacherUserId)
            .maybeSingle();

          if (currentProfile && currentProfile.status !== "SUSPENDED") {
            await sb
              .from("profiles")
              .update({ status: "ACTIVE" })
              .eq("id", teacherUserId);
            await sb
              .from("teacher_profiles")
              .update({
                approved_by: user.id,
                approved_at: nowIso,
                subject: assignedSummary[0] || teacherUser?.subject || "General",
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
            assignedSummary.length > 0
              ? `School Admin assigned you to: ${assignedSummary.join("; ")}.`
              : "School Admin updated your active subject assignments.",
          href: "/teacher",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "ASSIGN_TEACHER_SUBJECTS",
          entityType: "teacher_assignment",
          entityId: teacherUserId,
          reason: note,
          metadata: { assignedSummary, totalApproved },
        });

        return {
          approvals: state.teacherApprovals.filter(
            (a) => a.teacherUserId === teacherUserId
          ),
          assignedSummary,
        };
      }

      case "UPDATE_TEACHER_DOSSIER": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        if (!teacherUserId) throw new Error("teacherUserId is required.");

        const fullName =
          typeof body.fullName === "string" ? body.fullName.trim() : undefined;
        const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
        const address =
          typeof body.address === "string" ? body.address.trim() : undefined;
        const stateName =
          typeof body.state === "string" ? body.state.trim() : undefined;
        const country =
          typeof body.country === "string" ? body.country.trim() : undefined;
        const qualification =
          typeof body.qualification === "string"
            ? body.qualification.trim()
            : undefined;
        const institution =
          typeof body.institution === "string" ? body.institution.trim() : undefined;
        const experience =
          typeof body.experience === "string" ? body.experience.trim() : undefined;
        const licenseNumber =
          typeof body.licenseNumber === "string"
            ? body.licenseNumber.trim()
            : undefined;
        const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
        const internalNotes =
          typeof body.internalNotes === "string"
            ? body.internalNotes.trim()
            : undefined;

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          const profilePatch: Record<string, unknown> = {};
          if (fullName) profilePatch.full_name = fullName;
          if (phone !== undefined) profilePatch.phone = phone || null;
          if (address !== undefined) profilePatch.address = address || null;
          if (stateName !== undefined) profilePatch.state = stateName || null;
          if (country !== undefined) profilePatch.country = country || null;

          if (Object.keys(profilePatch).length > 0) {
            const { error: pErr } = await sb
              .from("profiles")
              .update(profilePatch)
              .eq("id", teacherUserId);
            if (pErr) throw new Error(pErr.message);
          }

          const tpPatch: Record<string, unknown> = { user_id: teacherUserId };
          if (qualification !== undefined)
            tpPatch.qualification = qualification || null;
          if (institution !== undefined) tpPatch.institution = institution || null;
          if (experience !== undefined) tpPatch.experience = experience || null;
          if (licenseNumber !== undefined)
            tpPatch.license_number = licenseNumber || null;
          if (bio !== undefined) tpPatch.bio = bio || null;
          if (internalNotes !== undefined)
            tpPatch.admin_notes = internalNotes || null;

          if (Object.keys(tpPatch).length > 1) {
            const { error: tpErr } = await sb
              .from("teacher_profiles")
              .upsert(tpPatch, { onConflict: "user_id" });
            if (tpErr) {
              delete tpPatch.bio;
              await sb
                .from("teacher_profiles")
                .upsert(tpPatch, { onConflict: "user_id" });
            }
          }
        }

        // Sync LMS application & approval display fields
        for (const app of state.teacherApplications) {
          if (app.teacherUserId !== teacherUserId) continue;
          if (fullName) app.teacherName = fullName;
          if (qualification !== undefined) app.qualification = qualification;
          if (institution !== undefined) app.institution = institution;
          if (experience !== undefined) app.experience = experience;
          if (licenseNumber !== undefined) app.licenseNumber = licenseNumber;
          if (bio !== undefined) app.bio = bio;
          if (internalNotes !== undefined) app.internalNotes = internalNotes;
          app.updatedAt = nowIso;
        }
        for (const ap of state.teacherApprovals) {
          if (ap.teacherUserId !== teacherUserId) continue;
          if (fullName) ap.teacherName = fullName;
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "UPDATE_TEACHER_DOSSIER",
          entityType: "teacher_account",
          entityId: teacherUserId,
          metadata: {
            updatedFields: Object.keys(body).filter((k) => k !== "action"),
          },
        });

        return { updated: true };
      }

      case "SET_TEACHER_STATUS": {
        const teacherUserId = String(body.teacherUserId || "").trim();
        const nextStatus = String(body.nextStatus || "")
          .trim()
          .toUpperCase() as "ACTIVE" | "SUSPENDED" | "REJECTED" | "PENDING";
        const reason = String(body.reason || "").trim();

        if (!teacherUserId) throw new Error("teacherUserId is required.");
        if (!["ACTIVE", "SUSPENDED", "REJECTED", "PENDING"].includes(nextStatus)) {
          throw new Error("Invalid teacher account status.");
        }

        if (isSupabaseServerConfigured) {
          const sb = getSupabaseServerClient();
          const { error: pErr } = await sb
            .from("profiles")
            .update({ status: nextStatus })
            .eq("id", teacherUserId);
          if (pErr) throw new Error(pErr.message);

          if (nextStatus === "ACTIVE") {
            await sb
              .from("teacher_profiles")
              .update({
                approved_by: user.id,
                approved_at: nowIso,
                ...(reason ? { admin_notes: reason } : {}),
              })
              .eq("user_id", teacherUserId);
          } else if (reason) {
            await sb
              .from("teacher_profiles")
              .update({ admin_notes: reason })
              .eq("user_id", teacherUserId);
          }
        }

        if (nextStatus === "SUSPENDED") {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status === "APPROVED") {
              ap.status = "SUSPENDED";
              ap.reason = reason || "Teacher account suspended";
            }
          }
        } else if (nextStatus === "ACTIVE") {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status === "SUSPENDED") {
              ap.status = "APPROVED";
              ap.reason = reason || "Account reactivated by School Administration";
            }
          }
        } else if (nextStatus === "REJECTED") {
          for (const ap of state.teacherApprovals) {
            if (ap.teacherUserId === teacherUserId && ap.status === "APPROVED") {
              ap.status = "REVOKED";
              ap.reason = reason || "Teacher account rejected";
            }
          }
        }

        for (const app of state.teacherApplications) {
          if (app.teacherUserId !== teacherUserId) continue;
          app.statusHistory = [
            ...(app.statusHistory || []),
            {
              status:
                nextStatus === "ACTIVE"
                  ? "APPROVED"
                  : nextStatus === "PENDING"
                  ? "UNDER_REVIEW"
                  : nextStatus,
              actorName: user.fullName,
              actorRole: user.role,
              note: reason || `Account status updated to ${nextStatus}.`,
              at: nowIso,
            },
          ];
          app.updatedAt = nowIso;
        }

        appendNotification(state, {
          recipientUserId: teacherUserId,
          recipientRole: "TEACHER",
          category: "TEACHER_APPLICATION",
          title: `Educator Account Status: ${nextStatus}`,
          message:
            reason ||
            `School Administration updated your educator account status to ${nextStatus}.`,
          href: nextStatus === "ACTIVE" ? "/teacher" : "/teacher/applications",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: `SET_TEACHER_STATUS_${nextStatus}`,
          entityType: "teacher_account",
          entityId: teacherUserId,
          reason: reason || undefined,
        });

        return { status: nextStatus };
      }

      default:
        throw new Error("Unsupported teacher application action.");
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

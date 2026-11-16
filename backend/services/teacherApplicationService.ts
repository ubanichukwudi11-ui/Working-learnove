import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { TeacherApplicationStatus } from "./lmsTypes";
import type { AuthenticatedSessionUser } from "./serverAuth";
import { getSupabaseServerClient } from "./supabaseServer";

export class TeacherApplicationServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getTeacherApplicationsOverview(
  user: AuthenticatedSessionUser
) {
  const [state, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return {
    applications: isAdmin
      ? state.teacherApplications
      : state.teacherApplications.filter((a) => a.teacherUserId === user.id),
    approvals: isAdmin
      ? state.teacherApprovals
      : state.teacherApprovals.filter((a) => a.teacherUserId === user.id),
    teachers: isAdmin ? users.filter((u) => u.role === "TEACHER") : [],
    subjects: state.subjects.filter((s) => s.isActive),
    classLevels: state.classLevels.filter((c) => c.isActive),
  };
}

export async function handleTeacherApplicationMutation(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const action = String(body.action || "");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (
    ["REVIEW_APPLICATION", "TOGGLE_SUBJECT_APPROVAL"].includes(action) &&
    !isAdmin
  ) {
    throw new TeacherApplicationServiceError(
      "Only School Administrators can review or approve teacher applications.",
      403
    );
  }

  const result = await mutateLmsState(async (state) => {
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

        if (record) {
          record.subjectId = subject.id;
          record.subjectName = subject.name;
          record.classLevelIds = classLevelIds;
          record.qualification = qualification;
          record.institution = institution;
          record.experience = experience;
          record.licenseNumber = licenseNumber;
          record.bio = bio;
          record.documentUrls = { ...record.documentUrls, ...documentUrls };
          record.status = status;
          record.updatedAt = new Date().toISOString();
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
            documentUrls,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.teacherApplications.unshift(record);
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

        const app = state.teacherApplications.find(
          (a) => a.id === applicationId
        );
        if (!app) throw new Error("Teacher subject application not found.");
        if (
          ![
            "APPROVED",
            "REJECTED",
            "RESUBMISSION_REQUIRED",
            "SUSPENDED",
          ].includes(decision)
        ) {
          throw new Error("Invalid decision status.");
        }

        app.status = decision;
        app.adminExplanation = explanation || undefined;
        app.reviewedBy = user.fullName;
        app.reviewedAt = new Date().toISOString();
        app.updatedAt = new Date().toISOString();

        const levelsToApprove =
          approvedClassLevelIds.length > 0
            ? approvedClassLevelIds
            : app.classLevelIds;

        const sb = getSupabaseServerClient();

        if (decision === "APPROVED") {
          for (const lvlId of app.classLevelIds) {
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
                  approvedBy: user.fullName,
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

          await sb
            .from("profiles")
            .update({ status: "ACTIVE" })
            .eq("id", app.teacherUserId);
          await sb
            .from("teacher_profiles")
            .update({
              admin_notes: explanation || null,
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              verification_score: 100,
            })
            .eq("user_id", app.teacherUserId);
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

          if (decision === "REJECTED" || decision === "SUSPENDED") {
            const stillHasAnyApproved = state.teacherApprovals.some(
              (ap) =>
                ap.teacherUserId === app.teacherUserId &&
                ap.status === "APPROVED"
            );
            if (!stillHasAnyApproved) {
              await sb
                .from("profiles")
                .update({
                  status: decision === "SUSPENDED" ? "SUSPENDED" : "REJECTED",
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

      default:
        throw new Error("Unsupported teacher application action.");
    }
  });

  return { success: true, ...result };
}

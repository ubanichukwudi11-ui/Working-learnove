import crypto from "crypto";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import { computeStudentAnalytics } from "./reportCardService";
import {
  sendParentWardLinkedConfirmationEmail,
  sendParentWardVerificationEmail,
} from "./emailService";
import type { AuthenticatedSessionUser } from "./serverAuth";

export class ParentPortalServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function generateSixDigitCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export async function getParentPortalOverview(user: AuthenticatedSessionUser) {
  const [state, dir] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);

  const myLinks = (state.parentStudentLinks || []).filter(
    (l) => l.parentUserId === user.id
  );

  // Strictly only expose ward analytics, payments, and timetable for VERIFIED links.
  const verifiedLinks = myLinks.filter((l) => l.status === "VERIFIED");

  const wards = verifiedLinks
    .map((link) => {
      const student = dir.find((u) => u.id === link.studentUserId);
      if (!student) return null;

      const analytics = computeStudentAnalytics(state, {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        classLevel: student.classLevel,
      });

      const enrolment = state.studentEnrolments.find(
        (e) => e.studentUserId === student.id
      );
      const entitlement = state.studentEntitlements.find(
        (e) => e.studentUserId === student.id
      );
      const payments = state.paymentRecords
        .filter((p) => p.studentUserId === student.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const classLevelId = entitlement?.classLevelId || enrolment?.classLevelId;
      const upcomingTimetable = state.timetableEntries
        .filter(
          (t) =>
            t.publicationStatus === "PUBLISHED" &&
            (!classLevelId || t.classLevelId === classLevelId)
        )
        .slice(0, 6)
        .map((t) => {
          const subject = state.subjects.find((s) => s.id === t.subjectId);
          return {
            id: t.id,
            dayOfWeek: t.dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
            mode: t.mode,
            subjectName: subject?.name || "Subject",
          };
        });

      return {
        linkId: link.id,
        relationship: link.relationship,
        linkedAt: link.linkedAt,
        verifiedAt: link.verifiedAt,
        student: {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          classLevel: student.classLevel || analytics.classLevelName,
        },
        analytics,
        payments: payments.slice(0, 4),
        upcomingTimetable,
      };
    })
    .filter(Boolean);

  // Pending / rejected link requests expose NO student analytics or sensitive records
  const pendingRequests = myLinks
    .filter((l) => l.status !== "VERIFIED")
    .map((l) => ({
      linkId: l.id,
      studentEmail: l.studentEmail,
      relationship: l.relationship,
      status: l.status,
      linkedAt: l.linkedAt,
    }));

  return {
    wards,
    pendingRequests,
    subscriptionPlans: state.subscriptionPlans.filter((p) => p.isActive),
  };
}

export async function getStudentGuardianRequests(studentUserId: string) {
  const [state, dir] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);

  return (state.parentStudentLinks || [])
    .filter((l) => l.studentUserId === studentUserId)
    .map((l) => {
      const parent = dir.find((u) => u.id === l.parentUserId);
      return {
        linkId: l.id,
        parentUserId: l.parentUserId,
        parentName: parent?.fullName || l.parentEmail.split("@")[0],
        parentEmail: l.parentEmail,
        relationship: l.relationship,
        status: l.status,
        verificationCode:
          l.status === "PENDING_VERIFICATION" ? l.verificationCode : undefined,
        linkedAt: l.linkedAt,
        verifiedAt: l.verifiedAt,
      };
    });
}

export async function linkParentWard(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const studentEmail = String(body.studentEmail || "")
    .trim()
    .toLowerCase();
  const relationship = String(body.relationship || "Parent / Guardian").trim();
  const verificationCodeInput = String(body.verificationCode || "").trim();

  if (!studentEmail) {
    throw new ParentPortalServiceError(
      "Please enter the student's Learnova email address.",
      400
    );
  }

  const dir = await fetchDirectoryUsers();
  const student = dir.find(
    (u) => u.email.toLowerCase() === studentEmail && u.role === "STUDENT"
  );
  if (!student) {
    throw new ParentPortalServiceError(
      `No student account found with email "${studentEmail}". Verify the student's registered Learnova email.`,
      404
    );
  }

  let notifyCode: string | null = null;
  let verifiedNow = false;

  const link = await mutateLmsState((state) => {
    const existing = state.parentStudentLinks.find(
      (l) => l.parentUserId === user.id && l.studentUserId === student.id
    );

    if (existing && existing.status === "VERIFIED") {
      existing.relationship = relationship;
      return existing;
    }

    if (
      existing &&
      existing.status === "PENDING_VERIFICATION" &&
      verificationCodeInput
    ) {
      if (existing.verificationCode !== verificationCodeInput) {
        throw new ParentPortalServiceError(
          "Invalid 6-digit verification code. Confirm the code sent to the student.",
          400
        );
      }
      existing.status = "VERIFIED";
      existing.relationship = relationship;
      existing.verificationCode = undefined;
      existing.verifiedBy = user.fullName;
      existing.verifiedAt = new Date().toISOString();
      verifiedNow = true;

      appendAuditLog(state, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "PARENT_WARD_LINK_VERIFIED_OTP",
        entityType: "parent_student_link",
        entityId: existing.id,
        metadata: { studentUserId: student.id },
      });

      return existing;
    }

    // Issue a fresh 6-digit OTP and mark PENDING_VERIFICATION
    const code = generateSixDigitCode();
    notifyCode = code;

    if (existing) {
      existing.relationship = relationship;
      existing.status = "PENDING_VERIFICATION";
      existing.verificationCode = code;
      existing.verifiedBy = undefined;
      existing.verifiedAt = undefined;
      existing.linkedAt = new Date().toISOString();
    } else {
      const created = {
        id: `psl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parentUserId: user.id,
        parentEmail: user.email,
        studentUserId: student.id,
        studentEmail: student.email,
        relationship,
        status: "PENDING_VERIFICATION" as const,
        verificationCode: code,
        linkedAt: new Date().toISOString(),
      };
      state.parentStudentLinks.push(created);

      appendNotification(state, {
        recipientUserId: student.id,
        recipientRole: "STUDENT",
        category: "SYSTEM_ALERT",
        title: `Guardian Link Request from ${user.fullName}`,
        message: `${user.fullName} (${user.email}) requested to link as ${relationship}. Verification code: ${code}. Approve or reject on your Profile page.`,
        href: "/profile",
      });

      appendAuditLog(state, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "PARENT_WARD_LINK_REQUESTED",
        entityType: "parent_student_link",
        entityId: created.id,
        metadata: { studentUserId: student.id },
      });

      return created;
    }

    appendNotification(state, {
      recipientUserId: student.id,
      recipientRole: "STUDENT",
      category: "SYSTEM_ALERT",
      title: `Guardian Link Verification Code: ${code}`,
      message: `${user.fullName} requested guardian access (${relationship}). Approve or reject on your Profile page.`,
      href: "/profile",
    });

    return existing;
  });

  if (notifyCode) {
    await sendParentWardVerificationEmail({
      toStudent: student.email,
      studentName: student.fullName,
      parentName: user.fullName,
      parentEmail: user.email,
      relationship,
      verificationCode: notifyCode,
    });
  } else if (verifiedNow) {
    await sendParentWardLinkedConfirmationEmail({
      toParent: user.email,
      parentName: user.fullName,
      studentName: student.fullName,
      relationship,
    });
  }

  return {
    link: {
      id: link.id,
      parentUserId: link.parentUserId,
      studentEmail: link.studentEmail,
      relationship: link.relationship,
      status: link.status,
      linkedAt: link.linkedAt,
    },
    requiresVerification: link.status !== "VERIFIED",
  };
}

export async function verifyParentWardCode(
  user: AuthenticatedSessionUser,
  linkId: string,
  verificationCode: string
) {
  const cleanId = linkId.trim();
  const cleanCode = verificationCode.trim();
  if (!cleanId || !cleanCode) {
    throw new ParentPortalServiceError(
      "Link ID and 6-digit verification code are required.",
      400
    );
  }

  const dir = await fetchDirectoryUsers();
  let studentName = "Student";

  const updated = await mutateLmsState((state) => {
    const link = state.parentStudentLinks.find(
      (l) => l.id === cleanId && l.parentUserId === user.id
    );
    if (!link) {
      throw new ParentPortalServiceError("Guardian link request not found.", 404);
    }
    if (link.status === "VERIFIED") return link;
    if (link.verificationCode !== cleanCode) {
      throw new ParentPortalServiceError(
        "Verification code does not match. Ask the student for the 6-digit code from their email or Profile page.",
        400
      );
    }
    const student = dir.find((u) => u.id === link.studentUserId);
    if (student) studentName = student.fullName;

    link.status = "VERIFIED";
    link.verificationCode = undefined;
    link.verifiedBy = user.fullName;
    link.verifiedAt = new Date().toISOString();

    appendAuditLog(state, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "PARENT_WARD_LINK_VERIFIED_OTP",
      entityType: "parent_student_link",
      entityId: link.id,
      metadata: { studentUserId: link.studentUserId },
    });

    return link;
  });

  await sendParentWardLinkedConfirmationEmail({
    toParent: user.email,
    parentName: user.fullName,
    studentName,
    relationship: updated.relationship,
  });

  return { link: updated };
}

export async function respondToParentLinkRequest(
  actor: AuthenticatedSessionUser,
  linkId: string,
  decision: "APPROVE" | "REJECT"
) {
  const cleanId = linkId.trim();
  if (!cleanId) {
    throw new ParentPortalServiceError("linkId is required.", 400);
  }

  const dir = await fetchDirectoryUsers();
  const isAdmin = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
  let parentInfo: { email: string; fullName: string } | null = null;
  let studentName = actor.fullName;

  const updated = await mutateLmsState((state) => {
    const link = state.parentStudentLinks.find((l) => l.id === cleanId);
    if (!link) {
      throw new ParentPortalServiceError("Guardian link request not found.", 404);
    }
    if (!isAdmin && link.studentUserId !== actor.id) {
      throw new ParentPortalServiceError(
        "Only the student or a School Administrator can approve or reject this guardian request.",
        403
      );
    }

    const parent = dir.find((u) => u.id === link.parentUserId);
    const student = dir.find((u) => u.id === link.studentUserId);
    if (parent) parentInfo = { email: parent.email, fullName: parent.fullName };
    if (student) studentName = student.fullName;

    link.status = decision === "APPROVE" ? "VERIFIED" : "REJECTED";
    link.verificationCode = undefined;
    link.verifiedBy = actor.fullName;
    link.verifiedAt = new Date().toISOString();

    appendNotification(state, {
      recipientUserId: link.parentUserId,
      recipientRole: "PARENT",
      category: "SYSTEM_ALERT",
      title:
        decision === "APPROVE"
          ? `Guardian Link Approved: ${studentName}`
          : `Guardian Link Declined`,
      message:
        decision === "APPROVE"
          ? `${studentName} approved your guardian link. You can now view attendance, analytics, and report cards.`
          : `Your guardian link request for ${link.studentEmail} was declined.`,
      href: "/parent",
    });

    appendAuditLog(state, {
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action:
        decision === "APPROVE"
          ? "PARENT_WARD_LINK_APPROVED"
          : "PARENT_WARD_LINK_REJECTED",
      entityType: "parent_student_link",
      entityId: link.id,
    });

    return link;
  });

  if (decision === "APPROVE" && parentInfo) {
    await sendParentWardLinkedConfirmationEmail({
      toParent: (parentInfo as { email: string; fullName: string }).email,
      parentName: (parentInfo as { email: string; fullName: string }).fullName,
      studentName,
      relationship: updated.relationship,
    });
  }

  return { link: updated };
}

export async function unlinkParentWard(
  user: AuthenticatedSessionUser,
  linkId: string
) {
  const cleanLinkId = linkId.trim();
  if (!cleanLinkId) {
    throw new ParentPortalServiceError("linkId is required.", 400);
  }
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  await mutateLmsState((state) => {
    state.parentStudentLinks = state.parentStudentLinks.filter(
      (l) =>
        !(
          l.id === cleanLinkId &&
          (isAdmin ||
            l.parentUserId === user.id ||
            l.studentUserId === user.id)
        )
    );
  });
  return { success: true };
}

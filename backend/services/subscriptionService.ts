import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { AuthenticatedSessionUser } from "./serverAuth";
import { getSupabaseServerClient } from "./supabaseServer";

export class SubscriptionServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getSubscriptionsOverview(user: AuthenticatedSessionUser) {
  const [state, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (isAdmin) {
    return {
      students: users.filter((u) => u.role === "STUDENT"),
      enrolments: state.studentEnrolments,
      entitlements: state.studentEntitlements,
      payments: state.paymentRecords,
      plans: state.subscriptionPlans,
      classLevels: state.classLevels.filter((c) => c.isActive),
      subjects: state.subjects.filter((s) => s.isActive),
      paystackPublicKeyConfigured: Boolean(
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      ),
      paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
      allowManualBankTransfer: state.platformSettings.allowManualBankTransfer,
    };
  }

  const enrolment =
    state.studentEnrolments.find((e) => e.studentUserId === user.id) || null;
  const entitlement =
    state.studentEntitlements.find((e) => e.studentUserId === user.id) || null;
  const payments = state.paymentRecords.filter(
    (p) => p.studentUserId === user.id
  );

  return {
    enrolment,
    entitlement,
    payments,
    plans: state.subscriptionPlans.filter((p) => p.isActive),
    classLevels: state.classLevels.filter((c) => c.isActive),
    subjects: state.subjects.filter((s) => s.isActive),
    paystackPublicKeyConfigured: Boolean(
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    ),
    paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
    allowManualBankTransfer: state.platformSettings.allowManualBankTransfer,
  };
}

export async function handleSubscriptionMutation(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const action = String(body.action || "");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (
    [
      "VERIFY_PAYMENT",
      "GRANT_SCHOLARSHIP",
      "REVOKE_ACCESS",
      "RUN_EXPIRY_CHECK",
    ].includes(action) &&
    !isAdmin
  ) {
    throw new SubscriptionServiceError(
      "Only administrators can verify payments or authorize student access.",
      403
    );
  }

  const result = await mutateLmsState(async (state) => {
    switch (action) {
      case "UPDATE_ENROLMENT": {
        const targetUserId =
          isAdmin && body.studentUserId ? String(body.studentUserId) : user.id;
        const classLevelId = String(body.classLevelId || "").trim();
        const subjectIds: string[] = Array.isArray(body.subjectIds)
          ? body.subjectIds.map(String)
          : [];

        const lvl = state.classLevels.find(
          (c) => c.id === classLevelId && c.isActive
        );
        if (!lvl) throw new Error("Valid active class level is required.");
        if (subjectIds.length === 0) {
          throw new Error("Select at least one subject to enrol.");
        }

        let enrolment = state.studentEnrolments.find(
          (e) => e.studentUserId === targetUserId
        );
        if (enrolment) {
          enrolment.classLevelId = classLevelId;
          enrolment.subjectIds = subjectIds;
          enrolment.status = "ENROLLED";
          enrolment.updatedAt = new Date().toISOString();
        } else {
          enrolment = {
            id: `enr-${targetUserId}`,
            studentUserId: targetUserId,
            studentName: body.studentName
              ? String(body.studentName)
              : user.fullName,
            studentEmail: body.studentEmail
              ? String(body.studentEmail)
              : user.email,
            classLevelId,
            subjectIds,
            status: "ENROLLED",
            updatedAt: new Date().toISOString(),
          };
          state.studentEnrolments.push(enrolment);
        }

        let ent = state.studentEntitlements.find(
          (e) => e.studentUserId === targetUserId
        );
        if (!ent) {
          ent = {
            id: `ent-${targetUserId}`,
            studentUserId: targetUserId,
            studentName: enrolment.studentName,
            studentEmail: enrolment.studentEmail,
            classLevelId,
            subjectIds: [],
            allSubjects: false,
            accessStatus: "ENROLLED",
            startsAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.studentEntitlements.push(ent);
        } else if (ent.accessStatus === "REGISTERED") {
          ent.accessStatus = "ENROLLED";
          ent.classLevelId = classLevelId;
          ent.updatedAt = new Date().toISOString();
        } else {
          ent.classLevelId = classLevelId;
        }

        const sb = getSupabaseServerClient();
        await sb
          .from("student_profiles")
          .upsert({ user_id: targetUserId, class_level: lvl.code });

        appendNotification(state, {
          recipientUserId: targetUserId,
          recipientRole: "STUDENT",
          category: "SUBSCRIPTION",
          title: `Enrolled in ${lvl.code}`,
          message: `Your class level (${lvl.name}) and ${subjectIds.length} subject(s) have been saved.`,
          href: "/subscriptions",
        });

        return { enrolment, entitlement: ent };
      }

      case "SUBMIT_BANK_TRANSFER": {
        if (!state.platformSettings.allowManualBankTransfer) {
          throw new Error(
            "Manual bank transfer submission is disabled by platform settings."
          );
        }
        const planId = String(body.planId || "");
        const classLevelId = String(body.classLevelId || "");
        const subjectIds: string[] = Array.isArray(body.subjectIds)
          ? body.subjectIds.map(String)
          : [];
        const reference = String(body.reference || "").trim();
        const notes = String(body.notes || "").trim();

        const plan = state.subscriptionPlans.find(
          (p) => p.id === planId && p.isActive
        );
        if (!plan) throw new Error("Selected subscription plan is not active.");
        if (!reference) {
          throw new Error(
            "Bank transfer reference or teller number is required."
          );
        }
        if (
          state.paymentRecords.some(
            (p) => p.reference.toLowerCase() === reference.toLowerCase()
          )
        ) {
          throw new Error("This payment reference has already been submitted.");
        }

        const chosenSubjects = plan.allSubjectsIncluded
          ? state.subjects
              .filter((s) => s.classLevelIds.includes(classLevelId))
              .map((s) => s.id)
          : subjectIds;

        const payment = {
          id: `pay-${Date.now()}`,
          studentUserId: user.id,
          studentName: user.fullName,
          studentEmail: user.email,
          planId: plan.id,
          planName: plan.name,
          classLevelId,
          subjectIds: chosenSubjects,
          amountNgn: plan.priceNgn,
          provider: "BANK_TRANSFER" as const,
          reference,
          status: "AWAITING_CONFIRMATION" as const,
          notes,
          createdAt: new Date().toISOString(),
        };
        state.paymentRecords.unshift(payment);

        let ent = state.studentEntitlements.find(
          (e) => e.studentUserId === user.id
        );
        if (!ent) {
          ent = {
            id: `ent-${user.id}`,
            studentUserId: user.id,
            studentName: user.fullName,
            studentEmail: user.email,
            classLevelId,
            subjectIds: [],
            allSubjects: false,
            accessStatus: "AWAITING_CONFIRMATION",
            paymentId: payment.id,
            startsAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.studentEntitlements.push(ent);
        } else if (
          ent.accessStatus !== "ACTIVE_PAID" &&
          ent.accessStatus !== "SCHOLARSHIP_GRANTED"
        ) {
          ent.accessStatus = "AWAITING_CONFIRMATION";
          ent.paymentId = payment.id;
          ent.updatedAt = new Date().toISOString();
        }

        appendNotification(state, {
          recipientUserId: "ALL_ADMINS",
          recipientRole: "ALL_ADMINS",
          category: "SUBSCRIPTION",
          title: `Payment Verification Needed: ${user.fullName}`,
          message: `${user.fullName} submitted ₦${plan.priceNgn.toLocaleString()} (${reference}) for ${plan.name}.`,
          href: "/admin/payments",
        });

        return { payment, entitlement: ent };
      }

      case "VERIFY_PAYMENT": {
        const paymentId = String(body.paymentId || "");
        const approve = Boolean(body.approve);
        const notes = String(body.notes || "").trim();

        const payment = state.paymentRecords.find((p) => p.id === paymentId);
        if (!payment) throw new Error("Payment record not found.");

        const plan = state.subscriptionPlans.find(
          (p) => p.id === payment.planId
        );
        const durationDays = plan?.durationDays || 90;

        payment.status = approve ? "VERIFIED" : "FAILED";
        payment.verifiedBy = user.fullName;
        payment.verifiedAt = new Date().toISOString();
        payment.notes = notes || payment.notes;

        let ent = state.studentEntitlements.find(
          (e) => e.studentUserId === payment.studentUserId
        );
        const startsAt = new Date();
        const expiresAt = new Date(
          startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000
        );

        if (approve) {
          if (!ent) {
            ent = {
              id: `ent-${payment.studentUserId}`,
              studentUserId: payment.studentUserId,
              studentName: payment.studentName,
              studentEmail: payment.studentEmail,
              classLevelId: payment.classLevelId,
              subjectIds: payment.subjectIds,
              allSubjects: Boolean(plan?.allSubjectsIncluded),
              accessStatus: "ACTIVE_PAID",
              paymentId: payment.id,
              startsAt: startsAt.toISOString(),
              expiresAt: expiresAt.toISOString(),
              grantedBy: user.fullName,
              reason: "Verified payment record",
              updatedAt: new Date().toISOString(),
            };
            state.studentEntitlements.push(ent);
          } else {
            ent.classLevelId = payment.classLevelId || ent.classLevelId;
            ent.subjectIds = payment.subjectIds;
            ent.allSubjects = Boolean(plan?.allSubjectsIncluded);
            ent.accessStatus = "ACTIVE_PAID";
            ent.paymentId = payment.id;
            ent.startsAt = startsAt.toISOString();
            ent.expiresAt = expiresAt.toISOString();
            ent.grantedBy = user.fullName;
            ent.reason = "Verified payment record";
            ent.updatedAt = new Date().toISOString();
          }

          const enr = state.studentEnrolments.find(
            (e) => e.studentUserId === payment.studentUserId
          );
          if (!enr) {
            state.studentEnrolments.push({
              id: `enr-${payment.studentUserId}`,
              studentUserId: payment.studentUserId,
              studentName: payment.studentName,
              studentEmail: payment.studentEmail,
              classLevelId: ent.classLevelId,
              subjectIds: ent.subjectIds,
              status: "ENROLLED",
              updatedAt: new Date().toISOString(),
            });
          } else {
            enr.classLevelId = ent.classLevelId;
            enr.subjectIds = Array.from(
              new Set([...enr.subjectIds, ...ent.subjectIds])
            );
            enr.status = "ENROLLED";
          }
        } else if (ent) {
          ent.accessStatus = "ENROLLED";
          ent.reason = notes || "Payment could not be verified";
          ent.updatedAt = new Date().toISOString();
        }

        appendNotification(state, {
          recipientUserId: payment.studentUserId,
          recipientRole: "STUDENT",
          category: "SUBSCRIPTION",
          title: approve
            ? "Subscription Confirmed & Active"
            : "Payment Verification Declined",
          message: approve
            ? `Your payment (${payment.reference}) is verified. Classroom and subject access is now active.`
            : `Your payment (${payment.reference}) could not be verified. ${notes}`,
          href: "/subscriptions",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: approve
            ? "VERIFY_PAYMENT_APPROVED"
            : "VERIFY_PAYMENT_DECLINED",
          entityType: "payment_record",
          entityId: payment.id,
          reason: notes,
        });

        return { payment, entitlement: ent };
      }

      case "GRANT_SCHOLARSHIP": {
        const studentUserId = String(body.studentUserId || "").trim();
        const classLevelId = String(body.classLevelId || "").trim();
        const subjectIds: string[] = Array.isArray(body.subjectIds)
          ? body.subjectIds.map(String)
          : [];
        const allSubjects = Boolean(body.allSubjects);
        const durationDays = Number(body.durationDays || 90);
        const reason = String(
          body.reason || "Administrator-authorized scholarship"
        ).trim();

        if (!studentUserId || !classLevelId) {
          throw new Error("Student and class level are required.");
        }

        const users = await fetchDirectoryUsers();
        const st = users.find((u) => u.id === studentUserId);
        if (!st) throw new Error("Student user not found.");

        const startsAt = new Date();
        const expiresAt = new Date(
          startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000
        );
        const coveredSubjects = allSubjects
          ? state.subjects
              .filter((s) => s.classLevelIds.includes(classLevelId))
              .map((s) => s.id)
          : subjectIds;

        let ent = state.studentEntitlements.find(
          (e) => e.studentUserId === studentUserId
        );
        if (!ent) {
          ent = {
            id: `ent-${studentUserId}`,
            studentUserId,
            studentName: st.fullName,
            studentEmail: st.email,
            classLevelId,
            subjectIds: coveredSubjects,
            allSubjects,
            accessStatus: "SCHOLARSHIP_GRANTED",
            startsAt: startsAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            grantedBy: user.fullName,
            reason,
            updatedAt: new Date().toISOString(),
          };
          state.studentEntitlements.push(ent);
        } else {
          ent.classLevelId = classLevelId;
          ent.subjectIds = coveredSubjects;
          ent.allSubjects = allSubjects;
          ent.accessStatus = "SCHOLARSHIP_GRANTED";
          ent.startsAt = startsAt.toISOString();
          ent.expiresAt = expiresAt.toISOString();
          ent.grantedBy = user.fullName;
          ent.reason = reason;
          ent.updatedAt = new Date().toISOString();
        }

        const enr = state.studentEnrolments.find(
          (e) => e.studentUserId === studentUserId
        );
        if (!enr) {
          state.studentEnrolments.push({
            id: `enr-${studentUserId}`,
            studentUserId,
            studentName: st.fullName,
            studentEmail: st.email,
            classLevelId,
            subjectIds: coveredSubjects,
            status: "ENROLLED",
            updatedAt: new Date().toISOString(),
          });
        } else {
          enr.classLevelId = classLevelId;
          enr.subjectIds = coveredSubjects;
          enr.status = "ENROLLED";
        }

        appendNotification(state, {
          recipientUserId: studentUserId,
          recipientRole: "STUDENT",
          category: "SUBSCRIPTION",
          title: "Scholarship / Authorized Access Granted",
          message: `School Admin granted you learning access (${reason}).`,
          href: "/subscriptions",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "GRANT_SCHOLARSHIP_ACCESS",
          entityType: "student_entitlement",
          entityId: ent.id,
          reason,
        });

        return { entitlement: ent };
      }

      case "REVOKE_ACCESS": {
        const studentUserId = String(body.studentUserId || "");
        const nextStatus = body.status === "EXPIRED" ? "EXPIRED" : "ENROLLED";
        const reason = String(
          body.reason || "Access revoked by administrator"
        ).trim();
        const ent = state.studentEntitlements.find(
          (e) => e.studentUserId === studentUserId
        );
        if (!ent) throw new Error("Student entitlement record not found.");
        ent.accessStatus = nextStatus;
        ent.reason = reason;
        ent.updatedAt = new Date().toISOString();

        appendNotification(state, {
          recipientUserId: studentUserId,
          recipientRole: "STUDENT",
          category: "SUBSCRIPTION",
          title:
            nextStatus === "EXPIRED"
              ? "Subscription Expired"
              : "Learning Access Updated",
          message: reason,
          href: "/subscriptions",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "REVOKE_STUDENT_ACCESS",
          entityType: "student_entitlement",
          entityId: ent.id,
          reason,
        });
        return { entitlement: ent };
      }

      case "RUN_EXPIRY_CHECK": {
        const now = Date.now();
        let expiredCount = 0;
        state.studentEntitlements.forEach((ent) => {
          if (
            (ent.accessStatus === "ACTIVE_PAID" ||
              ent.accessStatus === "SCHOLARSHIP_GRANTED") &&
            ent.expiresAt &&
            new Date(ent.expiresAt).getTime() < now
          ) {
            ent.accessStatus = "EXPIRED";
            ent.updatedAt = new Date().toISOString();
            expiredCount++;
          }
        });
        return { expiredCount };
      }

      default:
        throw new Error("Unsupported subscription action.");
    }
  });

  return { success: true, ...result };
}

export async function verifyPaystackPaymentAndActivate(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new SubscriptionServiceError(
      "Paystack online gateway is not configured on the server (missing PAYSTACK_SECRET_KEY). Submit a bank transfer reference for School Admin verification instead.",
      503
    );
  }

  const reference = String(body.reference || "").trim();
  const planId = String(body.planId || "");
  const classLevelId = String(body.classLevelId || "");
  const subjectIds: string[] = Array.isArray(body.subjectIds)
    ? body.subjectIds.map(String)
    : [];

  if (!reference || !planId || !classLevelId) {
    throw new SubscriptionServiceError(
      "Reference, planId, and classLevelId are required.",
      400
    );
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );
  const verifyData = (await verifyRes.json()) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; amount?: number };
  };

  if (
    !verifyRes.ok ||
    !verifyData.status ||
    verifyData.data?.status !== "success"
  ) {
    throw new SubscriptionServiceError(
      verifyData?.message ||
        "Paystack could not verify a successful payment for this reference.",
      402
    );
  }

  const paidAmountKobo = Number(verifyData.data.amount || 0);

  const result = await mutateLmsState((state) => {
    if (state.paymentRecords.some((p) => p.reference === reference)) {
      throw new Error(
        "This payment reference has already been verified and applied."
      );
    }

    const plan = state.subscriptionPlans.find(
      (p) => p.id === planId && p.isActive
    );
    if (!plan) throw new Error("Selected subscription plan not found.");

    if (paidAmountKobo < plan.priceNgn * 100) {
      throw new Error("Paid amount does not match the selected plan price.");
    }

    const coveredSubjects = plan.allSubjectsIncluded
      ? state.subjects
          .filter((s) => s.classLevelIds.includes(classLevelId))
          .map((s) => s.id)
      : subjectIds;

    const payment = {
      id: `pay-${Date.now()}`,
      studentUserId: user.id,
      studentName: user.fullName,
      studentEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      classLevelId,
      subjectIds: coveredSubjects,
      amountNgn: Math.round(paidAmountKobo / 100),
      provider: "PAYSTACK" as const,
      reference,
      status: "VERIFIED" as const,
      verifiedBy: "Paystack Server Webhook/API",
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    state.paymentRecords.unshift(payment);

    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() + (plan.durationDays || 90) * 24 * 60 * 60 * 1000
    );

    let ent = state.studentEntitlements.find(
      (e) => e.studentUserId === user.id
    );
    if (!ent) {
      ent = {
        id: `ent-${user.id}`,
        studentUserId: user.id,
        studentName: user.fullName,
        studentEmail: user.email,
        classLevelId,
        subjectIds: coveredSubjects,
        allSubjects: plan.allSubjectsIncluded,
        accessStatus: "ACTIVE_PAID",
        paymentId: payment.id,
        startsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        grantedBy: "Paystack Verified",
        updatedAt: new Date().toISOString(),
      };
      state.studentEntitlements.push(ent);
    } else {
      ent.classLevelId = classLevelId;
      ent.subjectIds = coveredSubjects;
      ent.allSubjects = plan.allSubjectsIncluded;
      ent.accessStatus = "ACTIVE_PAID";
      ent.paymentId = payment.id;
      ent.startsAt = startsAt.toISOString();
      ent.expiresAt = expiresAt.toISOString();
      ent.updatedAt = new Date().toISOString();
    }

    const enr = state.studentEnrolments.find(
      (e) => e.studentUserId === user.id
    );
    if (!enr) {
      state.studentEnrolments.push({
        id: `enr-${user.id}`,
        studentUserId: user.id,
        studentName: user.fullName,
        studentEmail: user.email,
        classLevelId,
        subjectIds: coveredSubjects,
        status: "ENROLLED",
        updatedAt: new Date().toISOString(),
      });
    } else {
      enr.classLevelId = classLevelId;
      enr.subjectIds = Array.from(
        new Set([...enr.subjectIds, ...coveredSubjects])
      );
      enr.status = "ENROLLED";
    }

    appendNotification(state, {
      recipientUserId: user.id,
      recipientRole: "STUDENT",
      category: "SUBSCRIPTION",
      title: "Subscription Activated via Paystack",
      message: `Your ${plan.name} is active until ${expiresAt.toDateString()}.`,
      href: "/subscriptions",
    });

    appendAuditLog(state, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "PAYSTACK_PAYMENT_VERIFIED",
      entityType: "payment_record",
      entityId: payment.id,
      metadata: { reference, amountNgn: payment.amountNgn },
    });

    return { payment, entitlement: ent };
  });

  return { success: true, ...result };
}

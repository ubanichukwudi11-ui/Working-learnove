import crypto from "crypto";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { AuthenticatedSessionUser } from "./serverAuth";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "./supabaseServer";
import { sendPaystackReceiptEmail } from "./emailService";
import type {
  LmsUserRole,
  PersistentNotification,
  StudentAccessStatus,
} from "./lmsTypes";

export class SubscriptionServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function applyAutomaticExpiryCheck(state: {
  studentEntitlements: Array<{
    studentUserId: string;
    accessStatus: StudentAccessStatus;
    expiresAt?: string;
    updatedAt: string;
  }>;
  notifications: Array<{
    id: string;
    recipientUserId: string;
    recipientRole?: LmsUserRole | "ALL_ADMINS";
    category: PersistentNotification["category"];
    title: string;
    message: string;
    href?: string;
    isRead: boolean;
    createdAt: string;
  }>;
}): number {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let expiredCount = 0;

  for (const ent of state.studentEntitlements) {
    if (
      (ent.accessStatus === "ACTIVE_PAID" ||
        ent.accessStatus === "SCHOLARSHIP_GRANTED") &&
      ent.expiresAt
    ) {
      const expiresMs = new Date(ent.expiresAt).getTime();
      if (!Number.isNaN(expiresMs) && expiresMs < now) {
        ent.accessStatus = "EXPIRED";
        ent.updatedAt = nowIso;
        expiredCount++;

        const alreadyNotified = state.notifications.some(
          (n) =>
            n.recipientUserId === ent.studentUserId &&
            n.category === "SUBSCRIPTION" &&
            n.title === "Subscription Expired" &&
            new Date(n.createdAt).getTime() >= expiresMs
        );
        if (!alreadyNotified) {
          state.notifications.unshift({
            id: `ntf-exp-${ent.studentUserId}-${now}`,
            recipientUserId: ent.studentUserId,
            recipientRole: "STUDENT",
            category: "SUBSCRIPTION",
            title: "Subscription Expired",
            message:
              "Your Learnova subscription term has ended. Renew a plan to restore live classes and subject recordings.",
            href: "/subscriptions",
            isRead: false,
            createdAt: nowIso,
          });
        }
      }
    }
  }

  return expiredCount;
}

export async function getSubscriptionsOverview(user: AuthenticatedSessionUser) {
  const [initialState, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  let state = initialState;

  // Enforce automatic expiry transition whenever an entitlement passes expiresAt
  const hasExpired = state.studentEntitlements.some(
    (ent) =>
      (ent.accessStatus === "ACTIVE_PAID" ||
        ent.accessStatus === "SCHOLARSHIP_GRANTED") &&
      ent.expiresAt &&
      new Date(ent.expiresAt).getTime() < Date.now()
  );

  if (hasExpired) {
    await mutateLmsState((mutable) => {
      applyAutomaticExpiryCheck(mutable);
    });
    state = await loadLmsState();
  }

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
        const expiredCount = applyAutomaticExpiryCheck(state);
        return { expiredCount };
      }

      default:
        throw new Error("Unsupported subscription action.");
    }
  });

  return { success: true, ...result };
}

export async function initializePaystackCheckout(
  user: AuthenticatedSessionUser,
  input: {
    planId: string;
    classLevelId: string;
    subjectIds?: string[];
    callbackUrl: string;
  }
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new SubscriptionServiceError(
      "Paystack online gateway is not configured on the server (missing PAYSTACK_SECRET_KEY). Submit a bank transfer reference for School Admin verification instead.",
      503
    );
  }

  const state = await loadLmsState();
  const plan = state.subscriptionPlans.find(
    (p) => p.id === input.planId && p.isActive
  );
  if (!plan) {
    throw new SubscriptionServiceError(
      "Selected subscription plan was not found or is inactive.",
      400
    );
  }

  const classLevel = state.classLevels.find(
    (c) => c.id === input.classLevelId && c.isActive
  );
  if (!classLevel) {
    throw new SubscriptionServiceError(
      "Please confirm a valid class level (JSS1–SS3) before checkout.",
      400
    );
  }

  const coveredSubjects = plan.allSubjectsIncluded
    ? state.subjects
        .filter((s) => s.classLevelIds.includes(classLevel.id))
        .map((s) => s.id)
    : (input.subjectIds || []).length > 0
    ? input.subjectIds || []
    : state.studentEnrolments.find((e) => e.studentUserId === user.id)?.subjectIds ||
      [];

  if (!plan.allSubjectsIncluded && coveredSubjects.length === 0) {
    throw new SubscriptionServiceError(
      "Select at least one subject in Step 1 before initializing single-subject checkout.",
      400
    );
  }

  const amountKobo = Math.round(plan.priceNgn * 100);
  const reference = `LNV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        planId: plan.id,
        classLevelId: classLevel.id,
        subjectIds: coveredSubjects,
      },
    }),
  });

  const initJson = (await initRes.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url?: string;
      access_code?: string;
      reference?: string;
    };
  };

  if (
    !initRes.ok ||
    !initJson.status ||
    !initJson.data?.authorization_url ||
    !initJson.data?.access_code
  ) {
    throw new SubscriptionServiceError(
      initJson?.message || "Paystack failed to initialize checkout session.",
      502
    );
  }

  return {
    success: true,
    authorizationUrl: initJson.data.authorization_url,
    accessCode: initJson.data.access_code,
    reference: initJson.data.reference || reference,
    amountNgn: plan.priceNgn,
    planName: plan.name,
  };
}

async function activateSubscriptionFromVerifiedPayment(params: {
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  classLevelId: string;
  subjectIds: string[];
  reference: string;
  paidAmountKobo: number;
  verifiedByLabel: string;
}) {
  const result = await mutateLmsState((state) => {
    const existingPayment = state.paymentRecords.find(
      (p) => p.reference === params.reference && p.status === "VERIFIED"
    );
    if (existingPayment) {
      const existingEnt =
        state.studentEntitlements.find(
          (e) => e.studentUserId === existingPayment.studentUserId
        ) || null;
      return {
        payment: existingPayment,
        entitlement: existingEnt,
        planName: existingPayment.planName,
        expiresAtIso: existingEnt?.expiresAt || new Date().toISOString(),
        alreadyApplied: true,
      };
    }

    const plan = state.subscriptionPlans.find(
      (p) => p.id === params.planId && p.isActive
    );
    if (!plan) {
      throw new SubscriptionServiceError(
        "Selected subscription plan not found.",
        400
      );
    }

    if (params.paidAmountKobo < plan.priceNgn * 100) {
      throw new SubscriptionServiceError(
        "Paid amount does not match the selected plan price.",
        400
      );
    }

    const coveredSubjects = plan.allSubjectsIncluded
      ? state.subjects
          .filter((s) => s.classLevelIds.includes(params.classLevelId))
          .map((s) => s.id)
      : params.subjectIds;

    const payment = {
      id: `pay-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      studentUserId: params.userId,
      studentName: params.userName,
      studentEmail: params.userEmail,
      planId: plan.id,
      planName: plan.name,
      classLevelId: params.classLevelId,
      subjectIds: coveredSubjects,
      amountNgn: Math.round(params.paidAmountKobo / 100),
      provider: "PAYSTACK" as const,
      reference: params.reference,
      status: "VERIFIED" as const,
      verifiedBy: params.verifiedByLabel,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    state.paymentRecords.unshift(payment);

    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() + (plan.durationDays || 90) * 24 * 60 * 60 * 1000
    );

    let ent = state.studentEntitlements.find(
      (e) => e.studentUserId === params.userId
    );
    if (!ent) {
      ent = {
        id: `ent-${params.userId}`,
        studentUserId: params.userId,
        studentName: params.userName,
        studentEmail: params.userEmail,
        classLevelId: params.classLevelId,
        subjectIds: coveredSubjects,
        allSubjects: plan.allSubjectsIncluded,
        accessStatus: "ACTIVE_PAID",
        paymentId: payment.id,
        startsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        grantedBy: params.verifiedByLabel,
        updatedAt: new Date().toISOString(),
      };
      state.studentEntitlements.push(ent);
    } else {
      ent.classLevelId = params.classLevelId;
      ent.subjectIds = coveredSubjects;
      ent.allSubjects = plan.allSubjectsIncluded;
      ent.accessStatus = "ACTIVE_PAID";
      ent.paymentId = payment.id;
      ent.startsAt = startsAt.toISOString();
      ent.expiresAt = expiresAt.toISOString();
      ent.grantedBy = params.verifiedByLabel;
      ent.updatedAt = new Date().toISOString();
    }

    const enr = state.studentEnrolments.find(
      (e) => e.studentUserId === params.userId
    );
    if (!enr) {
      state.studentEnrolments.push({
        id: `enr-${params.userId}`,
        studentUserId: params.userId,
        studentName: params.userName,
        studentEmail: params.userEmail,
        classLevelId: params.classLevelId,
        subjectIds: coveredSubjects,
        status: "ENROLLED",
        updatedAt: new Date().toISOString(),
      });
    } else {
      enr.classLevelId = params.classLevelId;
      enr.subjectIds = Array.from(
        new Set([...enr.subjectIds, ...coveredSubjects])
      );
      enr.status = "ENROLLED";
    }

    appendNotification(state, {
      recipientUserId: params.userId,
      recipientRole: "STUDENT",
      category: "SUBSCRIPTION",
      title: "Subscription Activated via Paystack",
      message: `Your ${plan.name} is active until ${expiresAt.toDateString()}.`,
      href: "/subscriptions",
    });

    appendAuditLog(state, {
      actorUserId: params.userId,
      actorEmail: params.userEmail,
      actorRole: "STUDENT",
      action: "PAYSTACK_PAYMENT_VERIFIED",
      entityType: "payment_record",
      entityId: payment.id,
      metadata: {
        reference: params.reference,
        amountNgn: payment.amountNgn,
        via: params.verifiedByLabel,
      },
    });

    return {
      payment,
      entitlement: ent,
      planName: plan.name,
      expiresAtIso: expiresAt.toISOString(),
      alreadyApplied: false,
    };
  });

  if (!result.alreadyApplied) {
    sendPaystackReceiptEmail({
      to: params.userEmail,
      studentName: params.userName,
      planName: result.planName,
      amountNgn: result.payment.amountNgn,
      reference: params.reference,
      expiresAtIso: result.expiresAtIso,
    }).catch((err) => console.warn("Paystack receipt email warning:", err));
  }

  return {
    success: true,
    payment: result.payment,
    entitlement: result.entitlement,
    alreadyApplied: result.alreadyApplied,
    planName: result.planName,
    amountNgn: result.payment.amountNgn,
    accessStatus: result.entitlement?.accessStatus || "ACTIVE_PAID",
    expiresAt: result.expiresAtIso,
  };
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
  if (!reference) {
    throw new SubscriptionServiceError("Transaction reference is required.", 400);
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
    data?: {
      status?: string;
      amount?: number;
      metadata?: {
        userId?: string;
        planId?: string;
        classLevelId?: string;
        subjectIds?: string[];
      };
    };
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

  const meta = verifyData.data.metadata;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (meta?.userId && meta.userId !== user.id && !isAdmin) {
    throw new SubscriptionServiceError(
      "This payment reference belongs to a different Learnova student account.",
      403
    );
  }

  const planId = String(meta?.planId || body.planId || "").trim();
  const classLevelId = String(
    meta?.classLevelId || body.classLevelId || ""
  ).trim();
  const subjectIds: string[] = Array.isArray(meta?.subjectIds)
    ? meta.subjectIds.map(String)
    : Array.isArray(body.subjectIds)
    ? body.subjectIds.map(String)
    : [];

  if (!planId || !classLevelId) {
    throw new SubscriptionServiceError(
      "Plan and class level are required to activate this transaction.",
      400
    );
  }

  const paidAmountKobo = Number(verifyData.data.amount || 0);

  return activateSubscriptionFromVerifiedPayment({
    userId: meta?.userId || user.id,
    userName: user.fullName,
    userEmail: user.email,
    planId,
    classLevelId,
    subjectIds,
    reference,
    paidAmountKobo,
    verifiedByLabel: "Paystack Verify API",
  });
}

export async function handlePaystackWebhookEvent(
  rawBody: string,
  signatureHeader: string
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new SubscriptionServiceError(
      "PAYSTACK_SECRET_KEY is not configured.",
      503
    );
  }

  if (!signatureHeader) {
    throw new SubscriptionServiceError("Missing x-paystack-signature header.", 401);
  }

  const expectedHex = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signatureHeader.trim().toLowerCase(), "utf8");
  const expectedBuf = Buffer.from(expectedHex.toLowerCase(), "utf8");
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    throw new SubscriptionServiceError("Invalid Paystack webhook signature.", 401);
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: Record<string, any>;
  };
  const eventType = String(payload.event || "");
  const data = payload.data || {};
  const reference = String(
    data.reference || data.transaction_reference || ""
  ).trim();
  const eventKey = `${eventType}:${String(data.id || reference || crypto.createHash("sha256").update(rawBody).digest("hex"))}`;

  if (isSupabaseServerConfigured) {
    const sb = getSupabaseServerClient();
    const { error: insertErr } = await sb
      .from("paystack_webhook_events")
      .insert({
        event_id: eventKey,
        event_type: eventType,
        reference: reference || null,
        payload,
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return { received: true, duplicate: true };
      }
      console.warn("paystack_webhook_events insert warning:", insertErr.message);
    }
  }

  if (eventType === "charge.success") {
    if (String(data.status || "").toLowerCase() !== "success" || !reference) {
      return { received: true, ignored: true };
    }

    const meta = (data.metadata || {}) as {
      userId?: string;
      userEmail?: string;
      userName?: string;
      planId?: string;
      classLevelId?: string;
      subjectIds?: string[];
    };

    const customerEmail = String(
      meta.userEmail || data.customer?.email || ""
    ).toLowerCase();

    let targetUserId = String(meta.userId || "").trim();
    let targetUserName = String(meta.userName || "");
    let targetUserEmail = customerEmail;

    if (!targetUserId && customerEmail) {
      const users = await fetchDirectoryUsers();
      const matched = users.find(
        (u) => u.email.toLowerCase() === customerEmail
      );
      if (matched) {
        targetUserId = matched.id;
        targetUserName = matched.fullName;
        targetUserEmail = matched.email;
      }
    }

    const planId = String(meta.planId || "plan-term-full");
    const classLevelId = String(meta.classLevelId || "");
    const subjectIds = Array.isArray(meta.subjectIds)
      ? meta.subjectIds.map(String)
      : [];

    if (!targetUserId || !classLevelId) {
      return { received: true, skippedReason: "Missing student metadata." };
    }

    await activateSubscriptionFromVerifiedPayment({
      userId: targetUserId,
      userName: targetUserName || targetUserEmail || "Learnova Student",
      userEmail: targetUserEmail,
      planId,
      classLevelId,
      subjectIds,
      reference,
      paidAmountKobo: Number(data.amount || 0),
      verifiedByLabel: "Paystack Webhook (HMAC-SHA512)",
    });

    return { received: true, activated: true, reference };
  }

  if (eventType === "charge.failed" && reference) {
    const meta = (data.metadata || {}) as { userId?: string; userEmail?: string };
    if (meta.userId) {
      await mutateLmsState((state) => {
        appendNotification(state, {
          recipientUserId: String(meta.userId),
          recipientRole: "STUDENT",
          category: "SUBSCRIPTION",
          title: "Paystack Payment Did Not Complete",
          message: `Your payment attempt (${reference}) was not completed. No charge was applied.`,
          href: "/subscriptions",
        });
      });
    }
    return { received: true, recordedFailure: true };
  }

  if (eventType === "refund.processed" && reference) {
    await mutateLmsState((state) => {
      const payment = state.paymentRecords.find(
        (p) => p.reference === reference
      );
      if (!payment) return;
      payment.status = "REFUNDED";
      payment.notes = "Refund processed by Paystack";

      const ent = state.studentEntitlements.find(
        (e) =>
          e.studentUserId === payment.studentUserId &&
          e.paymentId === payment.id
      );
      if (ent) {
        ent.accessStatus = "ENROLLED";
        ent.reason = "Subscription refunded via Paystack";
        ent.updatedAt = new Date().toISOString();
      }

      appendNotification(state, {
        recipientUserId: payment.studentUserId,
        recipientRole: "STUDENT",
        category: "SUBSCRIPTION",
        title: "Subscription Payment Refunded",
        message: `Your payment (${reference}) was refunded and subscription access has been paused.`,
        href: "/subscriptions",
      });
      appendAuditLog(state, {
        actorUserId: payment.studentUserId,
        actorEmail: payment.studentEmail,
        actorRole: "SYSTEM",
        action: "PAYSTACK_PAYMENT_REFUNDED",
        entityType: "payment_record",
        entityId: payment.id,
        metadata: { reference },
      });
    });
    return { received: true, refunded: true };
  }

  return { received: true, eventType };
}

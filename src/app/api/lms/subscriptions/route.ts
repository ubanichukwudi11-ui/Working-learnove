import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "@/lib/lmsDb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const [state, users] = await Promise.all([loadLmsState(), fetchDirectoryUsers()]);
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  if (isAdmin) {
    return NextResponse.json({
      students: users.filter((u) => u.role === "STUDENT"),
      enrolments: state.studentEnrolments,
      entitlements: state.studentEntitlements,
      payments: state.paymentRecords,
      plans: state.subscriptionPlans,
      classLevels: state.classLevels.filter((c) => c.isActive),
      subjects: state.subjects.filter((s) => s.isActive),
      paystackPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
      allowManualBankTransfer: state.platformSettings.allowManualBankTransfer,
    });
  }

  // Student scoped view
  const enrolment = state.studentEnrolments.find((e) => e.studentUserId === auth.user.id) || null;
  const entitlement = state.studentEntitlements.find((e) => e.studentUserId === auth.user.id) || null;
  const payments = state.paymentRecords.filter((p) => p.studentUserId === auth.user.id);

  return NextResponse.json({
    enrolment,
    entitlement,
    payments,
    plans: state.subscriptionPlans.filter((p) => p.isActive),
    classLevels: state.classLevels.filter((c) => c.isActive),
    subjects: state.subjects.filter((s) => s.isActive),
    paystackPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
    paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
    allowManualBankTransfer: state.platformSettings.allowManualBankTransfer,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

    if (
      ["VERIFY_PAYMENT", "GRANT_SCHOLARSHIP", "REVOKE_ACCESS", "RUN_EXPIRY_CHECK"].includes(action) &&
      !isAdmin
    ) {
      return NextResponse.json(
        { error: "Only administrators can verify payments or authorize student access." },
        { status: 403 }
      );
    }

    const result = await mutateLmsState(async (state) => {
      switch (action) {
        case "UPDATE_ENROLMENT": {
          const targetUserId = isAdmin && body.studentUserId ? String(body.studentUserId) : auth.user.id;
          const classLevelId = String(body.classLevelId || "").trim();
          const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];

          const lvl = state.classLevels.find((c) => c.id === classLevelId && c.isActive);
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
              studentName: body.studentName || auth.user.fullName,
              studentEmail: body.studentEmail || auth.user.email,
              classLevelId,
              subjectIds,
              status: "ENROLLED",
              updatedAt: new Date().toISOString(),
            };
            state.studentEnrolments.push(enrolment);
          }

          // Update entitlement record classLevel if not yet active paid
          let ent = state.studentEntitlements.find((e) => e.studentUserId === targetUserId);
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
            throw new Error("Manual bank transfer submission is disabled by platform settings.");
          }
          const planId = String(body.planId || "");
          const classLevelId = String(body.classLevelId || "");
          const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];
          const reference = String(body.reference || "").trim();
          const notes = String(body.notes || "").trim();

          const plan = state.subscriptionPlans.find((p) => p.id === planId && p.isActive);
          if (!plan) throw new Error("Selected subscription plan is not active.");
          if (!reference) throw new Error("Bank transfer reference or teller number is required.");
          if (state.paymentRecords.some((p) => p.reference.toLowerCase() === reference.toLowerCase())) {
            throw new Error("This payment reference has already been submitted.");
          }

          const chosenSubjects = plan.allSubjectsIncluded
            ? state.subjects.filter((s) => s.classLevelIds.includes(classLevelId)).map((s) => s.id)
            : subjectIds;

          const payment = {
            id: `pay-${Date.now()}`,
            studentUserId: auth.user.id,
            studentName: auth.user.fullName,
            studentEmail: auth.user.email,
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

          let ent = state.studentEntitlements.find((e) => e.studentUserId === auth.user.id);
          if (!ent) {
            ent = {
              id: `ent-${auth.user.id}`,
              studentUserId: auth.user.id,
              studentName: auth.user.fullName,
              studentEmail: auth.user.email,
              classLevelId,
              subjectIds: [],
              allSubjects: false,
              accessStatus: "AWAITING_CONFIRMATION",
              paymentId: payment.id,
              startsAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            state.studentEntitlements.push(ent);
          } else if (ent.accessStatus !== "ACTIVE_PAID" && ent.accessStatus !== "SCHOLARSHIP_GRANTED") {
            ent.accessStatus = "AWAITING_CONFIRMATION";
            ent.paymentId = payment.id;
            ent.updatedAt = new Date().toISOString();
          }

          appendNotification(state, {
            recipientUserId: "ALL_ADMINS",
            recipientRole: "ALL_ADMINS",
            category: "SUBSCRIPTION",
            title: `Payment Verification Needed: ${auth.user.fullName}`,
            message: `${auth.user.fullName} submitted ₦${plan.priceNgn.toLocaleString()} (${reference}) for ${plan.name}.`,
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

          const plan = state.subscriptionPlans.find((p) => p.id === payment.planId);
          const durationDays = plan?.durationDays || 90;

          payment.status = approve ? "VERIFIED" : "FAILED";
          payment.verifiedBy = auth.user.fullName;
          payment.verifiedAt = new Date().toISOString();
          payment.notes = notes || payment.notes;

          let ent = state.studentEntitlements.find(
            (e) => e.studentUserId === payment.studentUserId
          );
          const startsAt = new Date();
          const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

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
                grantedBy: auth.user.fullName,
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
              ent.grantedBy = auth.user.fullName;
              ent.reason = "Verified payment record";
              ent.updatedAt = new Date().toISOString();
            }

            // Ensure enrolment matches paid classLevel + subjects
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
              enr.subjectIds = Array.from(new Set([...enr.subjectIds, ...ent.subjectIds]));
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
            title: approve ? "Subscription Confirmed & Active" : "Payment Verification Declined",
            message: approve
              ? `Your payment (${payment.reference}) is verified. Classroom and subject access is now active.`
              : `Your payment (${payment.reference}) could not be verified. ${notes}`,
            href: "/subscriptions",
          });

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: approve ? "VERIFY_PAYMENT_APPROVED" : "VERIFY_PAYMENT_DECLINED",
            entityType: "payment_record",
            entityId: payment.id,
            reason: notes,
          });

          return { payment, entitlement: ent };
        }

        case "GRANT_SCHOLARSHIP": {
          const studentUserId = String(body.studentUserId || "").trim();
          const classLevelId = String(body.classLevelId || "").trim();
          const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];
          const allSubjects = Boolean(body.allSubjects);
          const durationDays = Number(body.durationDays || 90);
          const reason = String(body.reason || "Administrator-authorized scholarship").trim();

          if (!studentUserId || !classLevelId) {
            throw new Error("Student and class level are required.");
          }

          const users = await fetchDirectoryUsers();
          const st = users.find((u) => u.id === studentUserId);
          if (!st) throw new Error("Student user not found.");

          const startsAt = new Date();
          const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
          const coveredSubjects = allSubjects
            ? state.subjects.filter((s) => s.classLevelIds.includes(classLevelId)).map((s) => s.id)
            : subjectIds;

          let ent = state.studentEntitlements.find((e) => e.studentUserId === studentUserId);
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
              grantedBy: auth.user.fullName,
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
            ent.grantedBy = auth.user.fullName;
            ent.reason = reason;
            ent.updatedAt = new Date().toISOString();
          }

          const enr = state.studentEnrolments.find((e) => e.studentUserId === studentUserId);
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
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
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
          const reason = String(body.reason || "Access revoked by administrator").trim();
          const ent = state.studentEntitlements.find((e) => e.studentUserId === studentUserId);
          if (!ent) throw new Error("Student entitlement record not found.");
          ent.accessStatus = nextStatus;
          ent.reason = reason;
          ent.updatedAt = new Date().toISOString();

          appendNotification(state, {
            recipientUserId: studentUserId,
            recipientRole: "STUDENT",
            category: "SUBSCRIPTION",
            title: nextStatus === "EXPIRED" ? "Subscription Expired" : "Learning Access Updated",
            message: reason,
            href: "/subscriptions",
          });

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
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
              (ent.accessStatus === "ACTIVE_PAID" || ent.accessStatus === "SCHOLARSHIP_GRANTED") &&
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

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process subscription request." },
      { status: 400 }
    );
  }
}

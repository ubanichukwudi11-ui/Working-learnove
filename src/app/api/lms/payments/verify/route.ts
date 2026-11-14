import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import { appendAuditLog, appendNotification, mutateLmsState } from "@/lib/lmsDb";

/**
 * Server-side Paystack transaction verification.
 * Never trusts client clicks alone; requires PAYSTACK_SECRET_KEY verification against Paystack API.
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["STUDENT", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "Paystack online gateway is not configured on the server (missing PAYSTACK_SECRET_KEY). Submit a bank transfer reference for School Admin verification instead.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const planId = String(body.planId || "");
    const classLevelId = String(body.classLevelId || "");
    const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];

    if (!reference || !planId || !classLevelId) {
      return NextResponse.json(
        { error: "Reference, planId, and classLevelId are required." },
        { status: 400 }
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
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.status || verifyData.data?.status !== "success") {
      return NextResponse.json(
        {
          error:
            verifyData?.message ||
            "Paystack could not verify a successful payment for this reference.",
        },
        { status: 402 }
      );
    }

    const paidAmountKobo = Number(verifyData.data.amount || 0);

    const result = await mutateLmsState((state) => {
      if (state.paymentRecords.some((p) => p.reference === reference)) {
        throw new Error("This payment reference has already been verified and applied.");
      }

      const plan = state.subscriptionPlans.find((p) => p.id === planId && p.isActive);
      if (!plan) throw new Error("Selected subscription plan not found.");

      if (paidAmountKobo < plan.priceNgn * 100) {
        throw new Error("Paid amount does not match the selected plan price.");
      }

      const coveredSubjects = plan.allSubjectsIncluded
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

      let ent = state.studentEntitlements.find((e) => e.studentUserId === auth.user.id);
      if (!ent) {
        ent = {
          id: `ent-${auth.user.id}`,
          studentUserId: auth.user.id,
          studentName: auth.user.fullName,
          studentEmail: auth.user.email,
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

      const enr = state.studentEnrolments.find((e) => e.studentUserId === auth.user.id);
      if (!enr) {
        state.studentEnrolments.push({
          id: `enr-${auth.user.id}`,
          studentUserId: auth.user.id,
          studentName: auth.user.fullName,
          studentEmail: auth.user.email,
          classLevelId,
          subjectIds: coveredSubjects,
          status: "ENROLLED",
          updatedAt: new Date().toISOString(),
        });
      } else {
        enr.classLevelId = classLevelId;
        enr.subjectIds = Array.from(new Set([...enr.subjectIds, ...coveredSubjects]));
        enr.status = "ENROLLED";
      }

      appendNotification(state, {
        recipientUserId: auth.user.id,
        recipientRole: "STUDENT",
        category: "SUBSCRIPTION",
        title: "Subscription Activated via Paystack",
        message: `Your ${plan.name} is active until ${expiresAt.toDateString()}.`,
        href: "/subscriptions",
      });

      appendAuditLog(state, {
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "PAYSTACK_PAYMENT_VERIFIED",
        entityType: "payment_record",
        entityId: payment.id,
        metadata: { reference, amountNgn: payment.amountNgn },
      });

      return { payment, entitlement: ent };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Payment verification failed." },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import {
  appendAuditLog,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "@/lib/lmsDb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const [state, users] = await Promise.all([loadLmsState(), fetchDirectoryUsers()]);

  const totalPaymentsNgn = state.paymentRecords
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + p.amountNgn, 0);

  return NextResponse.json({
    schools: state.schools,
    plans: state.subscriptionPlans,
    settings: {
      ...state.platformSettings,
      paystackPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      paystackServerEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
    },
    users,
    stats: {
      schoolsCount: state.schools.length,
      adminsCount: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length,
      teachersCount: users.filter((u) => u.role === "TEACHER").length,
      studentsCount: users.filter((u) => u.role === "STUDENT").length,
      activePaidCount: state.studentEntitlements.filter(
        (e) => e.accessStatus === "ACTIVE_PAID" || e.accessStatus === "SCHOLARSHIP_GRANTED"
      ).length,
      liveClassroomsCount: state.classrooms.filter((c) => c.status === "LIVE").length,
      totalRevenueNgn: totalPaymentsNgn,
    },
    auditLogs: state.auditLogs.slice(0, 60),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "");

    const result = await mutateLmsState(async (state) => {
      switch (action) {
        case "CREATE_SCHOOL": {
          const name = String(body.name || "").trim();
          const code = String(body.code || "").trim().toUpperCase();
          const s = String(body.state || "Lagos").trim();
          const address = String(body.address || "").trim();
          if (!name || !code) throw new Error("School name and code are required.");
          if (state.schools.some((sc) => sc.code.toLowerCase() === code.toLowerCase())) {
            throw new Error("A school with this code already exists.");
          }
          const created = {
            id: `school-${Date.now()}`,
            name,
            code,
            state: s,
            address,
            timezone: "Africa/Lagos",
            status: "ACTIVE" as const,
            createdAt: new Date().toISOString(),
          };
          state.schools.unshift(created);
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "CREATE_SCHOOL",
            entityType: "school",
            entityId: created.id,
            metadata: { name, code },
          });
          return { school: created };
        }

        case "TOGGLE_SCHOOL_STATUS": {
          const schoolId = String(body.schoolId || "");
          const school = state.schools.find((s) => s.id === schoolId);
          if (!school) throw new Error("School not found.");
          school.status = school.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "TOGGLE_SCHOOL_STATUS",
            entityType: "school",
            entityId: school.id,
            metadata: { status: school.status },
          });
          return { school };
        }

        case "ASSIGN_ADMIN_ROLE": {
          const userId = String(body.userId || "").trim();
          const targetRole = String(body.role || "").toUpperCase();
          if (!userId || !["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"].includes(targetRole)) {
            throw new Error("Valid userId and target role are required.");
          }
          const sb = getSupabaseServerClient();
          const { data: profile } = await sb
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();
          if (!profile) throw new Error("User profile not found in Supabase.");

          const dbRole = targetRole === "SUPER_ADMIN" ? "ADMIN" : targetRole;
          await sb.from("profiles").update({ role: dbRole, status: "ACTIVE" }).eq("id", userId);

          const email = String(profile.email || "").toLowerCase();
          if (targetRole === "SUPER_ADMIN") {
            if (!state.platformSettings.superAdminEmails.includes(email)) {
              state.platformSettings.superAdminEmails.push(email);
            }
          } else {
            state.platformSettings.superAdminEmails =
              state.platformSettings.superAdminEmails.filter((e) => e.toLowerCase() !== email);
          }

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "ASSIGN_ADMIN_ROLE",
            entityType: "user_role",
            entityId: userId,
            metadata: { targetRole, email },
          });
          return { updated: true };
        }

        case "UPSERT_PLAN": {
          const id = body.id ? String(body.id) : `plan-${Date.now()}`;
          const name = String(body.name || "").trim();
          const priceNgn = Number(body.priceNgn ?? 0);
          const billingCycle = (body.billingCycle || "TERM") as "MONTHLY" | "TERM" | "SESSION";
          const durationDays = Number(body.durationDays ?? 90);
          const allSubjectsIncluded = Boolean(body.allSubjectsIncluded);
          const description = String(body.description || "").trim();
          if (!name || priceNgn < 0 || durationDays < 1) {
            throw new Error("Valid plan name, price, and duration are required.");
          }
          const existing = state.subscriptionPlans.find((p) => p.id === id);
          if (existing) {
            existing.name = name;
            existing.priceNgn = priceNgn;
            existing.billingCycle = billingCycle;
            existing.durationDays = durationDays;
            existing.allSubjectsIncluded = allSubjectsIncluded;
            existing.description = description;
          } else {
            state.subscriptionPlans.push({
              id,
              name,
              priceNgn,
              billingCycle,
              durationDays,
              allSubjectsIncluded,
              includedSubjectIds: allSubjectsIncluded ? state.subjects.map((s) => s.id) : [],
              isActive: true,
              description,
            });
          }
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "UPSERT_SUBSCRIPTION_PLAN",
            entityType: "subscription_plan",
            entityId: id,
            metadata: { name, priceNgn },
          });
          return { plans: state.subscriptionPlans };
        }

        case "TOGGLE_PLAN": {
          const planId = String(body.planId || "");
          const plan = state.subscriptionPlans.find((p) => p.id === planId);
          if (!plan) throw new Error("Plan not found.");
          plan.isActive = !plan.isActive;
          return { plan };
        }

        case "UPDATE_SETTINGS": {
          if (typeof body.platformName === "string" && body.platformName.trim()) {
            state.platformSettings.platformName = body.platformName.trim();
          }
          if (typeof body.defaultRoomCapacity === "number" && body.defaultRoomCapacity > 0) {
            state.platformSettings.defaultRoomCapacity = body.defaultRoomCapacity;
          }
          if (typeof body.allowManualBankTransfer === "boolean") {
            state.platformSettings.allowManualBankTransfer = body.allowManualBankTransfer;
          }
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "UPDATE_PLATFORM_SETTINGS",
            entityType: "platform_settings",
            entityId: "global",
          });
          return { settings: state.platformSettings };
        }

        default:
          throw new Error("Unsupported Super Admin action.");
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update Super Admin settings." },
      { status: 400 }
    );
  }
}

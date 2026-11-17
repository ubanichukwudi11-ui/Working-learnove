import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";
import { appendAuditLog, mutateLmsState } from "@backend/services/lmsDb";
import type { LmsUserRole, UserAccountStatus } from "@backend/services/lmsTypes";

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (errorResponse) return errorResponse;

  const sb = getSupabaseServerClient();
  const userId = req.nextUrl.searchParams.get("userId")?.trim();

  if (userId) {
    const [{ data: profile, error: pErr }, { data: teacher }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
      sb.from("teacher_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (pErr || !profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        status: profile.status,
        avatarUrl: profile.avatar_url,
        phone: profile.phone,
        gender: profile.gender,
        country: profile.country,
        state: profile.state,
        address: profile.address,
        dob: profile.dob,
        subject: teacher?.subject,
        qualification: teacher?.qualification,
        institution: teacher?.institution,
        experience: teacher?.experience,
        licenseNumber: teacher?.license_number,
        profilePhoto: teacher?.profile_photo,
        certificate: teacher?.teaching_certificate,
        degreeCertificate: teacher?.degree_certificate,
        governmentId: teacher?.government_id,
        cv: teacher?.cv,
        verificationScore: teacher?.verification_score ?? 0,
        adminNotes: teacher?.admin_notes,
      },
    });
  }

  const { data: profiles, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    status: p.status,
    avatarUrl: p.avatar_url,
    phone: p.phone,
    gender: p.gender,
    country: p.country,
    state: p.state,
    address: p.address,
    dob: p.dob,
  }));

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const targetUserId = String(body.userId || "").trim();
    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    const updates: { status?: UserAccountStatus; role?: LmsUserRole } = {};
    if (typeof body.status === "string") {
      const allowedStatuses: UserAccountStatus[] = [
        "ACTIVE",
        "PENDING",
        "REJECTED",
        "SUSPENDED",
      ];
      if (!allowedStatuses.includes(body.status as UserAccountStatus)) {
        return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
      }
      updates.status = body.status as UserAccountStatus;
    }

    if (typeof body.role === "string") {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only Super Administrators can reassign user roles." },
          { status: 403 }
        );
      }
      if (targetUserId === user.id) {
        return NextResponse.json(
          { error: "You cannot demote or change your own Super Admin role." },
          { status: 400 }
        );
      }
      const allowedRoles: LmsUserRole[] = [
        "SUPER_ADMIN",
        "ADMIN",
        "TEACHER",
        "STUDENT",
        "PARENT",
      ];
      if (!allowedRoles.includes(body.role as LmsUserRole)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      updates.role = body.role as LmsUserRole;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
    }

    const sb = getSupabaseServerClient();
    const { error } = await sb.from("profiles").update(updates).eq("id", targetUserId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await mutateLmsState((lms) => {
      appendAuditLog(lms, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "ADMIN_USER_UPDATED",
        entityType: "profile",
        entityId: targetUserId,
        metadata: updates,
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to update user.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, ["SUPER_ADMIN", "ADMIN"]);
  if (errorResponse || !user) return errorResponse;

  const targetUserId = req.nextUrl.searchParams.get("userId")?.trim() || "";
  if (!targetUserId) {
    return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own administrator account." },
      { status: 400 }
    );
  }

  const sb = getSupabaseServerClient();
  const { error } = await sb.from("profiles").delete().eq("id", targetUserId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await mutateLmsState((lms) => {
    appendAuditLog(lms, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "ADMIN_USER_DELETED",
      entityType: "profile",
      entityId: targetUserId,
    });
  });

  return NextResponse.json({ success: true });
}

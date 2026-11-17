import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireApiAuth } from "@backend/services/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to load session.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const sb = getSupabaseServerClient();

    const profileUpdates: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) {
      profileUpdates.full_name = body.fullName.trim().slice(0, 120);
    }
    if (typeof body.avatarUrl === "string") {
      profileUpdates.avatar_url = body.avatarUrl.trim() || null;
    }
    if (typeof body.phone === "string") {
      profileUpdates.phone = body.phone.trim() || null;
    }
    if (typeof body.gender === "string") {
      profileUpdates.gender = body.gender.trim() || null;
    }
    if (typeof body.country === "string") {
      profileUpdates.country = body.country.trim() || null;
    }
    if (typeof body.state === "string") {
      profileUpdates.state = body.state.trim() || null;
    }
    if (typeof body.address === "string") {
      profileUpdates.address = body.address.trim() || null;
    }
    if (typeof body.dob === "string") {
      profileUpdates.dob = body.dob.trim() || null;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await sb
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
    }

    if (
      user.role === "STUDENT" &&
      (typeof body.classLevel === "string" || typeof body.examPreparation === "string")
    ) {
      const studentUpdates: Record<string, unknown> = {};
      if (typeof body.classLevel === "string" && body.classLevel.trim()) {
        studentUpdates.class_level = body.classLevel.trim();
      }
      if (typeof body.examPreparation === "string" && body.examPreparation.trim()) {
        studentUpdates.exam_preparation = body.examPreparation.trim();
      }
      await sb
        .from("student_profiles")
        .update(studentUpdates)
        .eq("user_id", user.id);
    }

    const refreshed = await getAuthenticatedUser(req);
    return NextResponse.json({ success: true, user: refreshed });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to update profile.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

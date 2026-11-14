import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { loadLmsState } from "@/lib/lmsDb";

/**
 * Exchanges a client Supabase access_token (e.g. after OAuth callback) for
 * an httpOnly learnova_access_token cookie and authoritative user profile.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = String(body.accessToken || "").trim();
    if (!accessToken) {
      return NextResponse.json({ error: "Access token required." }, { status: 400 });
    }

    const sb = getSupabaseServerClient();
    const {
      data: { user: authUser },
      error,
    } = await sb.auth.getUser(accessToken);
    if (error || !authUser) {
      return NextResponse.json({ error: "Invalid session token." }, { status: 401 });
    }

    const [{ data: profile }, state] = await Promise.all([
      sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
      loadLmsState(),
    ]);

    let role = profile?.role || authUser.user_metadata?.role || "STUDENT";
    const email = (authUser.email || profile?.email || "").toLowerCase();
    if (
      role === "ADMIN" &&
      (state.platformSettings.superAdminEmails || [])
        .map((e) => e.toLowerCase())
        .includes(email)
    ) {
      role = "SUPER_ADMIN";
    }

    const user = {
      id: authUser.id,
      email: authUser.email || "",
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        "User",
      role,
      status: profile?.status || "ACTIVE",
      avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("learnova_access_token", accessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set("learnova_user", JSON.stringify(user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sync session." }, { status: 500 });
  }
}

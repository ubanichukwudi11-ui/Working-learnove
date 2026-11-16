import { NextRequest, NextResponse } from "next/server";
import {
  AuthServiceError,
  exchangeOAuthSessionToken,
} from "@backend/services/serverAuth";

/**
 * Exchanges a client Supabase access_token (e.g. after OAuth callback) for
 * an httpOnly learnova_access_token cookie and authoritative user profile.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, user } = await exchangeOAuthSessionToken(
      String(body.accessToken || "")
    );

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
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Could not sync session." },
      { status: 500 }
    );
  }
}

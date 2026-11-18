import { NextRequest, NextResponse } from "next/server";
import {
  AuthServiceError,
  completeOAuthRoleSelection,
  shouldUseSecureCookie,
} from "@backend/services/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, user } = await completeOAuthRoleSelection(
      String(body.accessToken || ""),
      String(body.role || "")
    );

    const response = NextResponse.json({ success: true, user });
    const isSecure = shouldUseSecureCookie(req);
    response.cookies.set("learnova_access_token", accessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isSecure,
    });
    response.cookies.set("learnova_user", JSON.stringify(user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isSecure,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg =
      (err as { message?: string })?.message ||
      "Could not complete role selection.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

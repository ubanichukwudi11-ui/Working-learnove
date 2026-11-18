import { NextRequest, NextResponse } from "next/server";
import {
  AuthServiceError,
  loginLearnovaAccount,
  shouldUseSecureCookie,
} from "@backend/services/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, user } = await loginLearnovaAccount(body);

    const response = NextResponse.json({
      success: true,
      session,
      user,
    });

    try {
      const isSecure = shouldUseSecureCookie(req);
      response.cookies.set("learnova_user", JSON.stringify(user), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: isSecure,
      });
      if (session?.access_token) {
        response.cookies.set("learnova_access_token", session.access_token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
          secure: isSecure,
        });
      }
    } catch {}

    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }
    const errMsg = (err as { message?: string })?.message;
    console.error("Login API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "An unexpected error occurred during login.",
      },
      { status: 500 }
    );
  }
}

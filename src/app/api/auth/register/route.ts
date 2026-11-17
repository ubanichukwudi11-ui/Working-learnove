import { NextResponse } from "next/server";
import {
  AuthServiceError,
  registerLearnovaAccount,
} from "@backend/services/serverAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session, user, requiresEmailConfirmation } =
      await registerLearnovaAccount(body);

    const response = NextResponse.json({
      success: true,
      session,
      user,
      requiresEmailConfirmation,
    });

    if (session?.access_token) {
      const isProd = process.env.NODE_ENV === "production";
      response.cookies.set("learnova_access_token", session.access_token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: isProd,
      });
      response.cookies.set("learnova_user", JSON.stringify(user), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: isProd,
      });
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }
    const errMsg = (err as { message?: string })?.message;
    console.error("Register API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: errMsg || "An unexpected error occurred during registration.",
      },
      { status: 500 }
    );
  }
}

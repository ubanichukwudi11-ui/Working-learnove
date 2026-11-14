import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  AuthServiceError,
  checkAuthRateLimit,
  registerInputSchema,
  registerNewAccount,
} from "@backend/services/authService";

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parsed = registerInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ||
        "Please fill in all required registration fields.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const rate = checkAuthRateLimit(
      req,
      "register",
      parsed.data.email,
      15,
      15 * 60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please try again in ${rate.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    const { user, session, requiresEmailConfirmation } =
      await registerNewAccount(parsed.data);

    const response = NextResponse.json({
      success: true,
      session,
      user,
      requiresEmailConfirmation,
    });

    if (session?.access_token) {
      applyAuthCookies(req, response, {
        user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error("Register API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during registration.",
      },
      { status: 500 }
    );
  }
}

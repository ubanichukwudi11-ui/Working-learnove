import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  authenticateWithPassword,
  AuthServiceError,
  checkAuthRateLimit,
  loginInputSchema,
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

    const parsed = loginInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Email and password are required.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const rate = checkAuthRateLimit(req, "login", email, 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rate.retryAfterSeconds} seconds and try again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    const { user, session } = await authenticateWithPassword(email, password);

    const response = NextResponse.json({
      success: true,
      session,
      user,
    });

    applyAuthCookies(req, response, {
      user,
      accessToken: session?.access_token,
      refreshToken: session?.refresh_token,
    });

    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  AuthServiceError,
  exchangeAccessTokenForUser,
  sessionExchangeSchema,
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

    const parsed = sessionExchangeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Access token required." },
        { status: 400 }
      );
    }

    const user = await exchangeAccessTokenForUser(parsed.data.accessToken);

    const response = NextResponse.json({ success: true, user });
    applyAuthCookies(req, response, {
      user,
      accessToken: parsed.data.accessToken,
      refreshToken: parsed.data.refreshToken,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Could not sync session." },
      { status: 500 }
    );
  }
}

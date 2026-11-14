import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  resolveSessionFromRequest,
} from "@backend/services/authService";

export async function GET(req: NextRequest) {
  try {
    const { user, refreshedSession } = await resolveSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user });
    if (refreshedSession?.access_token) {
      applyAuthCookies(req, response, {
        user,
        accessToken: refreshedSession.access_token,
        refreshToken: refreshedSession.refresh_token,
      });
    }

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load session.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

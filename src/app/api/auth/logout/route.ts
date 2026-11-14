import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  extractBearerOrCookieToken,
} from "@backend/services/authService";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";

export async function POST(req: NextRequest) {
  const token = extractBearerOrCookieToken(req);
  if (token) {
    try {
      const sb = getSupabaseServerClient();
      await sb.auth.admin.signOut(token);
    } catch {
      // Non-fatal: always clear cookies regardless
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(req, response);
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { shouldUseSecureCookie } from "@backend/services/serverAuth";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const isSecure = shouldUseSecureCookie(req);
  response.cookies.set("learnova_access_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: isSecure,
  });
  response.cookies.set("learnova_user", "", {
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: isSecure,
  });
  return response;
}

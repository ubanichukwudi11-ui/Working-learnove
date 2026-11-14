import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https:") ? "https" : "http");
  const isHttps = proto.includes("https");
  const cookieBase = {
    path: "/",
    expires: new Date(0),
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    secure: isHttps,
  };

  const response = NextResponse.json({ success: true });
  response.cookies.set("learnova_access_token", "", {
    ...cookieBase,
    httpOnly: true,
  });
  response.cookies.set("learnova_user", "", cookieBase);
  return response;
}

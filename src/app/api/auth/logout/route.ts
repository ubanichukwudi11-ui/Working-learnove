import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set("learnova_access_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: isProd,
  });
  response.cookies.set("learnova_user", "", {
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: isProd,
  });
  return response;
}

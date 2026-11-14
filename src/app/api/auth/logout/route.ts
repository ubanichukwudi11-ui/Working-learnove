import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("learnova_access_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  });
  response.cookies.set("learnova_user", "", {
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  });
  return response;
}

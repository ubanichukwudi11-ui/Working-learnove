import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load session." },
      { status: 500 }
    );
  }
}

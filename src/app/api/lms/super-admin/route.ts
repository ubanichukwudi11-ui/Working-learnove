import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getSuperAdminOverview,
  handleSuperAdminMutation,
} from "@backend/services/superAdminService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const overview = await getSuperAdminOverview();
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleSuperAdminMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to update Super Admin settings." },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getParentPortalOverview,
  linkParentWard,
  ParentPortalServiceError,
  unlinkParentWard,
} from "@backend/services/parentPortalService";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, [
    "PARENT",
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  if (errorResponse || !user) return errorResponse;

  const overview = await getParentPortalOverview(user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, [
    "PARENT",
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "").trim();

    if (action === "LINK_WARD") {
      const link = await linkParentWard(user, body);
      return NextResponse.json({ link }, { status: 201 });
    }

    if (action === "UNLINK_WARD") {
      const result = await unlinkParentWard(user, String(body.linkId || ""));
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Unsupported parent portal action." },
      { status: 400 }
    );
  } catch (err: unknown) {
    if (err instanceof ParentPortalServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to process parent portal request." },
      { status: 400 }
    );
  }
}

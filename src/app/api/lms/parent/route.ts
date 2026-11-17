import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getParentPortalOverview,
  getStudentGuardianRequests,
  linkParentWard,
  ParentPortalServiceError,
  respondToParentLinkRequest,
  unlinkParentWard,
  verifyParentWardCode,
} from "@backend/services/parentPortalService";

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  if (scope === "student") {
    const { user, errorResponse } = await requireApiAuth(req, [
      "STUDENT",
      "ADMIN",
      "SUPER_ADMIN",
    ]);
    if (errorResponse || !user) return errorResponse;
    const requests = await getStudentGuardianRequests(user.id);
    return NextResponse.json({ requests });
  }

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
    "STUDENT",
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "").trim();

    if (action === "RESPOND_LINK") {
      if (!["STUDENT", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { error: "Only the student or an admin can approve/reject guardian requests." },
          { status: 403 }
        );
      }
      const decision =
        String(body.decision || "").toUpperCase() === "APPROVE"
          ? "APPROVE"
          : "REJECT";
      const result = await respondToParentLinkRequest(
        user,
        String(body.linkId || ""),
        decision
      );
      return NextResponse.json(result);
    }

    if (action === "UNLINK_WARD") {
      const result = await unlinkParentWard(user, String(body.linkId || ""));
      return NextResponse.json(result);
    }

    if (!["PARENT", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only Parent or Admin accounts can initiate guardian ward links." },
        { status: 403 }
      );
    }

    if (action === "LINK_WARD") {
      const result = await linkParentWard(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "VERIFY_CODE") {
      const result = await verifyParentWardCode(
        user,
        String(body.linkId || ""),
        String(body.verificationCode || "")
      );
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

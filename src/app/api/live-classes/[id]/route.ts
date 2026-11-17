import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  applyAuthenticatedRoomAction,
  getRoomSnapshotFromRecord,
  getSignalsSince,
  verifyLiveRoomAccess,
} from "@backend/services/liveRoomServer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const access = await verifyLiveRoomAccess(id, auth.user);
  if (!access.allowed || !access.classroom) {
    return NextResponse.json(
      {
        error: access.error || "Access denied for this classroom.",
        code: access.code || "FORBIDDEN",
      },
      { status: access.httpStatus }
    );
  }

  const snapshot = await getRoomSnapshotFromRecord(access.classroom);
  const { signals, latestSeq } = getSignalsSince();

  return NextResponse.json({
    snapshot,
    signals,
    latestSeq,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req, ["TEACHER", "STUDENT"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = await context.params;
    const access = await verifyLiveRoomAccess(id, auth.user);
    if (!access.allowed || !access.classroom) {
      return NextResponse.json(
        {
          error: access.error || "Access denied for this classroom.",
          code: access.code || "FORBIDDEN",
        },
        { status: access.httpStatus }
      );
    }

    const body = await req.json();
    const snapshot = await applyAuthenticatedRoomAction(
      id,
      access.classroom,
      auth.user,
      body
    );
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json({ error: "Failed to process classroom action." }, { status: 400 });
  }
}

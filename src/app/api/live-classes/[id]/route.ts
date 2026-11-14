import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import {
  applyAuthenticatedRoomAction,
  getRoomSnapshotFromRecord,
  getSignalsSince,
  verifyLiveRoomAccess,
} from "@/lib/liveRoomServer";

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

  const { searchParams } = new URL(req.url);
  const sinceSeq = Number(searchParams.get("sinceSeq") || "0");
  const snapshot = getRoomSnapshotFromRecord(access.classroom);
  const { signals, latestSeq } = getSignalsSince(id, sinceSeq, auth.user.id);

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

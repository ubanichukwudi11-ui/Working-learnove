import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getRoomSnapshotFromRecord,
  verifyLiveRoomAccess,
} from "@backend/services/liveRoomServer";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req, ["TEACHER", "STUDENT"]);
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

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json(
      {
        error:
          "LiveKit Cloud media credentials are not configured on this server.",
        code: "LIVEKIT_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const isTeacherHost =
    auth.user.role === "TEACHER" &&
    access.classroom.teacherUserId === auth.user.id;

  const snapshot = await getRoomSnapshotFromRecord(access.classroom);
  const participant = snapshot.participants.find((p) => p.id === auth.user.id);
  const canPublish =
    isTeacherHost || participant?.stageStatus === "approved";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: auth.user.id,
    name: auth.user.fullName,
    ttl: "2h",
    metadata: JSON.stringify({
      role: auth.user.role,
      classId: id,
    }),
  });

  at.addGrant({
    roomJoin: true,
    room: id,
    canPublish,
    canPublishData: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return NextResponse.json({
    token,
    serverUrl,
    identity: auth.user.id,
    room: id,
    canPublish,
  });
}

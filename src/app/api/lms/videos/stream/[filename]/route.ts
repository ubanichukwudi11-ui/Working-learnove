import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  resolveSignedVideoStreamUrl,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { filename } = await context.params;
    const signedUrl = await resolveSignedVideoStreamUrl(auth.user, filename);
    return NextResponse.redirect(signedUrl, 307);
  } catch (err: unknown) {
    if (err instanceof VideoServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Video stream error:", err);
    return NextResponse.json(
      { error: "Unable to authorize video stream." },
      { status: 500 }
    );
  }
}

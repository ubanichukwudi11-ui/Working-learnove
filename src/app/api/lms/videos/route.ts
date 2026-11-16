import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getVideoLessonsOverview,
  handleVideoLessonsMutation,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const overview = await getVideoLessonsOverview(auth.user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleVideoLessonsMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof VideoServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to update video lessons." },
      { status: 400 }
    );
  }
}

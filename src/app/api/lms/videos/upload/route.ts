import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  uploadVideoLessonFile,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const result = await uploadVideoLessonFile(auth.user, formData.get("file"));
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof VideoServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: errMsg || "Failed to process video upload." },
      { status: 500 }
    );
  }
}

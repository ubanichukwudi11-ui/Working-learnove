import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  uploadVideoMaterialFile,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN", "TEACHER"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const result = await uploadVideoMaterialFile(formData.get("file"));
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof VideoServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to upload lesson material." },
      { status: 500 }
    );
  }
}

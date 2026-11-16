import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getTeacherApplicationsOverview,
  handleTeacherApplicationMutation,
  TeacherApplicationServiceError,
} from "@backend/services/teacherApplicationService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const overview = await getTeacherApplicationsOverview(auth.user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleTeacherApplicationMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof TeacherApplicationServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to process teacher application." },
      { status: 400 }
    );
  }
}

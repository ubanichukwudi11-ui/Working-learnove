import { NextRequest, NextResponse } from "next/server";
import { enforceActiveTeacher, requireApiAuth } from "@backend/services/serverAuth";
import {
  ClassroomServiceError,
  getClassroomsOverview,
  handleClassroomMutation,
} from "@backend/services/classroomService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const teacherGate = enforceActiveTeacher(auth.user);
  if (teacherGate) return teacherGate;

  const overview = await getClassroomsOverview(auth.user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const teacherGate = enforceActiveTeacher(auth.user);
  if (teacherGate) return teacherGate;

  try {
    const body = await req.json();
    const result = await handleClassroomMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof ClassroomServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to update classroom." },
      { status: 400 }
    );
  }
}

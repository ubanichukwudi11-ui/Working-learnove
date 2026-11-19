import { NextRequest, NextResponse } from "next/server";
import { enforceActiveTeacher, requireApiAuth } from "@backend/services/serverAuth";
import {
  getTimetableOverview,
  handleTimetableMutation,
} from "@backend/services/timetableService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const teacherGate = enforceActiveTeacher(auth.user);
  if (teacherGate) return teacherGate;

  const overview = await getTimetableOverview(auth.user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleTimetableMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to update timetable." },
      { status: 400 }
    );
  }
}

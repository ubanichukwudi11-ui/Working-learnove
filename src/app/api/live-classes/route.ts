import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  ClassroomServiceError,
  listLiveClassesForUser,
} from "@backend/services/classroomService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const payload = await listLiveClassesForUser(auth.user);
    return NextResponse.json(payload);
  } catch (err: unknown) {
    if (err instanceof ClassroomServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to list live classrooms." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  return NextResponse.json(
    {
      error:
        "Official classrooms are automatically generated from the Official Timetable Builder to enforce teacher approvals and room capacity limits.",
    },
    { status: 400 }
  );
}

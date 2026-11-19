import { NextRequest, NextResponse } from "next/server";
import { enforceActiveTeacher, requireApiAuth } from "@backend/services/serverAuth";
import { listLiveClassesForUser } from "@backend/services/classroomService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const teacherGate = enforceActiveTeacher(auth.user);
  if (teacherGate) return teacherGate;

  const payload = await listLiveClassesForUser(auth.user);
  return NextResponse.json(payload);
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

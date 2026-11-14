import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { fetchDirectoryUsers, loadLmsState } from "@backend/services/lmsDb";
import { computeStudentAnalytics } from "@backend/services/reportCardService";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const requestedStudentId = req.nextUrl.searchParams.get("studentId")?.trim();
  const state = await loadLmsState();

  let targetStudent = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    classLevel: undefined as string | undefined,
  };

  if (requestedStudentId && requestedStudentId !== user.id) {
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isLinkedParent =
      user.role === "PARENT" &&
      (state.parentStudentLinks || []).some(
        (l) => l.parentUserId === user.id && l.studentUserId === requestedStudentId
      );

    if (!isAdmin && !isLinkedParent) {
      return NextResponse.json(
        { error: "Not authorized to view this student's analytics." },
        { status: 403 }
      );
    }

    const dir = await fetchDirectoryUsers();
    const match = dir.find((u) => u.id === requestedStudentId);
    if (!match) {
      return NextResponse.json({ error: "Student account not found." }, { status: 404 });
    }
    targetStudent = {
      id: match.id,
      fullName: match.fullName,
      email: match.email,
      classLevel: match.classLevel,
    };
  }

  const summary = computeStudentAnalytics(state, targetStudent);
  return NextResponse.json({ analytics: summary });
}

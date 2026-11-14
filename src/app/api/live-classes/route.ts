import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import { isStudentEntitledForSubject, loadLmsState } from "@/lib/lmsDb";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const state = await loadLmsState();
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  const mapClassroom = (
    c: (typeof state.classrooms)[number],
    extra: Record<string, unknown> = {}
  ) => ({
    id: c.id,
    title: c.lessonTitle || `${c.subjectName} · ${c.groupName}`,
    topic: c.lessonDescription || c.lessonObjectives || `${c.classLevelName} Lesson`,
    teacher: c.teacherName,
    teacherAvatar: "/images/avatar-funke.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    subject: c.subjectName,
    classLevel: `${c.classLevelName} · ${c.groupName}`,
    term: "2025/2026 Academic Session",
    timeWat: `${c.dayOfWeek} · ${c.startTime} – ${c.endTime} WAT`,
    examFocus: `${c.mode} Classroom`,
    startTime: c.startedAt || new Date().toISOString(),
    endTime: c.endedAt || new Date().toISOString(),
    studentsCount: c.studentUserIds.length,
    maxCapacity: c.maxCapacity,
    status:
      c.status === "LIVE"
        ? "live"
        : c.status === "ENDED"
        ? "ended"
        : c.status === "CANCELLED"
        ? "ended"
        : c.status === "PREPARED"
        ? "waiting"
        : "scheduled",
    lifecycleStatus: c.status,
    groupName: c.groupName,
    ...extra,
  });

  if (isAdmin) {
    return NextResponse.json({
      classes: state.classrooms.map((c) => mapClassroom(c)),
    });
  }

  if (auth.user.role === "TEACHER") {
    return NextResponse.json({
      classes: state.classrooms
        .filter((c) => c.teacherUserId === auth.user.id)
        .map((c) => mapClassroom(c)),
    });
  }

  if (auth.user.role === "STUDENT") {
    const publishedIds = new Set(
      state.timetableEntries
        .filter((e) => e.publicationStatus === "PUBLISHED")
        .map((e) => e.id)
    );

    const classes = state.classrooms
      .filter((c) => publishedIds.has(c.timetableEntryId) && c.studentUserIds.includes(auth.user.id))
      .map((c) => {
        const ent = isStudentEntitledForSubject(state, auth.user.id, c.subjectId, c.classLevelId);
        return mapClassroom(c, {
          entitled: ent.entitled,
          entitlementStatus: ent.status,
          entitlementReason: ent.reason,
        });
      });

    return NextResponse.json({ classes });
  }

  return NextResponse.json({ classes: [] });
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

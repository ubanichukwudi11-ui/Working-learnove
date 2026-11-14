import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "@backend/services/lmsDb";
import { computeStudentAnalytics } from "@backend/services/reportCardService";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, [
    "PARENT",
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  if (errorResponse || !user) return errorResponse;

  const [state, dir] = await Promise.all([loadLmsState(), fetchDirectoryUsers()]);

  // Existing explicit links for this parent
  let myLinks = (state.parentStudentLinks || []).filter(
    (l) => l.parentUserId === user.id
  );

  // Seamless first-time seed link to demo student if parent has 0 explicit links yet
  if (myLinks.length === 0 && user.role === "PARENT") {
    const defaultStudent =
      dir.find((u) => u.email.toLowerCase() === "student@learnova.ng") ||
      dir.find((u) => u.role === "STUDENT");
    if (defaultStudent) {
      const created = await mutateLmsState((s) => {
        const exists = s.parentStudentLinks.find(
          (l) => l.parentUserId === user.id && l.studentUserId === defaultStudent.id
        );
        if (exists) return exists;
        const rec = {
          id: `psl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          parentUserId: user.id,
          parentEmail: user.email,
          studentUserId: defaultStudent.id,
          studentEmail: defaultStudent.email,
          relationship: "Parent / Guardian",
          linkedAt: new Date().toISOString(),
        };
        s.parentStudentLinks.push(rec);
        return rec;
      });
      myLinks = [created];
    }
  }

  const wards = myLinks
    .map((link) => {
      const student = dir.find((u) => u.id === link.studentUserId);
      if (!student) return null;

      const analytics = computeStudentAnalytics(state, {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        classLevel: student.classLevel,
      });

      const enrolment = state.studentEnrolments.find(
        (e) => e.studentUserId === student.id
      );
      const entitlement = state.studentEntitlements.find(
        (e) => e.studentUserId === student.id
      );
      const payments = state.paymentRecords
        .filter((p) => p.studentUserId === student.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const classLevelId = entitlement?.classLevelId || enrolment?.classLevelId;
      const upcomingTimetable = state.timetableEntries
        .filter(
          (t) =>
            t.publicationStatus === "PUBLISHED" &&
            (!classLevelId || t.classLevelId === classLevelId)
        )
        .slice(0, 6)
        .map((t) => {
          const subject = state.subjects.find((s) => s.id === t.subjectId);
          return {
            id: t.id,
            dayOfWeek: t.dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
            mode: t.mode,
            subjectName: subject?.name || "Subject",
          };
        });

      return {
        linkId: link.id,
        relationship: link.relationship,
        linkedAt: link.linkedAt,
        student: {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          classLevel: student.classLevel || analytics.classLevelName,
        },
        analytics,
        payments: payments.slice(0, 4),
        upcomingTimetable,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    wards,
    subscriptionPlans: state.subscriptionPlans.filter((p) => p.isActive),
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req, [
    "PARENT",
    "ADMIN",
    "SUPER_ADMIN",
  ]);
  if (errorResponse || !user) return errorResponse;

  const body = await req.json();
  const action = String(body.action || "").trim();

  if (action === "LINK_WARD") {
    const studentEmail = String(body.studentEmail || "").trim().toLowerCase();
    const relationship = String(body.relationship || "Parent / Guardian").trim();
    if (!studentEmail) {
      return NextResponse.json(
        { error: "Please enter the student's Learnova email address." },
        { status: 400 }
      );
    }

    const dir = await fetchDirectoryUsers();
    const student = dir.find(
      (u) => u.email.toLowerCase() === studentEmail && u.role === "STUDENT"
    );
    if (!student) {
      return NextResponse.json(
        {
          error: `No student account found with email "${studentEmail}". Verify the student's registered Learnova email.`,
        },
        { status: 404 }
      );
    }

    const link = await mutateLmsState((state) => {
      const existing = state.parentStudentLinks.find(
        (l) => l.parentUserId === user.id && l.studentUserId === student.id
      );
      if (existing) {
        existing.relationship = relationship;
        return existing;
      }
      const created = {
        id: `psl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parentUserId: user.id,
        parentEmail: user.email,
        studentUserId: student.id,
        studentEmail: student.email,
        relationship,
        linkedAt: new Date().toISOString(),
      };
      state.parentStudentLinks.push(created);
      return created;
    });

    return NextResponse.json({ link }, { status: 201 });
  }

  if (action === "UNLINK_WARD") {
    const linkId = String(body.linkId || "").trim();
    if (!linkId) {
      return NextResponse.json({ error: "linkId is required." }, { status: 400 });
    }
    await mutateLmsState((state) => {
      state.parentStudentLinks = state.parentStudentLinks.filter(
        (l) => !(l.id === linkId && l.parentUserId === user.id)
      );
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported parent portal action." }, { status: 400 });
}

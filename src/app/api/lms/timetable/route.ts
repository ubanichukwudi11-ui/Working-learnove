import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  isStudentEntitledForSubject,
  loadLmsState,
  mutateLmsState,
} from "@/lib/lmsDb";
import {
  allocateGroupsForTimetableEntry,
  getEligibleStudentsForLesson,
  validateTimetableEntry,
} from "@/lib/allocationEngine";
import type { TimetableEntryRecord } from "@/lib/lmsTypes";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const [state, users] = await Promise.all([loadLmsState(), fetchDirectoryUsers()]);
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  if (isAdmin) {
    // Recalculate eligible counts cleanly for display
    const entries = state.timetableEntries.map((entry) => {
      const eligible = getEligibleStudentsForLesson(
        state,
        users,
        entry.classLevelId,
        entry.subjectId
      );
      return {
        ...entry,
        eligibleStudentCount: eligible.length,
      };
    });

    return NextResponse.json({
      entries,
      groups: state.studentGroups,
      classrooms: state.classrooms,
      classLevels: state.classLevels.filter((c) => c.isActive),
      subjects: state.subjects.filter((s) => s.isActive),
      sessions: state.sessions,
      terms: state.terms,
      approvedTeachers: state.teacherApprovals.filter((a) => a.status === "APPROVED"),
      teachers: users.filter((u) => u.role === "TEACHER"),
      defaultCapacity: state.platformSettings.defaultRoomCapacity,
    });
  }

  if (auth.user.role === "TEACHER") {
    const teacherEntries = state.timetableEntries.filter(
      (e) => e.assignedTeacherIds.includes(auth.user.id) && e.publicationStatus === "PUBLISHED"
    );
    const teacherGroups = state.studentGroups.filter(
      (g) => g.teacherUserId === auth.user.id
    );
    const teacherClassrooms = state.classrooms.filter(
      (c) => c.teacherUserId === auth.user.id
    );
    return NextResponse.json({
      entries: teacherEntries,
      groups: teacherGroups,
      classrooms: teacherClassrooms,
      classLevels: state.classLevels,
      subjects: state.subjects,
    });
  }

  // Student view: strictly published lessons matching student's class level & active entitlement, showing ONLY their allocated group!
  const enrolment = state.studentEnrolments.find((e) => e.studentUserId === auth.user.id);
  const myGroups = state.studentGroups.filter((g) => g.studentUserIds.includes(auth.user.id));
  const myGroupIds = new Set(myGroups.map((g) => g.id));
  const myClassrooms = state.classrooms.filter((c) => myGroupIds.has(c.studentGroupId));

  const studentEntries = state.timetableEntries.filter((e) => {
    if (e.publicationStatus !== "PUBLISHED") return false;
    if (enrolment && e.classLevelId !== enrolment.classLevelId) return false;
    const ent = isStudentEntitledForSubject(state, auth.user.id, e.subjectId, e.classLevelId);
    return ent.entitled || myGroups.some((g) => g.timetableEntryId === e.id);
  });

  return NextResponse.json({
    entries: studentEntries,
    groups: myGroups,
    classrooms: myClassrooms,
    classLevels: state.classLevels,
    subjects: state.subjects,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const users = await fetchDirectoryUsers();

    const result = await mutateLmsState((state) => {
      switch (action) {
        case "CREATE_TIMETABLE_ENTRY":
        case "UPDATE_TIMETABLE_ENTRY": {
          const id = body.id ? String(body.id) : undefined;
          const classLevelId = String(body.classLevelId || "");
          const subjectId = String(body.subjectId || "");
          const assignedTeacherIds: string[] = Array.isArray(body.assignedTeacherIds)
            ? body.assignedTeacherIds
            : [];
          const dayOfWeek = (body.dayOfWeek || "Monday") as TimetableEntryRecord["dayOfWeek"];
          const startTime = String(body.startTime || "09:00");
          const endTime = String(body.endTime || "10:00");
          const mode = (body.mode || "ONLINE") as TimetableEntryRecord["mode"];
          const maxCapacityPerRoom = Number(
            body.maxCapacityPerRoom || state.platformSettings.defaultRoomCapacity || 50
          );
          const publicationStatus = (body.publicationStatus || "DRAFT") as TimetableEntryRecord["publicationStatus"];

          const validation = validateTimetableEntry(state, users, {
            id,
            classLevelId,
            subjectId,
            assignedTeacherIds,
            dayOfWeek,
            startTime,
            endTime,
            maxCapacityPerRoom,
            publicationStatus,
          });

          if (!validation.valid) {
            throw new Error(validation.errors.join(" "));
          }

          const [sh, sm] = startTime.split(":").map(Number);
          const [eh, em] = endTime.split(":").map(Number);
          const durationMinutes = eh * 60 + em - (sh * 60 + sm);

          const activeTerm = state.terms.find((t) => t.isCurrent) || state.terms[0];
          const activeSession = state.sessions.find((s) => s.isCurrent) || state.sessions[0];

          let entry: TimetableEntryRecord;
          if (id) {
            const existing = state.timetableEntries.find((e) => e.id === id);
            if (!existing) throw new Error("Timetable entry not found.");
            existing.classLevelId = classLevelId;
            existing.subjectId = subjectId;
            existing.assignedTeacherIds = assignedTeacherIds;
            existing.dayOfWeek = dayOfWeek;
            existing.startTime = startTime;
            existing.endTime = endTime;
            existing.durationMinutes = durationMinutes;
            existing.mode = mode;
            existing.maxCapacityPerRoom = maxCapacityPerRoom;
            existing.publicationStatus = publicationStatus;
            existing.updatedAt = new Date().toISOString();
            entry = existing;
          } else {
            entry = {
              id: `tt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              sessionId: String(body.sessionId || activeSession?.id || ""),
              termId: String(body.termId || activeTerm?.id || ""),
              classLevelId,
              subjectId,
              assignedTeacherIds,
              dayOfWeek,
              startTime,
              endTime,
              durationMinutes,
              mode,
              maxCapacityPerRoom,
              publicationStatus,
              allocationStatus: "UNALLOCATED",
              eligibleStudentCount: 0,
              shortfallCount: 0,
              createdBy: auth.user.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            state.timetableEntries.unshift(entry);
          }

          const allocation = allocateGroupsForTimetableEntry(state, users, entry, {
            id: auth.user.id,
            email: auth.user.email,
            role: auth.user.role,
          });

          if (publicationStatus === "PUBLISHED") {
            notifyPublishedTimetable(state, entry, allocation.groups);
          }

          return {
            entry,
            allocation,
            warnings: validation.warnings,
          };
        }

        case "PUBLISH_TIMETABLE_ENTRY": {
          const entry = state.timetableEntries.find((e) => e.id === String(body.id || ""));
          if (!entry) throw new Error("Timetable entry not found.");

          const validation = validateTimetableEntry(state, users, {
            ...entry,
            publicationStatus: "PUBLISHED",
          });
          if (!validation.valid) {
            throw new Error(validation.errors.join(" "));
          }

          entry.publicationStatus = "PUBLISHED";
          entry.updatedAt = new Date().toISOString();

          const allocation = allocateGroupsForTimetableEntry(state, users, entry, {
            id: auth.user.id,
            email: auth.user.email,
            role: auth.user.role,
          });

          notifyPublishedTimetable(state, entry, allocation.groups);

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "PUBLISH_TIMETABLE_ENTRY",
            entityType: "timetable_entry",
            entityId: entry.id,
          });

          return { entry, allocation };
        }

        case "UNPUBLISH_TIMETABLE_ENTRY": {
          const entry = state.timetableEntries.find((e) => e.id === String(body.id || ""));
          if (!entry) throw new Error("Timetable entry not found.");
          entry.publicationStatus = "DRAFT";
          entry.updatedAt = new Date().toISOString();
          return { entry };
        }

        case "CANCEL_TIMETABLE_ENTRY": {
          const entry = state.timetableEntries.find((e) => e.id === String(body.id || ""));
          if (!entry) throw new Error("Timetable entry not found.");
          entry.publicationStatus = "CANCELLED";
          entry.updatedAt = new Date().toISOString();

          const subject = state.subjects.find((s) => s.id === entry.subjectId)?.name || "Lesson";
          const affectedRooms = state.classrooms.filter((c) => c.timetableEntryId === entry.id);
          for (const rm of affectedRooms) {
            rm.status = "CANCELLED";
            appendNotification(state, {
              recipientUserId: rm.teacherUserId,
              recipientRole: "TEACHER",
              category: "TIMETABLE",
              title: `Lesson Cancelled: ${subject}`,
              message: `${rm.classLevelName} ${subject} (${entry.dayOfWeek} ${entry.startTime} WAT) was cancelled by School Admin.`,
              href: "/teacher/classes",
            });
            for (const sid of rm.studentUserIds) {
              appendNotification(state, {
                recipientUserId: sid,
                recipientRole: "STUDENT",
                category: "TIMETABLE",
                title: `Lesson Cancelled: ${subject}`,
                message: `Your scheduled ${subject} session (${entry.dayOfWeek} ${entry.startTime} WAT) has been cancelled.`,
                href: "/timetable",
              });
            }
          }
          return { entry };
        }

        case "RECALCULATE_ALLOCATIONS": {
          const entry = state.timetableEntries.find((e) => e.id === String(body.id || ""));
          if (!entry) throw new Error("Timetable entry not found.");
          const allocation = allocateGroupsForTimetableEntry(state, users, entry, {
            id: auth.user.id,
            email: auth.user.email,
            role: auth.user.role,
          });
          return { entry, allocation };
        }

        default:
          throw new Error("Unsupported timetable action.");
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update timetable." },
      { status: 400 }
    );
  }
}

function notifyPublishedTimetable(
  state: any,
  entry: TimetableEntryRecord,
  groups: any[]
) {
  const subject = state.subjects.find((s: any) => s.id === entry.subjectId)?.name || "Lesson";
  const level = state.classLevels.find((c: any) => c.id === entry.classLevelId)?.code || "";

  for (const grp of groups) {
    appendNotification(state, {
      recipientUserId: grp.teacherUserId,
      recipientRole: "TEACHER",
      category: "TIMETABLE",
      title: `Timetable Published: ${level} ${subject} (${grp.groupName})`,
      message: `${grp.studentUserIds.length} student(s) allocated for ${entry.dayOfWeek} ${entry.startTime}–${entry.endTime} WAT. Classroom is ready to prepare.`,
      href: "/teacher/classes",
    });

    for (const sid of grp.studentUserIds) {
      appendNotification(state, {
        recipientUserId: sid,
        recipientRole: "STUDENT",
        category: "ALLOCATION",
        title: `Assigned to ${grp.groupName}: ${level} ${subject}`,
        message: `Teacher: ${grp.teacherName} · ${entry.dayOfWeek} ${entry.startTime}–${entry.endTime} WAT.`,
        href: "/timetable",
      });
    }
  }
}

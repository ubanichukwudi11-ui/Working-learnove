import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  isStudentEntitledForSubject,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { ClassroomRecord } from "./lmsTypes";
import type { AuthenticatedSessionUser } from "./serverAuth";
import { getSupabaseServerClient } from "./supabaseServer";

export class ClassroomServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getClassroomsOverview(user: AuthenticatedSessionUser) {
  if (user.role === "TEACHER" && user.status !== "ACTIVE") {
    throw new ClassroomServiceError(
      "Your educator account requires School Administrator approval before accessing classrooms.",
      403
    );
  }
  const [state, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (isAdmin) {
    return {
      classrooms: state.classrooms,
      groups: state.studentGroups,
      timetableEntries: state.timetableEntries,
      attendanceRecords: state.attendanceRecords,
      approvedTeachers: state.teacherApprovals.filter(
        (a) => a.status === "APPROVED"
      ),
      students: users.filter((u) => u.role === "STUDENT"),
    };
  }

  if (user.role === "TEACHER") {
    const teacherRooms = state.classrooms.filter(
      (c) => c.teacherUserId === user.id
    );
    const roomIds = new Set(teacherRooms.map((r) => r.id));
    const studentsMap = Object.fromEntries(
      users
        .filter((u) => u.role === "STUDENT")
        .map((u) => [u.id, { id: u.id, fullName: u.fullName, email: u.email }])
    );
    return {
      classrooms: teacherRooms,
      attendanceRecords: state.attendanceRecords.filter((a) =>
        roomIds.has(a.classroomId)
      ),
      studentsMap,
    };
  }

  const publishedEntryIds = new Set(
    state.timetableEntries
      .filter((e) => e.publicationStatus === "PUBLISHED")
      .map((e) => e.id)
  );

  const studentRooms = state.classrooms
    .filter(
      (c) =>
        publishedEntryIds.has(c.timetableEntryId) &&
        c.studentUserIds.includes(user.id)
    )
    .map((c) => {
      const ent = isStudentEntitledForSubject(
        state,
        user.id,
        c.subjectId,
        c.classLevelId
      );
      return {
        ...c,
        studentUserIds: ent.entitled ? [user.id] : [],
        allocatedCount: c.studentUserIds.length,
        entitled: ent.entitled,
        entitlementReason: ent.reason,
        entitlementStatus: ent.status,
      };
    });

  return {
    classrooms: studentRooms,
    attendanceRecords: state.attendanceRecords.filter(
      (a) => a.studentUserId === user.id
    ),
  };
}

export async function listLiveClassesForUser(user: AuthenticatedSessionUser) {
  if (user.role === "TEACHER" && user.status !== "ACTIVE") {
    throw new ClassroomServiceError(
      "Your educator account requires School Administrator approval before accessing live classrooms.",
      403
    );
  }
  const state = await loadLmsState();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const mapClassroom = (
    c: (typeof state.classrooms)[number],
    extra: Record<string, unknown> = {}
  ) => ({
    id: c.id,
    title: c.lessonTitle || `${c.subjectName} · ${c.groupName}`,
    topic:
      c.lessonDescription || c.lessonObjectives || `${c.classLevelName} Lesson`,
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
    return {
      classes: state.classrooms.map((c) => mapClassroom(c)),
    };
  }

  if (user.role === "TEACHER") {
    return {
      classes: state.classrooms
        .filter((c) => c.teacherUserId === user.id)
        .map((c) => mapClassroom(c)),
    };
  }

  if (user.role === "STUDENT") {
    const publishedIds = new Set(
      state.timetableEntries
        .filter((e) => e.publicationStatus === "PUBLISHED")
        .map((e) => e.id)
    );

    const classes = state.classrooms
      .filter(
        (c) =>
          publishedIds.has(c.timetableEntryId) &&
          c.studentUserIds.includes(user.id)
      )
      .map((c) => {
        const ent = isStudentEntitledForSubject(
          state,
          user.id,
          c.subjectId,
          c.classLevelId
        );
        return mapClassroom(c, {
          entitled: ent.entitled,
          entitlementStatus: ent.status,
          entitlementReason: ent.reason,
        });
      });

    return { classes };
  }

  return { classes: [] };
}

export async function handleClassroomMutation(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  if (user.role === "TEACHER" && user.status !== "ACTIVE") {
    throw new ClassroomServiceError(
      "Your educator account requires School Administrator approval before managing classrooms.",
      403
    );
  }
  const action = String(body.action || "");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const users = await fetchDirectoryUsers();

  const adminOnlyActions = [
    "REASSIGN_STUDENT",
    "REASSIGN_GROUP_TEACHER",
    "CANCEL_CLASSROOM",
    "UPDATE_CAPACITY",
  ];
  if (adminOnlyActions.includes(action) && !isAdmin) {
    throw new ClassroomServiceError(
      "Only administrators can reassign students, teachers, or cancel classrooms.",
      403
    );
  }

  const result = await mutateLmsState(async (state) => {
    switch (action) {
      case "PREPARE_CLASSROOM": {
        if (user.role === "TEACHER" && user.status !== "ACTIVE") {
          throw new ClassroomServiceError(
            "Your teacher account must be approved by a School Administrator before preparing classrooms.",
            403
          );
        }
        const classroomId = String(body.classroomId || "");
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Allocated classroom not found.");
        if (!isAdmin && room.teacherUserId !== user.id) {
          throw new Error("You are not the assigned teacher for this classroom.");
        }
        if (room.status === "CANCELLED") {
          throw new Error("Cannot prepare a cancelled classroom.");
        }

        if (typeof body.lessonTitle === "string" && body.lessonTitle.trim()) {
          room.lessonTitle = body.lessonTitle.trim();
        }
        if (typeof body.lessonDescription === "string") {
          room.lessonDescription = body.lessonDescription.trim();
        }
        if (typeof body.lessonObjectives === "string") {
          room.lessonObjectives = body.lessonObjectives.trim();
        }
        if (typeof body.lessonNotes === "string") {
          room.lessonNotes = body.lessonNotes;
        }
        if (typeof body.assignmentsText === "string") {
          room.assignmentsText = body.assignmentsText;
        }
        const addMaterial = body.addMaterial as
          | { title?: unknown; type?: unknown; url?: unknown }
          | undefined;
        if (addMaterial && addMaterial.title) {
          room.materials.unshift({
            id: `mat-${Date.now()}`,
            title: String(addMaterial.title).trim(),
            type: (addMaterial.type ||
              "PDF") as ClassroomRecord["materials"][number]["type"],
            url: addMaterial.url ? String(addMaterial.url) : undefined,
            uploadedBy: user.fullName,
            createdAt: new Date().toISOString(),
          });
        }

        const wasFirstPrep = room.status === "SCHEDULED";
        if (room.status === "SCHEDULED") {
          room.status = "PREPARED";
          room.preparedAt = new Date().toISOString();
        }

        if (wasFirstPrep) {
          for (const sid of room.studentUserIds) {
            appendNotification(state, {
              recipientUserId: sid,
              recipientRole: "STUDENT",
              category: "CLASSROOM",
              title: `Classroom Prepared: ${room.subjectName} (${room.groupName})`,
              message: `${room.teacherName} uploaded lesson notes/objectives for "${room.lessonTitle}". Waiting to start.`,
              href: `/live-classes/${room.id}`,
            });
          }
        }

        return { classroom: room };
      }

      case "START_LIVE_CLASSROOM": {
        if (user.role === "TEACHER" && user.status !== "ACTIVE") {
          throw new ClassroomServiceError(
            "Your teacher account must be approved by a School Administrator before launching live classes.",
            403
          );
        }
        const classroomId = String(body.classroomId || "");
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");
        if (!isAdmin && room.teacherUserId !== user.id) {
          throw new Error(
            "Only the assigned teacher can open this live classroom."
          );
        }
        if (room.status === "CANCELLED") {
          throw new Error("Cannot start a cancelled classroom.");
        }

        room.status = "LIVE";
        room.startedAt = room.startedAt || new Date().toISOString();
        room.endedAt = undefined;

        try {
          const sb = getSupabaseServerClient();
          await sb.from("live_classes").upsert({
            title: room.lessonTitle,
            description: room.lessonDescription,
            teacher_id: room.teacherUserId,
            subject: room.subjectName,
            class_level: room.classLevelName,
            room_name: room.id,
            status: "LIVE",
            started_at: room.startedAt,
          });
        } catch {}

        for (const sid of room.studentUserIds) {
          appendNotification(state, {
            recipientUserId: sid,
            recipientRole: "STUDENT",
            category: "CLASSROOM",
            title: `LIVE NOW: ${room.subjectName} (${room.groupName})`,
            message: `${room.teacherName} started your live lesson. Join Classroom now.`,
            href: `/live-classes/${room.id}`,
          });
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "START_LIVE_CLASSROOM",
          entityType: "classroom",
          entityId: room.id,
        });

        return { classroom: room };
      }

      case "END_LIVE_CLASSROOM": {
        const classroomId = String(body.classroomId || "");
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");
        if (!isAdmin && room.teacherUserId !== user.id) {
          throw new Error(
            "Only the assigned teacher can end this live lesson."
          );
        }

        room.status = "ENDED";
        room.endedAt = new Date().toISOString();
        if (room.startedAt) {
          room.durationSeconds = Math.max(
            0,
            Math.floor((Date.now() - new Date(room.startedAt).getTime()) / 1000)
          );
        }

        for (const sid of room.studentUserIds) {
          const hasRec = state.attendanceRecords.find(
            (a) => a.classroomId === room.id && a.studentUserId === sid
          );
          if (!hasRec) {
            const st = users.find((u) => u.id === sid);
            state.attendanceRecords.push({
              id: `att-${room.id}-${sid}`,
              classroomId: room.id,
              studentUserId: sid,
              studentName: st?.fullName || sid,
              status: "ABSENT",
              recordedBy: user.fullName,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "END_LIVE_CLASSROOM",
          entityType: "classroom",
          entityId: room.id,
          metadata: { durationSeconds: room.durationSeconds },
        });

        return { classroom: room };
      }

      case "SAVE_ATTENDANCE": {
        const classroomId = String(body.classroomId || "");
        const entries: {
          studentUserId: string;
          status: "PRESENT" | "ABSENT" | "LATE";
        }[] = Array.isArray(body.entries) ? body.entries : [];
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");
        if (!isAdmin && room.teacherUserId !== user.id) {
          throw new Error(
            "You can only record attendance for your own classroom."
          );
        }

        for (const item of entries) {
          const st = users.find((u) => u.id === item.studentUserId);
          const existing = state.attendanceRecords.find(
            (a) =>
              a.classroomId === classroomId &&
              a.studentUserId === item.studentUserId
          );
          if (existing) {
            existing.status = item.status;
            existing.recordedBy = user.fullName;
            existing.updatedAt = new Date().toISOString();
          } else {
            state.attendanceRecords.push({
              id: `att-${classroomId}-${item.studentUserId}`,
              classroomId,
              studentUserId: item.studentUserId,
              studentName: st?.fullName || item.studentUserId,
              status: item.status,
              joinedAt:
                item.status === "PRESENT"
                  ? new Date().toISOString()
                  : undefined,
              recordedBy: user.fullName,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        return { saved: entries.length };
      }

      case "REASSIGN_STUDENT": {
        const studentUserId = String(body.studentUserId || "");
        const fromClassroomId = String(body.fromClassroomId || "");
        const toClassroomId = String(body.toClassroomId || "");
        const reason = String(
          body.reason || "Administrative group balancing"
        ).trim();

        const fromRoom = state.classrooms.find(
          (c) => c.id === fromClassroomId
        );
        const toRoom = state.classrooms.find((c) => c.id === toClassroomId);
        if (!fromRoom || !toRoom) {
          throw new Error("Source or destination classroom not found.");
        }
        if (fromRoom.timetableEntryId !== toRoom.timetableEntryId) {
          throw new Error(
            "Reassignment must be between groups of the same timetable lesson."
          );
        }
        if (toRoom.studentUserIds.length >= toRoom.maxCapacity) {
          throw new Error(
            `Destination ${toRoom.groupName} is already at maximum capacity (${toRoom.maxCapacity}).`
          );
        }

        fromRoom.studentUserIds = fromRoom.studentUserIds.filter(
          (id) => id !== studentUserId
        );
        if (!toRoom.studentUserIds.includes(studentUserId)) {
          toRoom.studentUserIds.push(studentUserId);
        }

        const fromGroup = state.studentGroups.find(
          (g) => g.id === fromRoom.studentGroupId
        );
        const toGroup = state.studentGroups.find(
          (g) => g.id === toRoom.studentGroupId
        );
        if (fromGroup) {
          fromGroup.studentUserIds = [...fromRoom.studentUserIds];
        }
        if (toGroup) {
          toGroup.studentUserIds = [...toRoom.studentUserIds];
        }

        appendNotification(state, {
          recipientUserId: studentUserId,
          recipientRole: "STUDENT",
          category: "ALLOCATION",
          title: `Group Reassignment: ${toRoom.subjectName}`,
          message: `You were moved from ${fromRoom.groupName} to ${toRoom.groupName} (${toRoom.teacherName}). Reason: ${reason}`,
          href: `/live-classes/${toRoom.id}`,
        });
        appendNotification(state, {
          recipientUserId: toRoom.teacherUserId,
          recipientRole: "TEACHER",
          category: "ALLOCATION",
          title: `Student Added to ${toRoom.groupName}`,
          message: `A student was reassigned into your ${toRoom.classLevelName} ${toRoom.subjectName} group.`,
          href: "/teacher/classes",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "MANUAL_REASSIGN_STUDENT",
          entityType: "classroom",
          entityId: toRoom.id,
          reason,
          metadata: { studentUserId, fromClassroomId, toClassroomId },
        });

        return { fromRoom, toRoom };
      }

      case "REASSIGN_GROUP_TEACHER": {
        const classroomId = String(body.classroomId || "");
        const newTeacherUserId = String(body.newTeacherUserId || "");
        const reason = String(
          body.reason || "Administrative teacher reassignment"
        ).trim();

        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");

        const approved = state.teacherApprovals.some(
          (a) =>
            a.teacherUserId === newTeacherUserId &&
            a.subjectId === room.subjectId &&
            a.classLevelId === room.classLevelId &&
            a.status === "APPROVED"
        );
        if (!approved) {
          throw new Error(
            "Selected teacher is not approved for this subject and class level."
          );
        }

        const teacherUser = users.find((u) => u.id === newTeacherUserId);
        const prevTeacherId = room.teacherUserId;
        room.teacherUserId = newTeacherUserId;
        room.teacherName = teacherUser?.fullName || newTeacherUserId;

        const group = state.studentGroups.find(
          (g) => g.id === room.studentGroupId
        );
        if (group) {
          group.teacherUserId = newTeacherUserId;
          group.teacherName = room.teacherName;
        }

        const tt = state.timetableEntries.find(
          (t) => t.id === room.timetableEntryId
        );
        if (tt) {
          tt.assignedTeacherIds = Array.from(
            new Set(
              tt.assignedTeacherIds
                .filter((tid) => tid !== prevTeacherId)
                .concat(newTeacherUserId)
            )
          );
        }

        appendNotification(state, {
          recipientUserId: newTeacherUserId,
          recipientRole: "TEACHER",
          category: "ALLOCATION",
          title: `Assigned to ${room.classLevelName} ${room.subjectName} (${room.groupName})`,
          message: `Admin assigned you to teach ${room.groupName} (${room.studentUserIds.length} students).`,
          href: `/teacher/live-class/${room.id}`,
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "REASSIGN_GROUP_TEACHER",
          entityType: "classroom",
          entityId: room.id,
          reason,
          metadata: { prevTeacherId, newTeacherUserId },
        });

        return { classroom: room };
      }

      case "CANCEL_CLASSROOM": {
        const classroomId = String(body.classroomId || "");
        const reason = String(body.reason || "Cancelled by School Admin").trim();
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");
        room.status = "CANCELLED";

        appendNotification(state, {
          recipientUserId: room.teacherUserId,
          recipientRole: "TEACHER",
          category: "CLASSROOM",
          title: `Classroom Cancelled: ${room.groupName}`,
          message: `${room.classLevelName} ${room.subjectName} was cancelled (${reason}).`,
          href: "/teacher/classes",
        });
        for (const sid of room.studentUserIds) {
          appendNotification(state, {
            recipientUserId: sid,
            recipientRole: "STUDENT",
            category: "CLASSROOM",
            title: `Class Cancelled: ${room.subjectName}`,
            message: `Your ${room.groupName} session has been cancelled (${reason}).`,
            href: "/timetable",
          });
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "CANCEL_CLASSROOM",
          entityType: "classroom",
          entityId: room.id,
          reason,
        });
        return { classroom: room };
      }

      case "UPDATE_CAPACITY": {
        const classroomId = String(body.classroomId || "");
        const maxCapacity = Number(body.maxCapacity || 50);
        if (maxCapacity < 1) throw new Error("Capacity must be at least 1.");
        const room = state.classrooms.find((c) => c.id === classroomId);
        if (!room) throw new Error("Classroom not found.");
        room.maxCapacity = maxCapacity;
        const grp = state.studentGroups.find(
          (g) => g.id === room.studentGroupId
        );
        if (grp) grp.maxCapacity = maxCapacity;
        return { classroom: room };
      }

      default:
        throw new Error("Unsupported classroom action.");
    }
  });

  return { success: true, ...result };
}

import {
  ClassroomRecord,
  LmsStateData,
  StudentGroupRecord,
  TimetableEntryRecord,
} from "./lmsTypes";
import {
  appendAuditLog,
  appendNotification,
  DirectoryUser,
  isStudentEntitledForSubject,
} from "./lmsDb";

export interface ConflictCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const s1 = toMinutes(aStart);
  const e1 = toMinutes(aEnd);
  const s2 = toMinutes(bStart);
  const e2 = toMinutes(bEnd);
  if (s1 < 0 || e1 < 0 || s2 < 0 || e2 < 0) return false;
  return s1 < e2 && s2 < e1;
}

export function validateTimetableEntry(
  state: LmsStateData,
  users: DirectoryUser[],
  candidate: {
    id?: string;
    classLevelId: string;
    subjectId: string;
    assignedTeacherIds: string[];
    dayOfWeek: TimetableEntryRecord["dayOfWeek"];
    startTime: string;
    endTime: string;
    maxCapacityPerRoom: number;
    publicationStatus: TimetableEntryRecord["publicationStatus"];
  }
): ConflictCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const startMin = toMinutes(candidate.startTime);
  const endMin = toMinutes(candidate.endTime);

  if (startMin < 0 || endMin < 0 || endMin <= startMin) {
    errors.push("Invalid lesson time: end time must be strictly after start time.");
  }

  if (candidate.maxCapacityPerRoom < 1) {
    errors.push("Maximum classroom capacity must be at least 1 student.");
  }

  if (candidate.assignedTeacherIds.length === 0) {
    errors.push("Select at least one approved teacher for this lesson.");
  }

  // Validate teacher approvals & conflicts
  for (const tId of candidate.assignedTeacherIds) {
    const teacher = users.find((u) => u.id === tId);
    const teacherLabel = teacher?.fullName || tId;

    const hasApproval = state.teacherApprovals.some(
      (a) =>
        a.teacherUserId === tId &&
        a.subjectId === candidate.subjectId &&
        a.classLevelId === candidate.classLevelId &&
        a.status === "APPROVED"
    );

    if (!hasApproval) {
      errors.push(
        `${teacherLabel} is not approved for this subject and class level.`
      );
    }

    // Teacher double-booking check across active/published/draft lessons
    const teacherConflict = state.timetableEntries.find(
      (existing) =>
        existing.id !== candidate.id &&
        existing.publicationStatus !== "CANCELLED" &&
        existing.dayOfWeek === candidate.dayOfWeek &&
        existing.assignedTeacherIds.includes(tId) &&
        timesOverlap(
          candidate.startTime,
          candidate.endTime,
          existing.startTime,
          existing.endTime
        )
    );
    if (teacherConflict) {
      const sub = state.subjects.find((s) => s.id === teacherConflict.subjectId)?.name || "another lesson";
      errors.push(
        `Timetable conflict: ${teacherLabel} is already assigned to ${sub} on ${candidate.dayOfWeek} (${teacherConflict.startTime}–${teacherConflict.endTime} WAT).`
      );
    }
  }

  // Class level cohort simultaneous schedule check
  const classConflict = state.timetableEntries.find(
    (existing) =>
      existing.id !== candidate.id &&
      existing.publicationStatus !== "CANCELLED" &&
      existing.classLevelId === candidate.classLevelId &&
      existing.dayOfWeek === candidate.dayOfWeek &&
      timesOverlap(
        candidate.startTime,
        candidate.endTime,
        existing.startTime,
        existing.endTime
      )
  );
  if (classConflict) {
    const sub = state.subjects.find((s) => s.id === classConflict.subjectId)?.name || "another subject";
    errors.push(
      `Class level conflict: students in this class level already have ${sub} scheduled on ${candidate.dayOfWeek} (${classConflict.startTime}–${classConflict.endTime} WAT).`
    );
  }

  // Capacity check against eligible students
  const eligibleStudents = getEligibleStudentsForLesson(
    state,
    users,
    candidate.classLevelId,
    candidate.subjectId
  );

  const totalCapacity = candidate.assignedTeacherIds.length * candidate.maxCapacityPerRoom;
  if (eligibleStudents.length > totalCapacity) {
    const shortfall = eligibleStudents.length - totalCapacity;
    const neededTeachers = Math.ceil(eligibleStudents.length / candidate.maxCapacityPerRoom);
    const msg = `Capacity shortfall: ${eligibleStudents.length} eligible students require ${neededTeachers} teachers at ${candidate.maxCapacityPerRoom} per room (${shortfall} students unplaced).`;
    if (candidate.publicationStatus === "PUBLISHED") {
      errors.push(
        `${msg} Assign ${neededTeachers - candidate.assignedTeacherIds.length} more approved teacher(s) or raise classroom capacity before publishing.`
      );
    } else {
      warnings.push(msg);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getEligibleStudentsForLesson(
  state: LmsStateData,
  users: DirectoryUser[],
  classLevelId: string,
  subjectId: string
): DirectoryUser[] {
  const enrolledStudentIds = new Set(
    state.studentEnrolments
      .filter(
        (e) =>
          e.classLevelId === classLevelId &&
          e.subjectIds.includes(subjectId) &&
          e.status === "ENROLLED"
      )
      .map((e) => e.studentUserId)
  );

  return users.filter((u) => {
    if (u.role !== "STUDENT" || u.status !== "ACTIVE") return false;
    if (!enrolledStudentIds.has(u.id)) return false;
    const entitlement = isStudentEntitledForSubject(
      state,
      u.id,
      subjectId,
      classLevelId
    );
    return entitlement.entitled;
  });
}

/**
 * Automatically divides eligible students into capacity-bounded groups and allocates
 * separate Group + Classroom records per assigned teacher while preserving group stability.
 */
export function allocateGroupsForTimetableEntry(
  state: LmsStateData,
  users: DirectoryUser[],
  entry: TimetableEntryRecord,
  actor: { id: string; email: string; role: string }
): {
  groups: StudentGroupRecord[];
  classrooms: ClassroomRecord[];
  eligibleCount: number;
  shortfallCount: number;
} {
  const eligible = getEligibleStudentsForLesson(
    state,
    users,
    entry.classLevelId,
    entry.subjectId
  );

  const subject = state.subjects.find((s) => s.id === entry.subjectId);
  const classLevel = state.classLevels.find((c) => c.id === entry.classLevelId);

  const teacherIds = entry.assignedTeacherIds;
  const cap = entry.maxCapacityPerRoom;

  const existingGroups = state.studentGroups
    .filter((g) => g.timetableEntryId === entry.id)
    .sort((a, b) => a.groupNumber - b.groupNumber);

  // Determine how many groups to create: enough for eligible students capped by assigned teachers
  const neededGroups = Math.max(1, Math.ceil(eligible.length / cap));
  const creatableGroups = Math.min(teacherIds.length, Math.max(teacherIds.length, neededGroups));

  // Build stable membership map: studentId -> previous groupNumber
  const prevGroupByStudent = new Map<string, number>();
  for (const grp of existingGroups) {
    for (const sid of grp.studentUserIds) {
      prevGroupByStudent.set(sid, grp.groupNumber);
    }
  }

  const buckets: string[][] = Array.from({ length: creatableGroups }, () => []);
  const eligibleSet = new Set(eligible.map((s) => s.id));
  const assignedStudents = new Set<string>();

  // Pass 1: Keep existing students in their previous stable group if teacher still assigned & within capacity
  for (const s of eligible) {
    const prevNum = prevGroupByStudent.get(s.id);
    if (prevNum && prevNum >= 1 && prevNum <= creatableGroups) {
      const idx = prevNum - 1;
      if (buckets[idx].length < cap) {
        buckets[idx].push(s.id);
        assignedStudents.add(s.id);
      }
    }
  }

  // Pass 2: Place remaining eligible students sequentially filling Group 1 up to cap, then Group 2, etc.
  for (const s of eligible) {
    if (assignedStudents.has(s.id)) continue;
    for (let i = 0; i < creatableGroups; i++) {
      if (buckets[i].length < cap) {
        buckets[i].push(s.id);
        assignedStudents.add(s.id);
        break;
      }
    }
  }

  const shortfallCount = Math.max(0, eligible.length - assignedStudents.size);
  entry.eligibleStudentCount = eligible.length;
  entry.shortfallCount = shortfallCount;
  entry.allocationStatus =
    shortfallCount > 0 ? "SHORTFALL" : creatableGroups > 0 ? "OK" : "UNALLOCATED";

  // Remove old groups for this entry that are replaced cleanly, but preserve existing classroom prep metadata if matching groupNumber
  const oldClassrooms = state.classrooms.filter((c) => c.timetableEntryId === entry.id);
  state.studentGroups = state.studentGroups.filter((g) => g.timetableEntryId !== entry.id);
  state.classrooms = state.classrooms.filter((c) => c.timetableEntryId !== entry.id);

  const newGroups: StudentGroupRecord[] = [];
  const newClassrooms: ClassroomRecord[] = [];

  for (let i = 0; i < creatableGroups; i++) {
    const groupNumber = i + 1;
    const teacherId = teacherIds[i];
    const teacherUser = users.find((u) => u.id === teacherId);
    const teacherName = teacherUser?.fullName || "Assigned Teacher";

    const existingGroup = existingGroups.find((g) => g.groupNumber === groupNumber);
    const groupId = existingGroup?.id || `grp-${entry.id}-${groupNumber}`;

    const groupRecord: StudentGroupRecord = {
      id: groupId,
      timetableEntryId: entry.id,
      groupNumber,
      groupName: `Group ${groupNumber}`,
      teacherUserId: teacherId,
      teacherName,
      maxCapacity: cap,
      studentUserIds: buckets[i].filter((id) => eligibleSet.has(id)),
      createdAt: existingGroup?.createdAt || new Date().toISOString(),
    };
    newGroups.push(groupRecord);
    state.studentGroups.push(groupRecord);

    const prevClassroom = oldClassrooms.find((c) => c.studentGroupId === groupId);
    const classroomId = prevClassroom?.id || `room-${entry.id}-g${groupNumber}`;

    const classroomRecord: ClassroomRecord = {
      id: classroomId,
      timetableEntryId: entry.id,
      studentGroupId: groupId,
      groupName: groupRecord.groupName,
      teacherUserId: teacherId,
      teacherName,
      classLevelId: entry.classLevelId,
      classLevelName: classLevel?.code || classLevel?.name || entry.classLevelId,
      subjectId: entry.subjectId,
      subjectName: subject?.name || entry.subjectId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      mode: entry.mode,
      maxCapacity: cap,
      studentUserIds: [...groupRecord.studentUserIds],
      lessonTitle:
        prevClassroom?.lessonTitle ||
        `${classLevel?.code || ""} ${subject?.name || "Lesson"} — Group ${groupNumber}`,
      lessonDescription:
        prevClassroom?.lessonDescription ||
        `${subject?.name || "Subject"} live lesson for ${classLevel?.code || "cohort"} (${groupRecord.groupName}).`,
      lessonObjectives: prevClassroom?.lessonObjectives || "",
      lessonNotes: prevClassroom?.lessonNotes || "",
      assignmentsText: prevClassroom?.assignmentsText || "",
      materials: prevClassroom?.materials || [],
      status:
        entry.publicationStatus === "CANCELLED"
          ? "CANCELLED"
          : prevClassroom?.status || "SCHEDULED",
      preparedAt: prevClassroom?.preparedAt,
      startedAt: prevClassroom?.startedAt,
      endedAt: prevClassroom?.endedAt,
      durationSeconds: prevClassroom?.durationSeconds || 0,
    };
    newClassrooms.push(classroomRecord);
    state.classrooms.push(classroomRecord);
  }

  if (shortfallCount > 0) {
    appendNotification(state, {
      recipientUserId: "ALL_ADMINS",
      recipientRole: "ALL_ADMINS",
      category: "ALLOCATION",
      title: `Teacher capacity shortfall for ${classLevel?.code || ""} ${subject?.name || ""}`,
      message: `${shortfallCount} of ${eligible.length} eligible students could not be allocated across ${teacherIds.length} teacher(s) at ${cap} per classroom.`,
      href: "/admin/timetable",
    });
  }

  appendAuditLog(state, {
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "ALLOCATE_STUDENT_GROUPS",
    entityType: "timetable_entry",
    entityId: entry.id,
    metadata: {
      eligibleCount: eligible.length,
      groupsCreated: newGroups.length,
      shortfallCount,
    },
  });

  return {
    groups: newGroups,
    classrooms: newClassrooms,
    eligibleCount: eligible.length,
    shortfallCount,
  };
}

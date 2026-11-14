import type { ClassroomSnapshot, SignalingEnvelope } from "@/lib/classroomSync";
import type { ClassroomRecord, LmsStateData } from "./lmsTypes";
import {
  appendAuditLog,
  appendNotification,
  isStudentEntitledForSubject,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import type { AuthenticatedSessionUser } from "./serverAuth";

interface LiveRegistryStore {
  rooms: Map<string, ClassroomSnapshot>;
  signals: Map<string, SignalingEnvelope[]>;
  seqCounter: number;
}

const g = globalThis as unknown as { __learnovaLiveStore?: LiveRegistryStore };

function getStore(): LiveRegistryStore {
  if (!g.__learnovaLiveStore) {
    g.__learnovaLiveStore = {
      rooms: new Map(),
      signals: new Map(),
      seqCounter: 0,
    };
  }
  return g.__learnovaLiveStore;
}

function formatWatTime(): string {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function formatTimeRangeWat(start: string, end: string): string {
  return `${start} – ${end} WAT`;
}

function buildSnapshotFromClassroom(roomRecord: ClassroomRecord): ClassroomSnapshot {
  const sessionStatus =
    roomRecord.status === "LIVE"
      ? "live"
      : roomRecord.status === "ENDED"
      ? "ended"
      : "waiting";

  return {
    classId: roomRecord.id,
    title: roomRecord.lessonTitle || `${roomRecord.subjectName} · ${roomRecord.groupName}`,
    topic:
      roomRecord.lessonDescription ||
      roomRecord.lessonObjectives ||
      `${roomRecord.classLevelName} Interactive Lesson`,
    subject: roomRecord.subjectName,
    classLevel: `${roomRecord.classLevelName} · ${roomRecord.groupName}`,
    timeWat: `${roomRecord.dayOfWeek} · ${formatTimeRangeWat(roomRecord.startTime, roomRecord.endTime)}`,
    teacherName: roomRecord.teacherName,
    teacherAvatar: "/images/avatar-funke.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    sessionStatus,
    startedAt: roomRecord.startedAt ? new Date(roomRecord.startedAt).getTime() : null,
    endedAt: roomRecord.endedAt ? new Date(roomRecord.endedAt).getTime() : null,
    hostMicOn: true,
    hostVideoOn: true,
    hostAudioOnly: false,
    hostScreenSharing: false,
    screenShare: {
      type: "slide",
      slideIndex: 0,
    },
    poll: null,
    assignment: {
      id: `assign-${roomRecord.id}`,
      title: `${roomRecord.subjectName} Lesson Task`,
      description:
        roomRecord.assignmentsText ||
        "Follow your teacher's instructions during this session.",
      dueDate: `${roomRecord.dayOfWeek} · End of Lesson`,
      totalStudents: roomRecord.studentUserIds.length,
      submittedUserIds: [],
      status: "active",
    },
    participants: [],
    messages: [
      {
        id: `msg-welcome-${roomRecord.id}`,
        senderId: "system",
        sender: "System",
        role: "system",
        text: `Welcome to ${roomRecord.classLevelName} ${roomRecord.subjectName} (${roomRecord.groupName}).`,
        timestamp: formatWatTime(),
        important: true,
      },
    ],
    questions: [],
    announcement: null,
    resources: roomRecord.materials.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type === "LINK" ? "link" : m.type === "WORKSHEET" ? "doc" : "pdf",
      size: m.type,
      url: m.url || "#material",
    })),
    classNotes:
      roomRecord.lessonNotes ||
      `${roomRecord.lessonTitle}\n• Objectives: ${roomRecord.lessonObjectives || "Core syllabus mastery"}`,
    whiteboardStrokes: [],
    version: 1,
  };
}

export interface RoomAccessResult {
  allowed: boolean;
  httpStatus: 200 | 403 | 404;
  code?: string;
  error?: string;
  classroom?: ClassroomRecord;
  state?: LmsStateData;
}

export async function verifyLiveRoomAccess(
  classId: string,
  user: AuthenticatedSessionUser
): Promise<RoomAccessResult> {
  const state = await loadLmsState();
  const room = state.classrooms.find((c) => c.id === classId);
  if (!room) {
    return {
      allowed: false,
      httpStatus: 404,
      code: "NOT_FOUND",
      error: "Classroom not found or no longer active.",
    };
  }

  if (room.status === "CANCELLED") {
    return {
      allowed: false,
      httpStatus: 403,
      code: "ROOM_CANCELLED",
      error: "This classroom session has been cancelled by school administration.",
      classroom: room,
    };
  }

  // Admins inspect operational status in /admin/classrooms, NOT private live audio/video streams
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return {
      allowed: false,
      httpStatus: 403,
      code: "ADMIN_STREAM_RESTRICTED",
      error:
        "Administrators monitor classroom capacity and status from the Classroom Control Centre and do not join private live streams.",
      classroom: room,
    };
  }

  if (user.role === "TEACHER") {
    if (room.teacherUserId !== user.id) {
      return {
        allowed: false,
        httpStatus: 403,
        code: "NOT_ASSIGNED",
        error: "You are not the assigned teacher for this classroom group.",
        classroom: room,
      };
    }
    return { allowed: true, httpStatus: 200, classroom: room, state };
  }

  if (user.role === "STUDENT") {
    const tt = state.timetableEntries.find((e) => e.id === room.timetableEntryId);
    if (!tt || tt.publicationStatus !== "PUBLISHED") {
      return {
        allowed: false,
        httpStatus: 403,
        code: "NOT_PUBLISHED",
        error: "This lesson timetable is not published yet.",
        classroom: room,
      };
    }

    if (!room.studentUserIds.includes(user.id)) {
      return {
        allowed: false,
        httpStatus: 403,
        code: "NOT_ASSIGNED",
        error:
          "You are not allocated to this classroom group. Please join your assigned group from your timetable.",
        classroom: room,
      };
    }

    const ent = isStudentEntitledForSubject(state, user.id, room.subjectId, room.classLevelId);
    if (!ent.entitled) {
      return {
        allowed: false,
        httpStatus: 403,
        code: "SUBSCRIPTION_REQUIRED",
        error: ent.reason,
        classroom: room,
      };
    }

    return { allowed: true, httpStatus: 200, classroom: room, state };
  }

  return {
    allowed: false,
    httpStatus: 403,
    code: "FORBIDDEN",
    error: "This role cannot join live classroom streams.",
  };
}

export function getRoomSnapshotFromRecord(roomRecord: ClassroomRecord): ClassroomSnapshot {
  const store = getStore();
  let snap = store.rooms.get(roomRecord.id);
  if (!snap) {
    snap = buildSnapshotFromClassroom(roomRecord);
    store.rooms.set(roomRecord.id, snap);
  } else {
    // Keep authoritative LMS status, teacher, notes, and materials synchronized
    snap.title = roomRecord.lessonTitle || snap.title;
    snap.topic = roomRecord.lessonDescription || snap.topic;
    snap.teacherName = roomRecord.teacherName;
    snap.sessionStatus =
      roomRecord.status === "LIVE"
        ? "live"
        : roomRecord.status === "ENDED"
        ? "ended"
        : "waiting";
    snap.startedAt = roomRecord.startedAt ? new Date(roomRecord.startedAt).getTime() : null;
    snap.endedAt = roomRecord.endedAt ? new Date(roomRecord.endedAt).getTime() : null;
  }
  return snap;
}

export function getSignalsSince(
  classId: string,
  sinceSeq: number,
  peerId?: string
): { signals: SignalingEnvelope[]; latestSeq: number } {
  const store = getStore();
  const list = store.signals.get(classId) || [];
  const filtered = list.filter(
    (s) =>
      s.seq > sinceSeq &&
      (!peerId || s.toPeerId === "broadcast" || s.toPeerId === peerId) &&
      s.fromPeerId !== peerId
  );
  return {
    signals: filtered,
    latestSeq: store.seqCounter,
  };
}

export async function applyAuthenticatedRoomAction(
  classId: string,
  roomRecord: ClassroomRecord,
  user: AuthenticatedSessionUser,
  body: Record<string, any>
): Promise<ClassroomSnapshot> {
  const store = getStore();
  const room = getRoomSnapshotFromRecord(roomRecord);
  const action = String(body.action || "");
  const isTeacherActor = user.role === "TEACHER" && roomRecord.teacherUserId === user.id;
  const nowStr = formatWatTime();

  switch (action) {
    case "JOIN_ROOM": {
      if (user.role === "TEACHER" && isTeacherActor) {
        room.teacherName = user.fullName || room.teacherName;
        // Note: Joining room in prep/waiting does NOT auto-start broadcast. Teacher explicitly clicks START_CLASS.
      } else if (user.role === "STUDENT") {
        const existing = room.participants.find((p) => p.id === user.id);
        if (!existing) {
          const initials = user.fullName
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          room.participants.unshift({
            id: user.id,
            name: user.fullName,
            role: "STUDENT",
            initials: initials || "ST",
            color: "bg-[#0D9488]",
            micOn: false,
            videoOn: false,
            audioOnly: Boolean(body.audioOnly),
            handRaised: false,
            stageStatus: "audience",
            joinedAt: nowStr,
          });
        }

        // Persist attendance PRESENT when room is live
        if (roomRecord.status === "LIVE") {
          await mutateLmsState((state) => {
            const existingAtt = state.attendanceRecords.find(
              (a) => a.classroomId === classId && a.studentUserId === user.id
            );
            if (!existingAtt) {
              state.attendanceRecords.push({
                id: `att-${classId}-${user.id}`,
                classroomId: classId,
                studentUserId: user.id,
                studentName: user.fullName,
                status: "PRESENT",
                joinedAt: new Date().toISOString(),
                recordedBy: "System (Live Join)",
                updatedAt: new Date().toISOString(),
              });
            }
          });
        }
      }
      room.version++;
      break;
    }

    case "LEAVE_ROOM": {
      room.participants = room.participants.filter((p) => p.id !== user.id);
      room.version++;
      break;
    }

    case "START_CLASS": {
      if (!isTeacherActor) break;
      room.sessionStatus = "live";
      room.startedAt = room.startedAt || Date.now();
      room.endedAt = null;
      room.messages.push({
        id: `sys-${Date.now()}`,
        senderId: "system",
        sender: "System",
        role: "system",
        text: `${room.teacherName} started the live class session.`,
        timestamp: nowStr,
      });
      await mutateLmsState((state) => {
        const lmsRoom = state.classrooms.find((c) => c.id === classId);
        if (lmsRoom) {
          lmsRoom.status = "LIVE";
          lmsRoom.startedAt = lmsRoom.startedAt || new Date().toISOString();
          lmsRoom.endedAt = undefined;
          for (const sid of lmsRoom.studentUserIds) {
            appendNotification(state, {
              recipientUserId: sid,
              recipientRole: "STUDENT",
              category: "CLASSROOM",
              title: `LIVE NOW: ${lmsRoom.subjectName} (${lmsRoom.groupName})`,
              message: `${lmsRoom.teacherName} started your live lesson. Join Classroom now.`,
              href: `/live-classes/${lmsRoom.id}`,
            });
          }
          appendAuditLog(state, {
            actorUserId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "START_LIVE_CLASSROOM",
            entityType: "classroom",
            entityId: lmsRoom.id,
          });
        }
      });
      room.version++;
      break;
    }

    case "END_CLASS": {
      if (!isTeacherActor) break;
      room.sessionStatus = "ended";
      room.endedAt = Date.now();
      room.hostScreenSharing = false;
      room.participants = room.participants.map((p) => ({
        ...p,
        stageStatus: "audience",
        handRaised: false,
        micOn: false,
        videoOn: false,
      }));
      room.messages.push({
        id: `sys-${Date.now()}`,
        senderId: "system",
        sender: "System",
        role: "system",
        text: `Class ended by ${room.teacherName}.`,
        timestamp: nowStr,
      });
      await mutateLmsState((state) => {
        const lmsRoom = state.classrooms.find((c) => c.id === classId);
        if (lmsRoom) {
          lmsRoom.status = "ENDED";
          lmsRoom.endedAt = new Date().toISOString();
          if (lmsRoom.startedAt) {
            lmsRoom.durationSeconds = Math.max(
              0,
              Math.floor((Date.now() - new Date(lmsRoom.startedAt).getTime()) / 1000)
            );
          }
          for (const sid of lmsRoom.studentUserIds) {
            const hasRec = state.attendanceRecords.find(
              (a) => a.classroomId === lmsRoom.id && a.studentUserId === sid
            );
            if (!hasRec) {
              state.attendanceRecords.push({
                id: `att-${lmsRoom.id}-${sid}`,
                classroomId: lmsRoom.id,
                studentUserId: sid,
                studentName: sid,
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
            entityId: lmsRoom.id,
            metadata: { durationSeconds: lmsRoom.durationSeconds },
          });
        }
      });
      room.version++;
      break;
    }

    case "RAISE_HAND": {
      room.participants = room.participants.map((p) =>
        p.id === user.id
          ? {
              ...p,
              handRaised: true,
              handRaisedAt: nowStr,
              stageStatus: p.stageStatus === "approved" ? "approved" : "pending",
            }
          : p
      );
      room.version++;
      break;
    }

    case "LOWER_HAND": {
      room.participants = room.participants.map((p) =>
        p.id === user.id
          ? {
              ...p,
              handRaised: false,
              stageStatus: p.stageStatus === "pending" ? "audience" : p.stageStatus,
            }
          : p
      );
      room.version++;
      break;
    }

    case "APPROVE_STAGE": {
      if (!isTeacherActor) break;
      const targetId = String(body.targetUserId || "");
      const target = room.participants.find((p) => p.id === targetId);
      room.participants = room.participants.map((p) =>
        p.id === targetId
          ? {
              ...p,
              handRaised: false,
              stageStatus: "approved",
              micOn: true,
            }
          : p
      );
      if (target) {
        room.messages.push({
          id: `sys-${Date.now()}`,
          senderId: "system",
          sender: "System",
          role: "system",
          text: `${target.name} was approved onto the live stage.`,
          timestamp: nowStr,
        });
      }
      room.version++;
      break;
    }

    case "REJECT_STAGE": {
      if (!isTeacherActor) break;
      const targetId = String(body.targetUserId || "");
      room.participants = room.participants.map((p) =>
        p.id === targetId
          ? {
              ...p,
              handRaised: false,
              stageStatus: "audience",
              micOn: false,
              videoOn: false,
            }
          : p
      );
      room.version++;
      break;
    }

    case "INVITE_STAGE": {
      if (!isTeacherActor) break;
      const targetId = String(body.targetUserId || "");
      room.participants = room.participants.map((p) =>
        p.id === targetId
          ? {
              ...p,
              stageStatus: p.stageStatus === "approved" ? "approved" : "invited",
            }
          : p
      );
      room.version++;
      break;
    }

    case "ACCEPT_INVITE": {
      room.participants = room.participants.map((p) =>
        p.id === user.id && p.stageStatus === "invited"
          ? {
              ...p,
              stageStatus: "approved",
              handRaised: false,
              micOn: true,
            }
          : p
      );
      room.version++;
      break;
    }

    case "REMOVE_STAGE": {
      if (!isTeacherActor) break;
      const targetId = String(body.targetUserId || "");
      room.participants = room.participants.map((p) =>
        p.id === targetId
          ? {
              ...p,
              stageStatus: "audience",
              handRaised: false,
              micOn: false,
              videoOn: false,
            }
          : p
      );
      room.version++;
      break;
    }

    case "MUTE_STUDENT": {
      if (!isTeacherActor) break;
      const targetId = String(body.targetUserId || "");
      const nextMic = Boolean(body.micOn);
      room.participants = room.participants.map((p) =>
        p.id === targetId ? { ...p, micOn: nextMic } : p
      );
      room.version++;
      break;
    }

    case "TOGGLE_HOST_MEDIA": {
      if (!isTeacherActor) break;
      if (typeof body.hostMicOn === "boolean") room.hostMicOn = body.hostMicOn;
      if (typeof body.hostVideoOn === "boolean") room.hostVideoOn = body.hostVideoOn;
      if (typeof body.hostAudioOnly === "boolean") room.hostAudioOnly = body.hostAudioOnly;
      if (typeof body.hostScreenSharing === "boolean") {
        room.hostScreenSharing = body.hostScreenSharing;
      }
      room.version++;
      break;
    }

    case "TOGGLE_STUDENT_MEDIA": {
      room.participants = room.participants.map((p) => {
        if (p.id !== user.id) return p;
        const canSpeakOrShowCam = p.stageStatus === "approved";
        return {
          ...p,
          audioOnly: typeof body.audioOnly === "boolean" ? body.audioOnly : p.audioOnly,
          micOn:
            typeof body.micOn === "boolean"
              ? canSpeakOrShowCam
                ? body.micOn
                : false
              : p.micOn,
          videoOn:
            typeof body.videoOn === "boolean"
              ? canSpeakOrShowCam && !p.audioOnly
                ? body.videoOn
                : false
              : p.videoOn,
        };
      });
      room.version++;
      break;
    }

    case "SET_STAGE_VIEW": {
      if (!isTeacherActor) break;
      if (body.type === "slide" || body.type === "window" || body.type === "whiteboard") {
        room.screenShare.type = body.type;
      }
      if (typeof body.slideIndex === "number") {
        room.screenShare.slideIndex = Math.max(0, body.slideIndex);
      }
      room.version++;
      break;
    }

    case "WHITEBOARD_STROKE": {
      if (!isTeacherActor) break;
      if (body.stroke && Array.isArray(body.stroke.points)) {
        room.whiteboardStrokes = [...room.whiteboardStrokes.slice(-150), body.stroke];
        room.version++;
      }
      break;
    }

    case "CLEAR_WHITEBOARD": {
      if (!isTeacherActor) break;
      room.whiteboardStrokes = [];
      room.version++;
      break;
    }

    case "SEND_CHAT": {
      const text = String(body.text || "").trim();
      if (!text) break;
      room.messages = [
        ...room.messages.slice(-80),
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: user.id,
          sender: user.fullName,
          role: isTeacherActor ? "teacher" : "student",
          text,
          timestamp: nowStr,
          important: isTeacherActor && Boolean(body.important),
        },
      ];
      room.version++;
      break;
    }

    case "SEND_ANNOUNCEMENT": {
      if (!isTeacherActor) break;
      const message = String(body.message || "").trim();
      if (!message) {
        room.announcement = null;
      } else {
        room.announcement = {
          id: `ann-${Date.now()}`,
          title: String(body.title || "Teacher Announcement"),
          message,
          createdAt: nowStr,
        };
      }
      room.version++;
      break;
    }

    case "ASK_QUESTION": {
      const question = String(body.question || "").trim();
      if (!question) break;
      room.questions = [
        {
          id: `q-${Date.now()}`,
          authorId: user.id,
          authorName: user.fullName,
          question,
          timestamp: nowStr,
          resolved: false,
        },
        ...room.questions,
      ];
      room.version++;
      break;
    }

    case "ANSWER_QUESTION": {
      if (!isTeacherActor) break;
      const qId = String(body.questionId || "");
      const answer = String(body.answer || "").trim();
      room.questions = room.questions.map((q) =>
        q.id === qId
          ? { ...q, answer: answer || q.answer, answeredBy: room.teacherName, resolved: true }
          : q
      );
      room.version++;
      break;
    }

    case "CREATE_POLL": {
      if (!isTeacherActor) break;
      const question = String(body.question || "").trim();
      const options: string[] = Array.isArray(body.options) ? body.options : [];
      if (!question || options.length < 2) break;
      room.poll = {
        id: `poll-${Date.now()}`,
        question,
        options: options.map((txt, i) => ({ id: `opt-${i + 1}`, text: txt, votes: 0 })),
        totalVotes: 0,
        votedUserIds: [],
        active: true,
        createdAt: nowStr,
      };
      room.version++;
      break;
    }

    case "VOTE_POLL": {
      const optionId = String(body.optionId || "");
      if (!room.poll || !optionId) break;
      if (room.poll.votedUserIds.includes(user.id)) break;
      room.poll = {
        ...room.poll,
        totalVotes: room.poll.totalVotes + 1,
        votedUserIds: [...room.poll.votedUserIds, user.id],
        options: room.poll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
      };
      room.version++;
      break;
    }

    case "SHARE_MATERIAL": {
      if (!isTeacherActor) break;
      const title = String(body.title || "").trim();
      if (!title) break;
      const matId = `mat-${Date.now()}`;
      room.resources = [
        {
          id: matId,
          title,
          type: "pdf",
          size: String(body.size || "PDF"),
          url: String(body.url || "#resource"),
        },
        ...room.resources,
      ];
      await mutateLmsState((state) => {
        const lmsRoom = state.classrooms.find((c) => c.id === classId);
        if (lmsRoom) {
          lmsRoom.materials.unshift({
            id: matId,
            title,
            type: "PDF",
            url: typeof body.url === "string" ? body.url : undefined,
            uploadedBy: user.fullName,
            createdAt: new Date().toISOString(),
          });
        }
      });
      room.version++;
      break;
    }

    case "SUBMIT_ASSIGNMENT": {
      if (!room.assignment.submittedUserIds.includes(user.id)) {
        room.assignment = {
          ...room.assignment,
          submittedUserIds: [...room.assignment.submittedUserIds, user.id],
        };
        room.version++;
      }
      break;
    }

    case "UPDATE_NOTES": {
      if (isTeacherActor && typeof body.notes === "string") {
        room.classNotes = body.notes;
        await mutateLmsState((state) => {
          const lmsRoom = state.classrooms.find((c) => c.id === classId);
          if (lmsRoom) lmsRoom.lessonNotes = body.notes;
        });
        room.version++;
      }
      break;
    }

    case "WEBRTC_SIGNAL": {
      const list = store.signals.get(classId) || [];
      store.seqCounter += 1;
      list.push({
        seq: store.seqCounter,
        classId,
        fromPeerId: user.id,
        fromRole: isTeacherActor ? "TEACHER" : "STUDENT",
        toPeerId: String(body.toPeerId || "broadcast"),
        kind: body.kind,
        payload: body.payload,
        createdAt: Date.now(),
      });
      store.signals.set(classId, list.slice(-120));
      break;
    }

    default:
      break;
  }

  return room;
}

import { liveClasses, LiveClassItem } from "./liveClasses";
import type {
  ClassroomSnapshot,
  Participant,
  SignalingEnvelope,
} from "./classroomSync";

interface LiveRegistryStore {
  classes: LiveClassItem[];
  rooms: Map<string, ClassroomSnapshot>;
  signals: Map<string, SignalingEnvelope[]>;
  seqCounter: number;
}

const g = globalThis as unknown as { __learnovaLiveStore?: LiveRegistryStore };

function getStore(): LiveRegistryStore {
  if (!g.__learnovaLiveStore) {
    g.__learnovaLiveStore = {
      classes: [...liveClasses],
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

function makeDefaultParticipants(): Participant[] {
  return [
    {
      id: "demo-st-chidi",
      name: "Chidi Nwankwo",
      role: "STUDENT",
      avatar: "/images/avatar-chinedu.jpg",
      initials: "CN",
      color: "bg-[#0D9488]",
      micOn: false,
      videoOn: false,
      audioOnly: false,
      handRaised: false,
      stageStatus: "audience",
      joinedAt: "08:30 AM",
    },
    {
      id: "demo-st-amina",
      name: "Amina Yusuf",
      role: "STUDENT",
      avatar: "/images/avatar-funke.jpg",
      initials: "AY",
      color: "bg-[#0B1F3A]",
      micOn: false,
      videoOn: false,
      audioOnly: false,
      handRaised: true,
      handRaisedAt: "08:36 AM",
      stageStatus: "pending",
      joinedAt: "08:31 AM",
    },
    {
      id: "demo-st-tolu",
      name: "Toluwani Adeyemi",
      role: "STUDENT",
      initials: "TA",
      color: "bg-[#D97706]",
      micOn: false,
      videoOn: false,
      audioOnly: true,
      handRaised: false,
      stageStatus: "audience",
      joinedAt: "08:33 AM",
    },
    {
      id: "demo-st-zainab",
      name: "Zainab Musa",
      role: "STUDENT",
      initials: "ZM",
      color: "bg-slate-700",
      micOn: false,
      videoOn: false,
      audioOnly: false,
      handRaised: false,
      stageStatus: "audience",
      joinedAt: "08:34 AM",
    },
  ];
}

function createInitialSnapshot(classId: string): ClassroomSnapshot {
  const store = getStore();
  const meta =
    store.classes.find((c) => c.id === classId) ||
    ({
      id: classId,
      title: `Live Classroom · ${classId}`,
      topic: "Interactive Term Revision & Past Question Walkthrough",
      teacher: "Mrs. Funke Adewale",
      teacherAvatar: "/images/avatar-funke.jpg",
      hostPoster: "/images/teacher-live-poster.jpg",
      subject: "Mathematics",
      classLevel: "SSS 2 Science",
      term: "2025/2026 Session · Second Term",
      timeWat: "08:30 AM – 09:30 AM WAT",
      examFocus: "WAEC & JAMB Core",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      studentsCount: 18,
      status: classId === "math-001" ? "live" : "waiting",
    } as LiveClassItem);

  const isAlreadyLive = meta.status === "live";

  return {
    classId: meta.id,
    title: meta.title,
    topic: meta.topic,
    subject: meta.subject,
    classLevel: meta.classLevel,
    timeWat: meta.timeWat,
    teacherName: meta.teacher,
    teacherAvatar: meta.teacherAvatar,
    hostPoster: meta.hostPoster,
    sessionStatus: isAlreadyLive ? "live" : "waiting",
    startedAt: isAlreadyLive ? Date.now() - 18 * 60 * 1000 : null,
    endedAt: null,
    hostMicOn: true,
    hostVideoOn: true,
    hostAudioOnly: false,
    hostScreenSharing: false,
    screenShare: {
      type: "slide",
      slideIndex: 0,
    },
    poll: {
      id: "poll-initial",
      question: "For y = ax² + bx + c, when a > 0 the parabola opens:",
      options: [
        { id: "opt-1", text: "Upwards (Minimum Turning Point)", votes: 14 },
        { id: "opt-2", text: "Downwards (Maximum Turning Point)", votes: 2 },
        { id: "opt-3", text: "Sideways along the y-axis", votes: 1 },
      ],
      totalVotes: 17,
      votedUserIds: [],
      active: true,
      createdAt: "08:35 AM",
    },
    assignment: {
      id: "assign-1",
      title: `${meta.subject} Term 2 Practice Worksheet`,
      description:
        "Complete questions 1–4 from the lesson guide and upload your working steps before 6:00 PM WAT.",
      dueDate: "Today · 6:00 PM WAT",
      totalStudents: 24,
      submittedUserIds: [],
      status: "active",
    },
    participants: makeDefaultParticipants(),
    messages: [
      {
        id: "msg-welcome",
        senderId: "host",
        sender: meta.teacher,
        role: "teacher",
        text: `Welcome to ${meta.title}. Raise your hand anytime if you want to speak on stage.`,
        timestamp: "08:30 AM",
        avatar: meta.teacherAvatar,
        important: true,
      },
    ],
    questions: [
      {
        id: "q-1",
        authorId: "demo-st-chidi",
        authorName: "Chidi Nwankwo",
        question: "Ma, does x = -b / (2a) always give the turning point x-coordinate?",
        answer: "Yes — substitute that x back into f(x) to get the exact y-coordinate of the vertex.",
        answeredBy: meta.teacher,
        timestamp: "08:34 AM",
        resolved: true,
      },
    ],
    announcement: null,
    resources: [
      {
        id: "res-1",
        title: `${meta.subject} Lesson Note & Worked Examples`,
        type: "pdf",
        size: "1.4 MB",
        url: "#lesson-note",
      },
      {
        id: "res-2",
        title: "WAEC / NECO Formula Quick Reference",
        type: "pdf",
        size: "680 KB",
        url: "#formula-sheet",
      },
    ],
    classNotes: `${meta.title}\n• Key definitions and worked steps discussed in class.\n• Focus on exam presentation marks and clear units.`,
    whiteboardStrokes: [],
    version: 1,
  };
}

export function listClassesFromServer(): LiveClassItem[] {
  const store = getStore();
  return store.classes.map((cls) => {
    const room = store.rooms.get(cls.id);
    if (!room) return cls;
    return {
      ...cls,
      status:
        room.sessionStatus === "live"
          ? "live"
          : room.sessionStatus === "ended"
          ? "ended"
          : cls.status,
      studentsCount: room.participants.filter((p) => p.role === "STUDENT").length,
    };
  });
}

export function createClassOnServer(input: {
  title: string;
  topic: string;
  subject: string;
  classLevel: string;
  timeWat: string;
  teacher: string;
  startNow?: boolean;
}): LiveClassItem {
  const store = getStore();
  const slug = input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const id = `${slug}-${Date.now().toString().slice(-4)}`;
  const item: LiveClassItem = {
    id,
    title: input.title,
    topic: input.topic,
    teacher: input.teacher,
    teacherAvatar: "/images/avatar-funke.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    subject: input.subject,
    classLevel: input.classLevel,
    term: "2025/2026 Session · Second Term",
    timeWat: input.timeWat,
    examFocus: "WAEC & JAMB Core",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    studentsCount: 0,
    status: input.startNow ? "live" : "scheduled",
  };
  store.classes.unshift(item);
  getRoomSnapshot(id);
  if (input.startNow) {
    const room = store.rooms.get(id)!;
    room.sessionStatus = "live";
    room.startedAt = Date.now();
  }
  return item;
}

export function getRoomSnapshot(classId: string): ClassroomSnapshot {
  const store = getStore();
  if (!store.rooms.has(classId)) {
    store.rooms.set(classId, createInitialSnapshot(classId));
  }
  return store.rooms.get(classId)!;
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

export function applyRoomAction(classId: string, body: Record<string, any>): ClassroomSnapshot {
  const store = getStore();
  const room = getRoomSnapshot(classId);
  const action = String(body.action || "");
  const actorRole = String(body.actorRole || "STUDENT").toUpperCase();
  const isTeacherActor = actorRole === "TEACHER" || actorRole === "ADMIN";
  const nowStr = formatWatTime();

  switch (action) {
    case "JOIN_ROOM": {
      const id = String(body.userId || "").trim();
      const name = String(body.name || "Learner").trim();
      const role = body.role === "TEACHER" ? "TEACHER" : "STUDENT";
      if (!id) break;

      if (role === "TEACHER") {
        room.teacherName = name || room.teacherName;
        if (room.sessionStatus === "waiting") {
          room.sessionStatus = "live";
          room.startedAt = Date.now();
        }
      } else {
        const existing = room.participants.find((p) => p.id === id);
        if (!existing) {
          const initials = name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          room.participants.unshift({
            id,
            name,
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
      }
      room.version++;
      break;
    }

    case "LEAVE_ROOM": {
      const id = String(body.userId || "");
      room.participants = room.participants.filter((p) => p.id !== id);
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
      room.version++;
      break;
    }

    case "RAISE_HAND": {
      const userId = String(body.userId || "");
      room.participants = room.participants.map((p) =>
        p.id === userId
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
      const userId = String(body.userId || "");
      room.participants = room.participants.map((p) =>
        p.id === userId
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
      const userId = String(body.userId || "");
      room.participants = room.participants.map((p) =>
        p.id === userId && p.stageStatus === "invited"
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
      const userId = String(body.userId || "");
      room.participants = room.participants.map((p) => {
        if (p.id !== userId) return p;
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
          senderId: String(body.userId || "anon"),
          sender: String(body.sender || "Participant"),
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
          authorId: String(body.userId || "anon"),
          authorName: String(body.authorName || "Student"),
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
      const userId = String(body.userId || "");
      if (!room.poll || !optionId || !userId) break;
      if (room.poll.votedUserIds.includes(userId)) break;
      room.poll = {
        ...room.poll,
        totalVotes: room.poll.totalVotes + 1,
        votedUserIds: [...room.poll.votedUserIds, userId],
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
      room.resources = [
        {
          id: `res-${Date.now()}`,
          title,
          type: "pdf",
          size: String(body.size || "820 KB"),
          url: "#resource",
        },
        ...room.resources,
      ];
      room.version++;
      break;
    }

    case "SUBMIT_ASSIGNMENT": {
      const userId = String(body.userId || "");
      if (userId && !room.assignment.submittedUserIds.includes(userId)) {
        room.assignment = {
          ...room.assignment,
          submittedUserIds: [...room.assignment.submittedUserIds, userId],
        };
        room.version++;
      }
      break;
    }

    case "UPDATE_NOTES": {
      if (typeof body.notes === "string") {
        room.classNotes = body.notes;
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
        fromPeerId: String(body.fromPeerId || ""),
        fromRole: body.fromRole === "TEACHER" ? "TEACHER" : "STUDENT",
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

// Shared Classroom Types & Multi-channel Sync Helper
import { supabase } from "./supabase";

export type StageStatus = "audience" | "pending" | "approved" | "invited";
export type SessionStatus = "waiting" | "live" | "ended";
export type ScreenShareType = "slide" | "window" | "whiteboard";
export type VideoQualityPreset = "low" | "medium" | "high";

export interface ChatMessage {
  id: string;
  senderId: string;
  sender: string;
  role: "teacher" | "student" | "system";
  text: string;
  timestamp: string;
  avatar?: string;
  important?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: "TEACHER" | "STUDENT";
  avatar?: string;
  initials: string;
  color: string;
  micOn: boolean;
  videoOn: boolean;
  audioOnly?: boolean;
  handRaised: boolean;
  handRaisedAt?: string;
  stageStatus: StageStatus;
  isHost?: boolean;
  joinedAt: string;
}

export interface LivePoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  votedUserIds: string[];
  active: boolean;
  createdAt: string;
}

export interface SharedResource {
  id: string;
  title: string;
  type: "pdf" | "doc" | "link";
  size: string;
  url: string;
}

export interface LiveAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalStudents: number;
  submittedUserIds: string[];
  status: "active" | "completed";
}

export interface ClassQuestion {
  id: string;
  authorId: string;
  authorName: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  timestamp: string;
  resolved: boolean;
}

export interface ClassAnnouncement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface WhiteboardStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

export interface SignalingEnvelope {
  seq: number;
  classId: string;
  fromPeerId: string;
  fromRole: "TEACHER" | "STUDENT";
  toPeerId: string; // specific peer ID or "broadcast"
  kind: "offer" | "answer" | "ice" | "request_offer" | "media_state";
  payload: any;
  createdAt: number;
}

export interface ClassroomSnapshot {
  classId: string;
  title: string;
  topic: string;
  subject: string;
  classLevel: string;
  timeWat: string;
  teacherName: string;
  teacherAvatar: string;
  hostPoster: string;
  sessionStatus: SessionStatus;
  startedAt: number | null;
  endedAt: number | null;
  hostMicOn: boolean;
  hostVideoOn: boolean;
  hostAudioOnly: boolean;
  hostScreenSharing: boolean;
  screenShare: {
    type: ScreenShareType;
    slideIndex: number;
  };
  poll: LivePoll | null;
  assignment: LiveAssignment;
  participants: Participant[];
  messages: ChatMessage[];
  questions: ClassQuestion[];
  announcement: ClassAnnouncement | null;
  resources: SharedResource[];
  classNotes: string;
  whiteboardStrokes: WhiteboardStroke[];
  version: number;
}

type SyncListener = (event: { type: string; payload: any }) => void;

class ClassroomSyncService {
  private channel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private listeners: Set<SyncListener> = new Set();
  private classId: string = "math-001";

  public init(classId: string) {
    if (typeof window === "undefined") return;

    if (this.channel && this.classId !== classId) {
      this.cleanup();
    }
    this.classId = classId;

    if (!this.channel) {
      try {
        this.channel = new BroadcastChannel(`learnova_live_room_${classId}`);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch {
        // fallback handled by server polling + Supabase
      }
    }

    if (!this.supabaseChannel && supabase) {
      try {
        this.supabaseChannel = supabase.channel(`live_class:${classId}`);
        this.supabaseChannel
          .on("broadcast", { event: "classroom_sync" }, (payload: any) => {
            this.notifyListeners(payload.payload);
          })
          .subscribe();
      } catch {
        // ignore
      }
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(data: { type: string; payload: any }) {
    this.listeners.forEach((l) => {
      try {
        l(data);
      } catch {
        // ignore listener failure
      }
    });
  }

  public broadcast(type: string, payload: any) {
    const message = { type, payload };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // ignore
      }
    }

    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "classroom_sync",
          payload: message,
        });
      } catch {
        // ignore
      }
    }
  }

  public async fetchSnapshot(
    classId: string,
    peerId?: string,
    sinceSeq: number = 0
  ): Promise<{ snapshot: ClassroomSnapshot; signals: SignalingEnvelope[]; latestSeq: number } | null> {
    try {
      const qs = new URLSearchParams();
      if (peerId) qs.set("peerId", peerId);
      qs.set("sinceSeq", String(sinceSeq));
      const res = await fetch(`/api/live-classes/${encodeURIComponent(classId)}?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async dispatchAction(
    classId: string,
    action: string,
    payload: Record<string, any> = {}
  ): Promise<ClassroomSnapshot | null> {
    try {
      const res = await fetch(`/api/live-classes/${encodeURIComponent(classId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.snapshot) {
        this.broadcast("SNAPSHOT_UPDATED", { version: data.snapshot.version });
        return data.snapshot as ClassroomSnapshot;
      }
      return null;
    } catch {
      return null;
    }
  }

  public cleanup() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.supabaseChannel && supabase) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch {
        // ignore
      }
      this.supabaseChannel = null;
    }
    this.listeners.clear();
  }
}

export const classroomSync = new ClassroomSyncService();

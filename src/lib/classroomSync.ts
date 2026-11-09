// Real-time synchronization service for Learnova Live Classroom
// Supports multi-tab / multi-user WebRTC signalling, broadcast messaging, and Supabase Realtime fallback

import { supabase } from "./supabase";

export interface ChatMessage {
  id: string;
  sender: string;
  role: "teacher" | "student" | "system" | "nova";
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
  initials?: string;
  color?: string;
  micOn: boolean;
  videoOn: boolean;
  handRaised: boolean;
  isHost?: boolean;
  joinedAt: string;
}

export interface LivePoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
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
  submittedCount: number;
  status: "active" | "completed";
}

export type ScreenShareType = "slide" | "window" | "whiteboard" | "none";

export interface ClassroomState {
  classId: string;
  title: string;
  subject: string;
  teacherName: string;
  timerSeconds: number;
  isRecording: boolean;
  screenShare: {
    type: ScreenShareType;
    slideTitle?: string;
    activeStream?: boolean;
  };
  poll: LivePoll | null;
  assignment: LiveAssignment | null;
  participants: Participant[];
  messages: ChatMessage[];
  resources: SharedResource[];
  classNotes: string;
}

type SyncListener = (event: { type: string; payload: any }) => void;

class ClassroomSyncService {
  private channel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private listeners: Set<SyncListener> = new Set();
  private classId: string = "math-001";

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel("learnova_live_room");
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn("BroadcastChannel not supported in this browser environment", err);
      }
    }
  }

  public init(classId: string) {
    this.classId = classId;

    if (typeof window !== "undefined" && supabase) {
      try {
        // Connect to Supabase Realtime channel
        this.supabaseChannel = supabase.channel(`live_class:${classId}`);
        this.supabaseChannel
          .on("broadcast", { event: "classroom_sync" }, (payload: any) => {
            this.notifyListeners(payload.payload);
          })
          .subscribe();
      } catch (e) {
        console.warn("Supabase realtime subscription fallback", e);
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
      } catch (err) {
        console.error("Error in sync listener:", err);
      }
    });
  }

  public broadcast(type: string, payload: any) {
    const message = { type, payload };

    // 1. Broadcast locally across browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.error("BroadcastChannel postMessage error:", err);
      }
    }

    // 2. Notify local listeners immediately
    this.notifyListeners(message);

    // 3. Broadcast to remote Supabase Realtime if subscribed
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "classroom_sync",
          payload: message,
        });
      } catch (err) {
        // Ignore remote send errors
      }
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
      } catch (e) {
        // ignore
      }
      this.supabaseChannel = null;
    }
    this.listeners.clear();
  }
}

export const classroomSync = new ClassroomSyncService();

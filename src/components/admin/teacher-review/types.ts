import { User } from "@/lib/auth";

export interface TeacherReviewProps {
  teacher: User & { teachingCertificate?: string; bio?: string };
}

export interface VerificationItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

export interface DocumentItem {
  title: string;
  file?: string;
  type: "image" | "pdf" | "document";
}

export interface AdminNote {
  note: string;
  createdAt: string;
}
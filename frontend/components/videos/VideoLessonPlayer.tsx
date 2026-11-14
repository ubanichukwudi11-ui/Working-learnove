"use client";

import { ExternalLink, Film } from "lucide-react";

export interface VideoLessonMaterialItem {
  id: string;
  title: string;
  type: "PDF" | "WORKSHEET" | "SLIDES" | "NOTES" | "LINK";
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  contentText?: string;
  createdAt?: string;
}

export interface VideoLessonItem {
  id: string;
  topicId: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  title: string;
  description: string;
  sourceType: "UPLOADED_VIDEO" | "YOUTUBE" | "EXTERNAL_LINK";
  videoUrl: string;
  youtubeVideoId?: string;
  mimeType?: string;
  durationLabel?: string;
  materials?: VideoLessonMaterialItem[];
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: string;
  status: string;
  reviewNotes?: string;
  viewCount: number;
  createdAt: string;
}

export function parseYouTubeIdClient(rawUrl: string): string | null {
  const input = String(rawUrl || "").trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        ["embed", "shorts", "live", "v"].includes(parts[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default function VideoLessonPlayer({
  video,
}: {
  video: VideoLessonItem;
}) {
  const ytId =
    video.youtubeVideoId ||
    (video.sourceType === "YOUTUBE" ? parseYouTubeIdClient(video.videoUrl) : null);

  if (ytId) {
    return (
      <div className="space-y-2">
        <div className="learnova-ambient-stage-soft rounded-2xl">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#070D24] border border-white/15 shadow-sm">
          <iframe
            key={ytId}
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-[#6B6F94] px-1">
          <span>Curated YouTube Lesson</span>
          <a
            href={`https://www.youtube.com/watch?v=${ytId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#4F46E5] hover:text-[#6D28D9]"
          >
            Open in YouTube
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  if (
    video.sourceType === "UPLOADED_VIDEO" ||
    /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(video.videoUrl)
  ) {
    return (
      <div className="learnova-ambient-stage-soft rounded-2xl">
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#070D24] border border-white/15 shadow-sm">
        <video
          key={video.videoUrl}
          src={video.videoUrl}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
      </div>
      </div>
    );
  }

  return (
    <div className="learnova-banner-dark bg-architectural-grid-dark aspect-video w-full rounded-2xl text-white border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#22D3EE]">
        <Film size={28} />
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-bold">{video.title}</h3>
        <p className="text-xs text-indigo-100/80">
          External instructional video link provided by {video.uploadedByName}.
        </p>
      </div>
      <a
        href={video.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition shadow-sm"
      >
        Launch External Video Lesson
        <ExternalLink size={15} />
      </a>
    </div>
  );
}

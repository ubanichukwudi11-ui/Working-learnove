"use client";

import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import { Video } from "lucide-react";

import "@livekit/components-styles";

export default function VideoRoom() {
  const token = "";
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) {
    return (
      <div className="h-full min-h-[360px] rounded-2xl bg-[#0D1438] border border-white/12 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center mb-3">
          <Video size={22} />
        </div>
        <h3 className="landing-display text-lg font-bold text-white">Live Classroom Stream</h3>
        <p className="text-slate-300 text-sm mt-1 max-w-sm">
          Interactive live class session is ready. Configure LiveKit room token and URL to stream audio and video.
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      className="h-full"
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
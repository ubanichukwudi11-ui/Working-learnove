"use client";

import {
LiveKitRoom,
VideoConference
} from "@livekit/components-react";

import "@livekit/components-styles";



export default function VideoRoom() {
  const token = "";
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) {
    return (
      <div className="h-full min-h-[360px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 text-xl">
          📹
        </div>
        <h3 className="text-lg font-semibold text-white">Live Classroom Stream</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
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
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AudioTrack,
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useLocalParticipant,
  useTracks,
  type TrackReference,
} from "@livekit/components-react";
import { Track, VideoPresets, type VideoPreset } from "livekit-client";
import type { VideoQualityPreset } from "@/lib/classroomSync";
import "@livekit/components-styles";

interface LiveKitClassroomContextValue {
  status: "connecting" | "connected" | "unavailable";
  notice: string | null;
  canPublish: boolean;
  cameraTracks: TrackReference[];
  screenShareTrack: TrackReference | null;
  audioLevel: number;
  setScreenShareEnabled: (enabled: boolean) => Promise<boolean>;
}

const LiveKitClassroomContext = createContext<LiveKitClassroomContextValue>({
  status: "unavailable",
  notice: null,
  canPublish: false,
  cameraTracks: [],
  screenShareTrack: null,
  audioLevel: 0,
  setScreenShareEnabled: async () => false,
});

export function useLiveKitClassroom() {
  return useContext(LiveKitClassroomContext);
}

function presetForQuality(quality: VideoQualityPreset): VideoPreset {
  if (quality === "low") return VideoPresets.h180;
  if (quality === "high") return VideoPresets.h720;
  return VideoPresets.h360;
}

function LiveKitInnerBridge({
  canPublish,
  micOn,
  videoOn,
  audioOnly,
  status,
  notice,
  onMediaNotice,
  children,
}: {
  canPublish: boolean;
  micOn: boolean;
  videoOn: boolean;
  audioOnly: boolean;
  status: "connecting" | "connected" | "unavailable";
  notice: string | null;
  onMediaNotice?: (msg: string | null) => void;
  children: React.ReactNode;
}) {
  const { localParticipant } = useLocalParticipant();
  const [audioLevel, setAudioLevel] = useState(0);

  const cameraTrackRefs = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  const screenTrackRefs = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const cameraTracks = useMemo(
    () => cameraTrackRefs.filter(isTrackReference),
    [cameraTrackRefs]
  );

  const screenShareTrack = useMemo(() => {
    const found = screenTrackRefs.find(isTrackReference);
    return found || null;
  }, [screenTrackRefs]);

  useEffect(() => {
    if (!localParticipant) return;
    const syncLocalTracks = async () => {
      try {
        if (!canPublish) {
          await localParticipant.setMicrophoneEnabled(false).catch(() => {});
          await localParticipant.setCameraEnabled(false).catch(() => {});
          return;
        }
        await localParticipant.setMicrophoneEnabled(micOn).catch(() => {});
        await localParticipant
          .setCameraEnabled(videoOn && !audioOnly)
          .catch(() => {});
      } catch (err) {
        console.warn("LiveKit local media toggle warning:", err);
      }
    };
    syncLocalTracks();
  }, [localParticipant, canPublish, micOn, videoOn, audioOnly]);

  useEffect(() => {
    if (!localParticipant || !canPublish || !micOn) {
      setAudioLevel(0);
      return;
    }
    const timer = setInterval(() => {
      const level = Math.min(
        100,
        Math.round((localParticipant.audioLevel || 0) * 100)
      );
      setAudioLevel(level);
    }, 300);
    return () => clearInterval(timer);
  }, [localParticipant, canPublish, micOn]);

  const setScreenShareEnabled = useCallback(
    async (enabled: boolean) => {
      if (!localParticipant || !canPublish) return false;
      try {
        await localParticipant.setScreenShareEnabled(enabled);
        return true;
      } catch {
        onMediaNotice?.(
          "Screen sharing was cancelled or is unsupported in this browser."
        );
        return false;
      }
    },
    [localParticipant, canPublish, onMediaNotice]
  );

  const value = useMemo<LiveKitClassroomContextValue>(
    () => ({
      status,
      notice,
      canPublish,
      cameraTracks,
      screenShareTrack,
      audioLevel,
      setScreenShareEnabled,
    }),
    [
      status,
      notice,
      canPublish,
      cameraTracks,
      screenShareTrack,
      audioLevel,
      setScreenShareEnabled,
    ]
  );

  return (
    <LiveKitClassroomContext.Provider value={value}>
      <RoomAudioRenderer />
      {children}
    </LiveKitClassroomContext.Provider>
  );
}

export function LiveKitClassroomProvider({
  classId,
  canPublish,
  micOn,
  videoOn,
  audioOnly = false,
  quality = "medium",
  onMediaNotice,
  children,
}: {
  classId: string;
  canPublish: boolean;
  micOn: boolean;
  videoOn: boolean;
  audioOnly?: boolean;
  quality?: VideoQualityPreset;
  onMediaNotice?: (msg: string | null) => void;
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "unavailable">(
    "connecting"
  );
  const [notice, setNotice] = useState<string | null>(null);
  const lastCanPublishRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;

    const fetchToken = async () => {
      try {
        if (lastCanPublishRef.current !== canPublish) {
          setStatus("connecting");
        }
        const res = await fetch(
          `/api/live-classes/${encodeURIComponent(classId)}/token`,
          {
            method: "POST",
            cache: "no-store",
          }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !data.token || !data.serverUrl) {
          setToken(null);
          setServerUrl(null);
          setStatus("unavailable");
          const msg =
            data.code === "LIVEKIT_NOT_CONFIGURED"
              ? "Interactive classroom sync active. Configure LiveKit Cloud credentials to stream live audio/video."
              : data.error || null;
          setNotice(msg);
          if (msg) onMediaNotice?.(msg);
          return;
        }

        lastCanPublishRef.current = canPublish;
        setToken(data.token);
        setServerUrl(data.serverUrl);
        setNotice(null);
        setStatus("connected");
      } catch {
        if (cancelled) return;
        setStatus("unavailable");
      }
    };

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [classId, canPublish, onMediaNotice]);

  const fallbackValue = useMemo<LiveKitClassroomContextValue>(
    () => ({
      status,
      notice,
      canPublish,
      cameraTracks: [],
      screenShareTrack: null,
      audioLevel: 0,
      setScreenShareEnabled: async () => false,
    }),
    [status, notice, canPublish]
  );

  if (!token || !serverUrl) {
    return (
      <LiveKitClassroomContext.Provider value={fallbackValue}>
        {children}
      </LiveKitClassroomContext.Provider>
    );
  }

  return (
    <LiveKitRoom
      key={`${classId}-${canPublish ? "pub" : "sub"}`}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={canPublish && micOn}
      video={canPublish && videoOn && !audioOnly}
      options={{
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: presetForQuality(quality),
        },
      }}
      onConnected={() => setStatus("connected")}
      onDisconnected={() => setStatus("connecting")}
      onError={(err) => {
        console.warn("LiveKit room warning:", err);
      }}
    >
      <LiveKitInnerBridge
        canPublish={canPublish}
        micOn={micOn}
        videoOn={videoOn}
        audioOnly={audioOnly}
        status={status}
        notice={notice}
        onMediaNotice={onMediaNotice}
      >
        {children}
      </LiveKitInnerBridge>
    </LiveKitRoom>
  );
}

export function LiveKitParticipantVideoTile({
  participantIdentity,
  matchTeacher = false,
  className = "w-full h-full object-cover",
  fallback,
}: {
  participantIdentity?: string;
  matchTeacher?: boolean;
  className?: string;
  fallback: React.ReactNode;
}) {
  const { cameraTracks } = useLiveKitClassroom();

  const matchingTrack = useMemo(() => {
    if (participantIdentity) {
      const exact = cameraTracks.find(
        (t) => t.participant.identity === participantIdentity
      );
      if (exact) return exact;
    }
    if (matchTeacher) {
      return (
        cameraTracks.find((t) => {
          try {
            const meta = t.participant.metadata
              ? JSON.parse(t.participant.metadata)
              : null;
            return meta?.role === "TEACHER";
          } catch {
            return false;
          }
        }) || null
      );
    }
    return null;
  }, [cameraTracks, participantIdentity, matchTeacher]);

  if (!matchingTrack || matchingTrack.publication?.isMuted) {
    return <>{fallback}</>;
  }

  return <VideoTrack trackRef={matchingTrack} className={className} />;
}

export function LiveKitAudioMonitor({ trackRef }: { trackRef: TrackReference }) {
  return <AudioTrack trackRef={trackRef} />;
}

export default function VideoRoom({
  classId = "",
  canPublish = false,
}: {
  classId?: string;
  canPublish?: boolean;
}) {
  return (
    <LiveKitClassroomProvider
      classId={classId}
      canPublish={canPublish}
      micOn={canPublish}
      videoOn={canPublish}
    >
      <div className="h-full min-h-[240px] rounded-2xl bg-[#0D1438] border border-white/12 overflow-hidden relative">
        <LiveKitParticipantVideoTile
          matchTeacher
          fallback={
            <div className="h-full flex items-center justify-center p-6 text-xs text-slate-300">
              Live classroom stage connected.
            </div>
          }
        />
      </div>
    </LiveKitClassroomProvider>
  );
}
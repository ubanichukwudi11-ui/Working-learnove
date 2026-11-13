"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Users,
  Send,
  Sparkles,
  Megaphone,
  PhoneOff,
  Check,
  X,
  UserPlus,
  UserMinus,
  Wifi,
  Play,
  ClipboardCheck,
  Pencil,
  Presentation,
  Radio,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  ClassroomSnapshot,
  classroomSync,
  ScreenShareType,
  VideoQualityPreset,
  WhiteboardStroke,
} from "@/lib/classroomSync";
import { webrtcManager } from "@/lib/webrtcManager";
import PresentationStage from "./PresentationStage";
import ClassroomTools from "./ClassroomTools";
import NovaClassAssistantModal from "./NovaClassAssistantModal";

function RemoteVideoTile({ stream, label }: { stream: MediaStream; label: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      aria-label={label}
      className="w-full h-full object-cover"
    />
  );
}

export default function TeacherLiveClassroom({ classId = "math-001" }: { classId?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const hostPeerId = useMemo(() => `teacher-${user?.id || "host"}`, [user?.id]);

  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [quality, setQuality] = useState<VideoQualityPreset>("medium");

  const [rightTab, setRightTab] = useState<"roster" | "chat" | "attendance">("roster");
  const [bottomTab, setBottomTab] = useState<
    "polls" | "qa" | "resources" | "assignments" | "notes"
  >("polls");
  const [chatInput, setChatInput] = useState("");
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const seqRef = useRef(0);
  const knownPeersOfferedRef = useRef<Set<string>>(new Set());

  const syncFromServer = useCallback(async () => {
    const res = await classroomSync.fetchSnapshot(classId, hostPeerId, seqRef.current);
    if (!res) return;
    seqRef.current = res.latestSeq;
    setSnapshot(res.snapshot);

    for (const sig of res.signals) {
      await webrtcManager.handleSignal(
        classId,
        hostPeerId,
        "TEACHER",
        sig.fromPeerId,
        sig.kind,
        sig.payload,
        (stream) => {
          setRemoteStreams((prev) => ({ ...prev, [sig.fromPeerId]: stream }));
        }
      );
    }
  }, [classId, hostPeerId]);

  useEffect(() => {
    classroomSync.init(classId);

    const init = async () => {
      await classroomSync.dispatchAction(classId, "JOIN_ROOM", {
        userId: hostPeerId,
        name: user?.fullName || "Mrs. Funke Adewale",
        role: "TEACHER",
        actorRole: "TEACHER",
      });
      await syncFromServer();
    };
    init();

    const unsub = classroomSync.subscribe(({ type }) => {
      if (type === "SNAPSHOT_UPDATED") {
        syncFromServer();
      }
    });

    const pollTimer = setInterval(syncFromServer, 2000);
    return () => {
      unsub();
      clearInterval(pollTimer);
    };
  }, [classId, hostPeerId, user?.fullName, syncFromServer]);

  // Start teacher local camera/mic on entry with graceful fallback
  useEffect(() => {
    let mounted = true;
    const startHostMedia = async () => {
      const res = await webrtcManager.startLocalMedia(true, true, quality);
      if (!mounted) return;
      if (res.stream) setLocalStream(res.stream);
      if (res.errorReason) setMediaNotice(res.errorReason);
    };
    startHostMedia();

    const unsubAudio = webrtcManager.onAudioLevel((lvl) => {
      if (mounted) setAudioLevel(lvl);
    });

    return () => {
      mounted = false;
      unsubAudio();
      webrtcManager.closeAll();
    };
  }, [quality]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Elapsed timer synchronized from session start
  useEffect(() => {
    if (!snapshot?.startedAt || snapshot.sessionStatus !== "live") return;
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - snapshot.startedAt!) / 1000)));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [snapshot?.startedAt, snapshot?.sessionStatus]);

  // Offer WebRTC stream to any real connected student peers
  useEffect(() => {
    if (!snapshot) return;
    const realStudentIds = snapshot.participants
      .filter((p) => p.role === "STUDENT" && !p.id.startsWith("demo-"))
      .map((p) => p.id);

    for (const sid of realStudentIds) {
      if (!knownPeersOfferedRef.current.has(sid)) {
        knownPeersOfferedRef.current.add(sid);
        webrtcManager.sendOffer(classId, hostPeerId, "TEACHER", sid, (stream) => {
          setRemoteStreams((prev) => ({ ...prev, [sid]: stream }));
        });
      }
    }
  }, [snapshot, classId, hostPeerId]);

  const act = async (action: string, payload: Record<string, any> = {}) => {
    const next = await classroomSync.dispatchAction(classId, action, {
      actorRole: "TEACHER",
      ...payload,
    });
    if (next) setSnapshot(next);
  };

  const handleToggleMic = async () => {
    const muted = webrtcManager.toggleMute();
    await act("TOGGLE_HOST_MEDIA", { hostMicOn: !muted });
  };

  const handleToggleCam = async () => {
    const stopped = webrtcManager.toggleVideo();
    await act("TOGGLE_HOST_MEDIA", { hostVideoOn: !stopped });
  };

  const handleAudioOnlyToggle = async () => {
    const nextAudioOnly = !snapshot?.hostAudioOnly;
    if (nextAudioOnly) {
      webrtcManager.toggleVideo(true);
    } else {
      webrtcManager.toggleVideo(false);
    }
    await act("TOGGLE_HOST_MEDIA", {
      hostAudioOnly: nextAudioOnly,
      hostVideoOn: !nextAudioOnly,
    });
  };

  const handleStageMode = async (mode: ScreenShareType) => {
    if (mode === "window") {
      const stream = await webrtcManager.startScreenShare(() => {
        setScreenStream(null);
        act("TOGGLE_HOST_MEDIA", { hostScreenSharing: false });
        act("SET_STAGE_VIEW", { type: "slide" });
      });
      if (!stream) {
        setMediaNotice("Screen sharing was cancelled or is unsupported in this browser.");
        return;
      }
      setScreenStream(stream);
      await act("TOGGLE_HOST_MEDIA", { hostScreenSharing: true });
      await act("SET_STAGE_VIEW", { type: "window" });
    } else {
      webrtcManager.stopScreenShare();
      setScreenStream(null);
      await act("TOGGLE_HOST_MEDIA", { hostScreenSharing: false });
      await act("SET_STAGE_VIEW", { type: mode });
    }
  };

  const handleEndClass = async () => {
    await act("END_CLASS");
    webrtcManager.closeAll();
    setIsEndModalOpen(false);
    router.push("/live-classes");
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const participants = snapshot?.participants || [];
  const raisedHands = participants.filter((p) => p.handRaised || p.stageStatus === "pending");
  const stageStudents = participants.filter((p) => p.stageStatus === "approved");
  const hostVideoActive = Boolean(snapshot?.hostVideoOn && !snapshot?.hostAudioOnly && localStream);

  return (
    <div className="min-h-screen bg-[#060E1B] text-white flex flex-col">
      {/* Top Studio Header */}
      <header className="h-16 border-b border-white/10 bg-[#0B1F3A] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            Workspace
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold truncate">
              {snapshot?.title || "Teacher Live Classroom"}
            </h1>
            <p className="text-[11px] text-teal-300 truncate">
              Teacher Control Room · {snapshot?.classLevel || "SSS 2"} · {snapshot?.timeWat || "WAT"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {snapshot?.sessionStatus === "live" ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300 tabular-nums">
              <Radio size={13} />
              <span>LIVE</span>
              <span>·</span>
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
          ) : (
            <button
              onClick={() => act("START_CLASS")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              Start Live Class
            </button>
          )}

          {raisedHands.length > 0 && (
            <button
              onClick={() => setRightTab("roster")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97706] text-white text-xs font-bold tabular-nums whitespace-nowrap"
            >
              <Hand size={13} />
              {raisedHands.length} Raised
            </button>
          )}

          <button
            onClick={() => setIsEndModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap"
          >
            <PhoneOff size={13} />
            End Class
          </button>
        </div>
      </header>

      {/* Alerts: Media fallback or Active Raised Hand */}
      {(mediaNotice || raisedHands.length > 0) && (
        <div className="px-4 sm:px-6 pt-3 flex flex-col sm:flex-row gap-2.5">
          {raisedHands.map((st) => (
            <div
              key={st.id}
              className="flex-1 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Hand size={15} className="text-[#F59E0B] shrink-0" />
                <span>
                  <strong className="text-white">{st.name}</strong> raised hand to join the stage{" "}
                  <span className="text-amber-200">({st.handRaisedAt || "Now"})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => act("APPROVE_STAGE", { targetUserId: st.id })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold"
                >
                  <Check size={13} />
                  Approve to Stage
                </button>
                <button
                  onClick={() => act("REJECT_STAGE", { targetUserId: st.id })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold"
                >
                  <X size={13} />
                  Decline
                </button>
              </div>
            </div>
          ))}

          {mediaNotice && (
            <div className="rounded-xl border border-white/15 bg-[#0B1F3A] px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-200">
              <span>{mediaNotice}</span>
              <button onClick={() => setMediaNotice(null)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex-1 p-4 sm:p-6 grid lg:grid-cols-[1.55fr_0.9fr] gap-5 items-start">
        {/* LEFT COLUMN: Stage + Host/Stage Video + Controls + Interactive Tools */}
        <div className="space-y-4">
          {/* Host Video + Stage Guests + Presentation Stage */}
          <div className="grid md:grid-cols-[0.42fr_1fr] gap-4 items-stretch">
            {/* Teacher Camera + Stage Guests Column */}
            <div className="space-y-3 flex flex-col">
              {/* Teacher Host Video Feed */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0B1F3A] aspect-[4/3] shadow-sm">
                {hostVideoActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={snapshot?.hostPoster || "/images/teacher-live-poster.jpg"}
                    alt={snapshot?.teacherName || "Instructor"}
                    fill
                    className="object-cover opacity-85"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white leading-tight">
                      {snapshot?.teacherName || user?.fullName || "Instructor"}
                    </p>
                    <p className="text-[11px] text-teal-300">
                      Host · {snapshot?.hostAudioOnly ? "Audio-Only Mode" : snapshot?.hostVideoOn ? "Camera Live" : "Camera Paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {snapshot?.hostMicOn ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] tabular-nums">
                        MIC {audioLevel}%
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-md bg-rose-600/80 text-white">
                        <MicOff size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Approved Student(s) On Stage ONLY */}
              {stageStudents.length > 0 ? (
                stageStudents.map((st) => (
                  <div
                    key={st.id}
                    className="relative rounded-2xl overflow-hidden border border-[#0D9488] bg-[#0B1F3A] p-3 space-y-2"
                  >
                    {remoteStreams[st.id] && st.videoOn ? (
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                        <RemoteVideoTile stream={remoteStreams[st.id]} label={st.name} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center font-bold text-xs shrink-0">
                          {st.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{st.name}</p>
                          <p className="text-[11px] text-teal-300">
                            On Stage · {st.micOn ? "Speaking / Mic Live" : "Muted"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          act("MUTE_STUDENT", { targetUserId: st.id, micOn: !st.micOn })
                        }
                        className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold"
                      >
                        {st.micOn ? "Mute Mic" : "Allow Mic"}
                      </button>
                      <button
                        onClick={() => act("REMOVE_STAGE", { targetUserId: st.id })}
                        className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold"
                      >
                        Remove Stage
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0B1F3A]/60 p-4 text-xs text-slate-300 flex-1 flex flex-col justify-center">
                  <p className="font-bold text-white">No Students on Stage</p>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    Students join as audience avatars. Approve a raised hand or invite someone from the roster to unlock their mic &amp; camera here.
                  </p>
                </div>
              )}
            </div>

            {/* Presentation / Screen Share / Whiteboard Stage */}
            <PresentationStage
              classId={classId}
              subject={snapshot?.subject}
              type={snapshot?.screenShare.type || "slide"}
              slideIndex={snapshot?.screenShare.slideIndex || 0}
              screenStream={screenStream}
              whiteboardStrokes={snapshot?.whiteboardStrokes || []}
              isTeacher
              onChangeSlide={(nextIndex) => act("SET_STAGE_VIEW", { slideIndex: nextIndex })}
              onAddStroke={(stroke: WhiteboardStroke) => act("WHITEBOARD_STROKE", { stroke })}
              onClearWhiteboard={() => act("CLEAR_WHITEBOARD")}
              onAskNova={() => setIsNovaOpen(true)}
            />
          </div>

          {/* Teacher Studio Toolbar */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1F3A] p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleMic}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  snapshot?.hostMicOn
                    ? "bg-white/10 hover:bg-white/15 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {snapshot?.hostMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                {snapshot?.hostMicOn ? "Mute" : "Unmute"}
              </button>

              <button
                onClick={handleToggleCam}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  snapshot?.hostVideoOn && !snapshot?.hostAudioOnly
                    ? "bg-white/10 hover:bg-white/15 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {snapshot?.hostVideoOn && !snapshot?.hostAudioOnly ? (
                  <Video size={14} />
                ) : (
                  <VideoOff size={14} />
                )}
                Camera
              </button>

              <button
                onClick={handleAudioOnlyToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  snapshot?.hostAudioOnly
                    ? "bg-[#D97706] text-white"
                    : "bg-white/10 hover:bg-white/15 text-slate-200"
                }`}
              >
                <Wifi size={14} />
                {snapshot?.hostAudioOnly ? "Audio-Only Active" : "Audio-Only"}
              </button>

              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as VideoQualityPreset)}
                aria-label="Broadcast Video Quality"
                className="h-9 px-2.5 rounded-xl border border-white/15 bg-[#091529] text-xs font-semibold text-white"
              >
                <option value="low">Data Saver 240p</option>
                <option value="medium">Balanced 360p</option>
                <option value="high">HD 720p</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStageMode("slide")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  snapshot?.screenShare.type === "slide"
                    ? "bg-[#0D9488] text-white"
                    : "bg-white/10 text-slate-200"
                }`}
              >
                <Presentation size={14} />
                Slides
              </button>
              <button
                onClick={() => handleStageMode("whiteboard")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  snapshot?.screenShare.type === "whiteboard"
                    ? "bg-[#0D9488] text-white"
                    : "bg-white/10 text-slate-200"
                }`}
              >
                <Pencil size={14} />
                Whiteboard
              </button>
              <button
                onClick={() => handleStageMode("window")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  snapshot?.screenShare.type === "window"
                    ? "bg-[#0D9488] text-white"
                    : "bg-white/10 text-slate-200"
                }`}
              >
                <Monitor size={14} />
                Share Screen
              </button>
              <button
                onClick={() => setIsAnnouncementOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#F59E0B]"
              >
                <Megaphone size={14} />
                Announce
              </button>
              <button
                onClick={() => setIsNovaOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D9488]/20 hover:bg-[#0D9488]/30 border border-[#0D9488]/40 text-xs font-bold text-teal-200"
              >
                <Sparkles size={14} />
                Nova Co-Teacher
              </button>
            </div>
          </div>

          {/* Lower Interactive Tabs */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1F3A] p-4 space-y-4">
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
              {[
                { id: "polls", label: "Live Polls" },
                { id: "qa", label: `Q&A (${snapshot?.questions.length || 0})` },
                { id: "resources", label: "Class Materials" },
                { id: "assignments", label: "Assignments" },
                { id: "notes", label: "Class Notes" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBottomTab(t.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    bottomTab === t.id
                      ? "bg-[#0D9488] text-white"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {snapshot && (
              <ClassroomTools
                tab={bottomTab}
                isTeacher
                userId={hostPeerId}
                userName={snapshot.teacherName}
                poll={snapshot.poll}
                onCreatePoll={(question, options) =>
                  act("CREATE_POLL", { question, options })
                }
                questions={snapshot.questions}
                onAnswerQuestion={(questionId, answer) =>
                  act("ANSWER_QUESTION", { questionId, answer })
                }
                assignment={snapshot.assignment}
                resources={snapshot.resources}
                onShareResource={(title, size) =>
                  act("SHARE_MATERIAL", { title, size })
                }
                classNotes={snapshot.classNotes}
                onUpdateNotes={(notes) => act("UPDATE_NOTES", { notes })}
                onAskNova={() => setIsNovaOpen(true)}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Avatar Student Roster + Raised Hands + Live Chat + Attendance */}
        <aside className="rounded-2xl border border-white/10 bg-[#0B1F3A] flex flex-col h-[720px] overflow-hidden">
          <div className="p-3 border-b border-white/10 grid grid-cols-3 gap-1 bg-[#091529]">
            <button
              onClick={() => setRightTab("roster")}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                rightTab === "roster" ? "bg-[#0D9488] text-white" : "text-slate-300"
              }`}
            >
              <Users size={13} />
              Students ({participants.length})
            </button>
            <button
              onClick={() => setRightTab("chat")}
              className={`py-2 rounded-lg text-xs font-bold ${
                rightTab === "chat" ? "bg-[#0D9488] text-white" : "text-slate-300"
              }`}
            >
              Chat ({snapshot?.messages.length || 0})
            </button>
            <button
              onClick={() => setRightTab("attendance")}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                rightTab === "attendance" ? "bg-[#0D9488] text-white" : "text-slate-300"
              }`}
            >
              <ClipboardCheck size={13} />
              Register
            </button>
          </div>

          {rightTab === "roster" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              <p className="text-[11px] text-slate-400">
                Students display as compact avatars by default. Approve raised hands or invite students to unlock their mic &amp; camera on stage.
              </p>
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-[#091529] p-3 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.avatar ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/15 shrink-0">
                        <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full ${p.color} flex items-center justify-center text-xs font-extrabold text-white shrink-0`}
                      >
                        {p.initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.stageStatus === "approved"
                          ? "On Stage"
                          : p.stageStatus === "pending" || p.handRaised
                          ? "Hand Raised"
                          : p.stageStatus === "invited"
                          ? "Invited to Stage"
                          : p.audioOnly
                          ? "Audio-Only Audience"
                          : "Audience"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.stageStatus === "pending" || p.handRaised ? (
                      <>
                        <button
                          onClick={() => act("APPROVE_STAGE", { targetUserId: p.id })}
                          className="p-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white"
                          title="Approve to stage"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => act("REJECT_STAGE", { targetUserId: p.id })}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                          title="Decline request"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : p.stageStatus === "approved" ? (
                      <>
                        <button
                          onClick={() =>
                            act("MUTE_STUDENT", { targetUserId: p.id, micOn: !p.micOn })
                          }
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                          title={p.micOn ? "Mute" : "Unmute"}
                        >
                          {p.micOn ? <Mic size={13} /> : <MicOff size={13} />}
                        </button>
                        <button
                          onClick={() => act("REMOVE_STAGE", { targetUserId: p.id })}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200"
                          title="Remove from stage"
                        >
                          <UserMinus size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => act("INVITE_STAGE", { targetUserId: p.id })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#0D9488] text-[11px] font-bold text-slate-100 transition"
                        title="Invite student onto stage"
                      >
                        <UserPlus size={12} />
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rightTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {(snapshot?.messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-2.5 text-xs ${
                      msg.role === "system"
                        ? "bg-white/5 text-slate-300 text-center text-[11px]"
                        : msg.role === "teacher"
                        ? "bg-[#0D9488]/20 border border-[#0D9488]/30"
                        : "bg-[#091529] border border-white/10"
                    }`}
                  >
                    {msg.role !== "system" && (
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-bold text-teal-300">{msg.sender}</span>
                        <span className="text-slate-400 tabular-nums">{msg.timestamp}</span>
                      </div>
                    )}
                    <p className="text-slate-100 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  act("SEND_CHAT", {
                    userId: hostPeerId,
                    sender: snapshot?.teacherName || user?.fullName || "Instructor",
                    text: chatInput,
                    important: true,
                  });
                  setChatInput("");
                }}
                className="p-3 border-t border-white/10 flex gap-2 bg-[#091529]"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message your class..."
                  className="flex-1 h-9 px-3 rounded-xl border border-white/15 bg-[#060E1B] text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white inline-flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}

          {rightTab === "attendance" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
              <p className="text-[11px] text-slate-400">
                Live session check-in times (Africa/Lagos WAT):
              </p>
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-white/10"
                >
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-teal-300 font-mono tabular-nums">
                    Present · {p.joinedAt}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Broadcast Announcement Modal */}
      {isAnnouncementOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await act("SEND_ANNOUNCEMENT", {
                title: "Teacher Announcement",
                message: announcementText,
              });
              setIsAnnouncementOpen(false);
              setAnnouncementText("");
            }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-[#0B1F3A] p-6 space-y-4"
          >
            <h3 className="text-base font-extrabold">Broadcast Classroom Announcement</h3>
            <textarea
              rows={3}
              required
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Copy formula 2 into your notebooks before our WAEC drill!"
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 text-xs text-[#0B1F3A]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAnnouncementOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold"
              >
                Pin to Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* End Class Confirmation Modal */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white text-[#0B1F3A] p-6 space-y-4">
            <h3 className="text-base font-extrabold">End Live Classroom?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will end the live broadcast for all connected students and lock the stage.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Stay in Class
              </button>
              <button
                onClick={handleEndClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                End Class for All
              </button>
            </div>
          </div>
        </div>
      )}

      <NovaClassAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        subject={snapshot?.subject}
        topic={snapshot?.topic}
        isTeacher
      />
    </div>
  );
}

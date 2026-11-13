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
  Hand,
  PhoneOff,
  Send,
  Sparkles,
  Users,
  Wifi,
  Lock,
  Radio,
  Megaphone,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  ClassroomSnapshot,
  classroomSync,
  StageStatus,
  VideoQualityPreset,
} from "@/lib/classroomSync";
import { webrtcManager } from "@/lib/webrtcManager";
import PresentationStage from "./PresentationStage";
import ClassroomTools from "./ClassroomTools";
import NovaClassAssistantModal from "./NovaClassAssistantModal";

export default function StudentLiveClassroom({ classId = "math-001" }: { classId?: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const studentId = useMemo(
    () => `student-${user?.id || "guest-" + classId}`,
    [user?.id, classId]
  );
  const studentName = user?.fullName || "Chukwudi Ubani";

  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  const [teacherStream, setTeacherStream] = useState<MediaStream | null>(null);
  const [localStageStream, setLocalStageStream] = useState<MediaStream | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [quality, setQuality] = useState<VideoQualityPreset>("low");
  const [connectionState, setConnectionState] = useState<"connecting" | "connected">("connecting");

  const [stageBanner, setStageBanner] = useState<string | null>(null);
  const [activeToolTab, setActiveToolTab] = useState<
    "polls" | "qa" | "resources" | "assignments" | "notes"
  >("resources");
  const [chatInput, setChatInput] = useState("");
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [novaPrompt, setNovaPrompt] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const localPreviewRef = useRef<HTMLVideoElement | null>(null);
  const teacherVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevStageRef = useRef<StageStatus>("audience");
  const prevHandRef = useRef<boolean>(false);
  const seqRef = useRef(0);

  const syncFromServer = useCallback(async () => {
    const res = await classroomSync.fetchSnapshot(classId, studentId, seqRef.current);
    if (!res) return;
    setConnectionState("connected");
    seqRef.current = res.latestSeq;
    setSnapshot(res.snapshot);

    for (const sig of res.signals) {
      await webrtcManager.handleSignal(
        classId,
        studentId,
        "STUDENT",
        sig.fromPeerId,
        sig.kind,
        sig.payload,
        (stream) => {
          setTeacherStream(stream);
        }
      );
    }
  }, [classId, studentId]);

  useEffect(() => {
    classroomSync.init(classId);

    const join = async () => {
      await classroomSync.dispatchAction(classId, "JOIN_ROOM", {
        userId: studentId,
        name: studentName,
        role: "STUDENT",
        actorRole: "STUDENT",
        audioOnly: false,
      });
      await syncFromServer();
    };
    join();

    const unsub = classroomSync.subscribe(({ type }) => {
      if (type === "SNAPSHOT_UPDATED") {
        syncFromServer();
      }
    });

    const pollTimer = setInterval(syncFromServer, 2000);
    return () => {
      unsub();
      clearInterval(pollTimer);
      webrtcManager.closeAll();
      classroomSync.dispatchAction(classId, "LEAVE_ROOM", {
        userId: studentId,
        actorRole: "STUDENT",
      });
    };
  }, [classId, studentId, studentName, syncFromServer]);

  const selfParticipant = useMemo(
    () => snapshot?.participants.find((p) => p.id === studentId),
    [snapshot?.participants, studentId]
  );

  const stageStatus: StageStatus = selfParticipant?.stageStatus || "audience";
  const isHandRaised = Boolean(selfParticipant?.handRaised);
  const isOnStage = stageStatus === "approved";

  // React to teacher stage permission changes & acquire/release student media strictly
  useEffect(() => {
    const prevStage = prevStageRef.current;
    const prevHand = prevHandRef.current;

    if (prevStage !== "approved" && stageStatus === "approved") {
      setStageBanner("Teacher approved you onto the stage — Mic & Camera are now unlocked.");
      webrtcManager
        .startLocalMedia(!audioOnly, true, quality)
        .then((res) => {
          if (res.stream) setLocalStageStream(res.stream);
        });
    } else if (prevStage === "pending" && prevHand && stageStatus === "audience" && !isHandRaised) {
      setStageBanner("Your raised-hand request was declined or cleared by the teacher.");
    } else if (prevStage === "approved" && stageStatus !== "approved") {
      setStageBanner("You were returned to the audience by the teacher.");
      webrtcManager.closeAll();
      setLocalStageStream(null);
    }

    prevStageRef.current = stageStatus;
    prevHandRef.current = isHandRaised;
  }, [stageStatus, isHandRaised, audioOnly, quality]);

  useEffect(() => {
    if (localPreviewRef.current && localStageStream) {
      localPreviewRef.current.srcObject = localStageStream;
    }
  }, [localStageStream]);

  useEffect(() => {
    if (teacherVideoRef.current && teacherStream) {
      teacherVideoRef.current.srcObject = teacherStream;
    }
  }, [teacherStream]);

  useEffect(() => {
    if (!snapshot?.startedAt || snapshot.sessionStatus !== "live") return;
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - snapshot.startedAt!) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [snapshot?.startedAt, snapshot?.sessionStatus]);

  const act = async (action: string, payload: Record<string, any> = {}) => {
    const next = await classroomSync.dispatchAction(classId, action, {
      actorRole: "STUDENT",
      userId: studentId,
      ...payload,
    });
    if (next) setSnapshot(next);
  };

  const handleToggleHand = async () => {
    if (isHandRaised) {
      await act("LOWER_HAND");
      setStageBanner("Hand lowered.");
    } else {
      await act("RAISE_HAND");
      setStageBanner("Hand raised — waiting for teacher approval to speak.");
    }
  };

  const handleToggleMic = async () => {
    if (!isOnStage) return;
    const nextMic = !selfParticipant?.micOn;
    webrtcManager.toggleMute(!nextMic);
    await act("TOGGLE_STUDENT_MEDIA", { micOn: nextMic });
  };

  const handleToggleCam = async () => {
    if (!isOnStage || audioOnly) return;
    const nextCam = !selfParticipant?.videoOn;
    webrtcManager.toggleVideo(!nextCam);
    await act("TOGGLE_STUDENT_MEDIA", { videoOn: nextCam });
  };

  const handleToggleAudioOnly = async () => {
    const next = !audioOnly;
    setAudioOnly(next);
    await act("TOGGLE_STUDENT_MEDIA", { audioOnly: next, videoOn: next ? false : selfParticipant?.videoOn });
  };

  const handleLeave = async () => {
    await act("LEAVE_ROOM");
    webrtcManager.closeAll();
    router.push("/live-classes");
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stageGuests = (snapshot?.participants || []).filter(
    (p) => p.stageStatus === "approved"
  );
  const audiencePeers = (snapshot?.participants || []).filter(
    (p) => p.stageStatus !== "approved"
  );

  // Ended Class State
  if (snapshot?.sessionStatus === "ended") {
    return (
      <div className="min-h-screen bg-[#060E1B] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/15 bg-[#0B1F3A] p-8 text-center space-y-4">
          <CheckCircle2 size={36} className="mx-auto text-[#0D9488]" />
          <h1 className="text-xl font-extrabold">Class Ended by Teacher</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {snapshot.teacherName} has ended {snapshot.title}. Saved class notes remain accessible inside your Notebook.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/live-classes"
              className="w-full py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold"
            >
              Return to Live Classes
            </Link>
            <Link
              href="/notebook"
              className="w-full py-2.5 rounded-xl border border-white/15 text-xs font-bold text-slate-200"
            >
              Open Study Notebook
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E1B] text-white flex flex-col">
      {/* Clean Student Header */}
      <header className="h-16 border-b border-white/10 bg-[#0B1F3A] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/live-classes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            Classes
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold truncate">
              {snapshot?.title || "Student Live Classroom"}
            </h1>
            <p className="text-[11px] text-teal-300 truncate">
              {snapshot?.teacherName || "Instructor"} · {snapshot?.classLevel || "SSS 2"} · {snapshot?.timeWat || "WAT"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums inline-flex items-center gap-1.5 ${
              snapshot?.sessionStatus === "live"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border border-amber-500/30 text-amber-300"
            }`}
          >
            <Radio size={12} />
            {snapshot?.sessionStatus === "live"
              ? `LIVE · ${formatDuration(elapsedSeconds)}`
              : "Waiting for Teacher"}
          </span>

          <span className="hidden sm:inline-block text-[11px] text-slate-300 font-semibold">
            {connectionState === "connected" ? "Synced" : "Connecting..."}
          </span>
        </div>
      </header>

      {/* Pinned Announcement / Invite / Stage Permission Feedback */}
      {(snapshot?.announcement || stageStatus === "invited" || stageBanner) && (
        <div className="px-4 sm:px-6 pt-3 space-y-2">
          {snapshot?.announcement && (
            <div className="rounded-xl border border-teal-500/30 bg-[#0D9488]/15 px-4 py-2.5 flex items-center gap-2.5 text-xs">
              <Megaphone size={15} className="text-teal-300 shrink-0" />
              <p className="text-slate-100">
                <strong className="text-white">{snapshot.announcement.title}:</strong>{" "}
                {snapshot.announcement.message}
              </p>
            </div>
          )}

          {stageStatus === "invited" && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-100">
                Your teacher invited you to speak on the live stage.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => act("ACCEPT_INVITE")}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold"
                >
                  Accept &amp; Unlock Mic
                </button>
                <button
                  onClick={() => act("LOWER_HAND")}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 font-bold"
                >
                  Stay in Audience
                </button>
              </div>
            </div>
          )}

          {stageBanner && (
            <div className="rounded-xl border border-white/15 bg-[#0B1F3A] px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-200">
              <span>{stageBanner}</span>
              <button onClick={() => setStageBanner(null)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Classroom Grid */}
      <div className="flex-1 p-4 sm:p-6 grid lg:grid-cols-[1.55fr_0.9fr] gap-5 items-start">
        {/* LEFT: Teacher Video + Presentation Stage + Student Controls + Tools */}
        <div className="space-y-4">
          {snapshot?.sessionStatus === "waiting" ? (
            <div className="rounded-2xl border border-white/15 bg-[#0B1F3A] p-8 text-center space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Classroom Waiting Lobby
              </p>
              <h2 className="text-xl font-extrabold">
                Waiting for {snapshot.teacherName} to start the lesson
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                You can review shared materials and prepare your notes below. The teacher&apos;s video and presentation will start automatically once live.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-[0.42fr_1fr] gap-4 items-stretch">
              {/* Prominent Teacher Video + Stage Guests */}
              <div className="space-y-3 flex flex-col">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0B1F3A] aspect-[4/3] shadow-sm">
                  {teacherStream && !audioOnly && snapshot?.hostVideoOn && !snapshot?.hostAudioOnly ? (
                    <video
                      ref={teacherVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={snapshot?.hostPoster || "/images/teacher-live-poster.jpg"}
                      alt={snapshot?.teacherName || "Teacher"}
                      fill
                      className="object-cover opacity-90"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white leading-tight">
                        {snapshot?.teacherName || "Mrs. Funke Adewale"}
                      </p>
                      <p className="text-[11px] text-teal-300">
                        {audioOnly
                          ? "Data Saver Audio-Only"
                          : snapshot?.hostAudioOnly || !snapshot?.hostVideoOn
                          ? "Teacher Audio Active"
                          : "Teacher · Live Video"}
                      </p>
                    </div>
                    {snapshot?.hostMicOn === false && (
                      <span className="p-1.5 rounded-md bg-rose-600/80 text-white">
                        <MicOff size={12} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Stage-Approved Students Only */}
                {stageGuests.length > 0 && (
                  <div className="space-y-2">
                    {stageGuests.map((guest) => {
                      const isSelf = guest.id === studentId;
                      return (
                        <div
                          key={guest.id}
                          className="rounded-xl border border-[#0D9488] bg-[#0B1F3A] p-3 flex items-center justify-between gap-3"
                        >
                          {isSelf && localStageStream && guest.videoOn && !audioOnly ? (
                            <div className="w-full space-y-2">
                              <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                                <video
                                  ref={localPreviewRef}
                                  autoPlay
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-[11px] font-bold text-teal-300">
                                {guest.name} (You · On Stage)
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center text-xs font-bold shrink-0">
                                  {guest.initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {guest.name} {isSelf ? "(You)" : ""}
                                  </p>
                                  <p className="text-[11px] text-teal-300">On Stage</p>
                                </div>
                              </div>
                              {guest.micOn ? (
                                <Mic size={14} className="text-emerald-400 shrink-0" />
                              ) : (
                                <MicOff size={14} className="text-slate-400 shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Compact Peers Avatar Strip */}
                <div className="rounded-2xl border border-white/10 bg-[#0B1F3A]/80 p-3.5 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Users size={13} className="text-[#0D9488]" />
                      Classmates ({audiencePeers.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Audience</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {audiencePeers.slice(0, 8).map((peer) => (
                      <div
                        key={peer.id}
                        title={peer.name}
                        className="flex items-center gap-1.5 rounded-lg bg-[#091529] border border-white/10 px-2 py-1 text-[11px]"
                      >
                        <span
                          className={`w-5 h-5 rounded-full ${peer.color} flex items-center justify-center font-bold text-[10px]`}
                        >
                          {peer.initials}
                        </span>
                        <span className="text-slate-200 max-w-[85px] truncate">{peer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Teacher Presentation / Screen Share / Whiteboard */}
              <PresentationStage
                classId={classId}
                subject={snapshot?.subject}
                type={snapshot?.screenShare.type || "slide"}
                slideIndex={snapshot?.screenShare.slideIndex || 0}
                screenStream={null}
                whiteboardStrokes={snapshot?.whiteboardStrokes || []}
                isTeacher={false}
                onAskNova={() => {
                  setNovaPrompt(`Explain the current ${snapshot?.subject || "lesson"} slide simply.`);
                  setIsNovaOpen(true);
                }}
              />
            </div>
          )}

          {/* Student Controls Dock */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1F3A] p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleHand}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isHandRaised
                    ? "bg-[#D97706] text-white"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                <Hand size={14} />
                {isHandRaised ? "Lower Hand" : "Raise Hand"}
              </button>

              <button
                onClick={handleToggleMic}
                disabled={!isOnStage}
                title={
                  isOnStage
                    ? "Toggle your microphone"
                    : "Microphone is locked until teacher approves you onto stage"
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  !isOnStage
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/10"
                    : selfParticipant?.micOn
                    ? "bg-[#0D9488] text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {!isOnStage ? (
                  <Lock size={13} />
                ) : selfParticipant?.micOn ? (
                  <Mic size={14} />
                ) : (
                  <MicOff size={14} />
                )}
                {isOnStage ? (selfParticipant?.micOn ? "Mic On" : "Mic Muted") : "Mic Locked"}
              </button>

              <button
                onClick={handleToggleCam}
                disabled={!isOnStage || audioOnly}
                title={
                  isOnStage
                    ? "Toggle your camera"
                    : "Camera is locked until teacher approves you onto stage"
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  !isOnStage || audioOnly
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/10"
                    : selfParticipant?.videoOn
                    ? "bg-[#0D9488] text-white"
                    : "bg-white/15 text-white"
                }`}
              >
                {!isOnStage ? (
                  <Lock size={13} />
                ) : selfParticipant?.videoOn ? (
                  <Video size={14} />
                ) : (
                  <VideoOff size={14} />
                )}
                {isOnStage ? "Camera" : "Cam Locked"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleAudioOnly}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  audioOnly
                    ? "bg-[#D97706] text-white"
                    : "bg-white/10 hover:bg-white/15 text-slate-200"
                }`}
              >
                <Wifi size={14} />
                {audioOnly ? "Audio-Only Active" : "Audio-Only"}
              </button>

              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as VideoQualityPreset)}
                aria-label="Stream Quality"
                className="h-9 px-2.5 rounded-xl border border-white/15 bg-[#091529] text-xs font-semibold text-white"
              >
                <option value="low">Low Data 240p</option>
                <option value="medium">Balanced 360p</option>
                <option value="high">HD 720p</option>
              </select>

              <button
                onClick={() => setIsNovaOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D9488]/20 hover:bg-[#0D9488]/30 border border-[#0D9488]/40 text-xs font-bold text-teal-200"
              >
                <Sparkles size={14} />
                Ask Nova
              </button>

              <button
                onClick={handleLeave}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                <PhoneOff size={14} />
                Leave
              </button>
            </div>
          </div>

          {/* Interactive Student Tools */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1F3A] p-4 space-y-4">
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
              {[
                { id: "resources", label: "Resources" },
                { id: "polls", label: "Live Poll" },
                { id: "qa", label: "Q&A" },
                { id: "assignments", label: "Assignments" },
                { id: "notes", label: "My Notes" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveToolTab(t.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeToolTab === t.id
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
                tab={activeToolTab}
                isTeacher={false}
                userId={studentId}
                userName={studentName}
                poll={snapshot.poll}
                onVotePoll={(optionId) => act("VOTE_POLL", { optionId })}
                questions={snapshot.questions}
                onAskQuestion={(question) =>
                  act("ASK_QUESTION", { question, authorName: studentName })
                }
                assignment={snapshot.assignment}
                onSubmitAssignment={(text) =>
                  act("SUBMIT_ASSIGNMENT", { answerText: text })
                }
                resources={snapshot.resources}
                classNotes={snapshot.classNotes}
                onUpdateNotes={(notes) => act("UPDATE_NOTES", { notes })}
                onAskNova={(promptText) => {
                  setNovaPrompt(promptText);
                  setIsNovaOpen(true);
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Live Classroom Chat */}
        <aside className="rounded-2xl border border-white/10 bg-[#0B1F3A] flex flex-col h-[700px] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-white/10 bg-[#091529] flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Classroom Chat
            </h2>
            <span className="text-[11px] text-teal-300 tabular-nums">
              {snapshot?.messages.length || 0} messages
            </span>
          </div>

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
                    <span className="font-bold text-teal-300">
                      {msg.sender}
                      {msg.role === "teacher" ? " · Teacher" : ""}
                    </span>
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
                sender: studentName,
                text: chatInput,
              });
              setChatInput("");
            }}
            className="p-3 border-t border-white/10 flex gap-2 bg-[#091529]"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Write a message to the class..."
              className="flex-1 h-9 px-3 rounded-xl border border-white/15 bg-[#060E1B] text-xs text-white"
            />
            <button
              type="submit"
              className="px-3.5 h-9 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white inline-flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>
        </aside>
      </div>

      <NovaClassAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        initialPrompt={novaPrompt}
        subject={snapshot?.subject}
        topic={snapshot?.topic}
        isTeacher={false}
      />
    </div>
  );
}

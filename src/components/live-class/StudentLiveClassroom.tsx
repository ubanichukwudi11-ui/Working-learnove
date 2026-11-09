"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GraduationCap,
  Bell,
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MoreHorizontal,
  PhoneOff,
  Send,
  Sparkles,
  Download,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from "lucide-react";

import {
  classroomSync,
  ChatMessage,
  LivePoll,
  LiveAssignment,
  SharedResource,
} from "@/lib/classroomSync";
import { webrtcManager } from "@/lib/webrtcManager";
import PresentationStage from "./PresentationStage";
import ClassroomTools from "./ClassroomTools";
import NovaClassAssistantModal from "./NovaClassAssistantModal";

export default function StudentLiveClassroom({
  classId = "math-001",
  onSwitchToTeacherView,
}: {
  classId?: string;
  onSwitchToTeacherView?: () => void;
}) {
  const router = useRouter();

  // Media Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(23 * 60 + 17); // 00:23:17
  const [presentationType, setPresentationType] = useState<
    "slide" | "window" | "whiteboard" | "none"
  >("slide");

  // Tab state for bottom-left panel
  const [activeBottomTab, setActiveBottomTab] = useState<
    "resources" | "assignments" | "notes" | "polls"
  >("resources");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "You",
      role: "student",
      text: "This is so helpful!",
      timestamp: "10:23 AM",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: "2",
      sender: "Ms. Sarah Johnson",
      role: "teacher",
      text: "Great job!",
      timestamp: "10:24 AM",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
      important: true,
    },
    {
      id: "3",
      sender: "Sophia Kim",
      role: "student",
      text: "Can you explain the formula again?",
      timestamp: "10:26 AM",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Polls & Assignments state
  const [poll, setPoll] = useState<LivePoll | null>({
    id: "poll-1",
    question: "If a > 0 in y = ax² + bx + c, which way does the parabola open?",
    options: [
      { id: "opt-1", text: "Opens Upwards (Minimum vertex)", votes: 19 },
      { id: "opt-2", text: "Opens Downwards (Maximum vertex)", votes: 3 },
      { id: "opt-3", text: "Horizontal (Parallel to x-axis)", votes: 2 },
    ],
    totalVotes: 24,
    active: true,
    createdAt: "10:20 AM",
  });

  const [assignment] = useState<LiveAssignment>({
    id: "assign-1",
    title: "Quadratic Graphs Practice",
    description: "Plot 5 quadratic curves and calculate vertex coordinates.",
    dueDate: "Today 6:00 PM",
    totalStudents: 24,
    submittedCount: 18,
    status: "active",
  });

  const [resources] = useState<SharedResource[]>([
    {
      id: "res-1",
      title: "Quadratic Equations Notes",
      type: "pdf",
      size: "2.4 MB",
      url: "#",
    },
    {
      id: "res-2",
      title: "Formula Reference & Vertex Cheat Sheet",
      type: "pdf",
      size: "1.1 MB",
      url: "#",
    },
  ]);

  const [studentNotes, setStudentNotes] = useState(
    "Mathematics Lecture: Quadratic Equations\n• Standard Form: y = ax² + bx + c\n• If a > 0: U-shaped parabola opening upwards\n• If a < 0: Inverted parabola opening downwards\n• Vertex x-coordinate = -b / (2a)"
  );

  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [novaInitialPrompt, setNovaInitialPrompt] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Timer tick
  useEffect(() => {
    const t = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Synchronize with teacher via BroadcastChannel & Supabase Realtime
  useEffect(() => {
    classroomSync.init(classId);

    const unsubscribe = classroomSync.subscribe(({ type, payload }) => {
      if (type === "CHAT_MESSAGE") {
        setMessages((prev) => [...prev, payload]);
      } else if (type === "SCREEN_SHARE_CHANGE") {
        setPresentationType(payload.type);
      } else if (type === "POLL_CREATED") {
        setPoll(payload);
        setActiveBottomTab("polls");
      } else if (type === "POLL_VOTE") {
        setPoll((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            totalVotes: prev.totalVotes + 1,
            options: prev.options.map((opt) =>
              opt.id === payload.optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          };
        });
      } else if (type === "MUTE_PARTICIPANT") {
        if (payload.userId === "you" || payload.userId === "student-1") {
          setIsMicMuted(payload.muted);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [classId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Raise Hand toggle
  const toggleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    classroomSync.broadcast("RAISE_HAND", {
      userId: "you",
      userName: "Alex Carter",
      raised: nextState,
    });

    if (nextState) {
      classroomSync.broadcast("CHAT_MESSAGE", {
        id: Date.now().toString(),
        sender: "You",
        role: "student",
        text: "✋ Raised hand to ask a question",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  };

  // Send student chat message
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      role: "student",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
    };

    classroomSync.broadcast("CHAT_MESSAGE", newMsg);
    setChatInput("");
  };

  const handleVotePoll = (optId: string) => {
    classroomSync.broadcast("POLL_VOTE", {
      pollId: poll?.id,
      optionId: optId,
      userId: "you",
    });
  };

  const handleAskNova = (promptText: string) => {
    setNovaInitialPrompt(promptText);
    setIsNovaOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col select-none font-sans">
      {/* 1. TOP NAVBAR (Learnova logo, notifications, user avatar) */}
      <header className="px-6 py-3 border-b border-slate-800/80 bg-[#090f1d] flex items-center justify-between z-20">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/40">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Learnova
          </span>
        </Link>

        {/* View Switcher button for reviewer/evaluator */}
        <div className="flex items-center gap-4">
          {onSwitchToTeacherView && (
            <button
              onClick={onSwitchToTeacherView}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-200 text-xs font-bold transition"
            >
              <span>Teacher View</span>
              <span>→</span>
            </button>
          )}

          <div className="relative p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer transition">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </div>

          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/60 shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
              alt="You"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </header>

      {/* 2. CLASSROOM CONTAINER */}
      <div className="flex-1 p-6 max-w-[1720px] w-full mx-auto flex flex-col gap-5">
        {/* Secondary Header: Back Button + Title + Subtitle + Live Timer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/live-classes"
              className="w-10 h-10 rounded-2xl bg-[#0c1222] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  Mathematics Live Class
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Today • 10:00 AM – 11:00 AM • 24 joined
              </p>
            </div>
          </div>

          {/* Red Timer: 🔴 00:23:17 */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 bg-[#0c1222] border border-slate-800 px-3.5 py-2 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>{formatTime(timerSeconds)}</span>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: Stage & Controls on Left, Live Chat on Right */}
        <div className="grid xl:grid-cols-[1fr_360px] gap-6 flex-1 items-start">
          {/* LEFT: Participant video strip + Main Slide Stage + Controls + Bottom Cards */}
          <div className="space-y-5 flex flex-col">
            {/* Top Video Strip (You, Teacher, Sophia, Daniel, +20) */}
            <div className="flex items-center gap-3.5 overflow-x-auto py-1 no-scrollbar">
              {/* You Card (Highlighted with Purple Border) */}
              <div className="relative flex-shrink-0 w-32 h-24 rounded-2xl border-2 border-purple-500 bg-purple-950/40 p-2 flex flex-col justify-between items-center shadow-lg shadow-purple-600/10">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-400">
                  <Image
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                    alt="You"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span className="text-xs font-bold text-purple-200">You</span>
                  {!isMicMuted ? (
                    <Mic size={12} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <MicOff size={12} className="text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Ms. Sarah Johnson (Teacher) */}
              <div className="relative flex-shrink-0 w-28 h-24 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 ring-2 ring-purple-500/20">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                    alt="Ms. Sarah Johnson"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 truncate w-full">
                  Ms. Sarah...
                </span>
              </div>

              {/* Sophia Kim */}
              <div className="relative flex-shrink-0 w-28 h-24 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                  <Image
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                    alt="Sophia Kim"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 truncate w-full">
                  Sophia Kim
                </span>
              </div>

              {/* Daniel Smith */}
              <div className="relative flex-shrink-0 w-28 h-24 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Daniel Smith"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 truncate w-full">
                  Daniel Smith
                </span>
              </div>

              {/* +20 Avatar Count Pill */}
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                +20
              </div>
            </div>

            {/* Main Presentation Stage (Quadratic Equations Slide matching reference) */}
            <div className="w-full">
              <PresentationStage
                type={presentationType}
                onAskNova={() => handleAskNova("Explain this slide about Quadratic Equations")}
              />
            </div>

            {/* Quick Action Buttons Under Stage (Mute, Stop Video, Raise Hand, More, Leave) */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                {/* Mute */}
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`flex flex-col items-center gap-1 p-2 transition ${
                    isMicMuted ? "text-red-400" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      isMicMuted
                        ? "bg-red-500/20 border border-red-500/40 text-red-400"
                        : "bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-400"
                    }`}
                  >
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </div>
                  <span className="text-[11px] font-semibold">
                    {isMicMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* Stop Video */}
                <button
                  onClick={() => setIsVideoStopped(!isVideoStopped)}
                  className={`flex flex-col items-center gap-1 p-2 transition ${
                    isVideoStopped ? "text-red-400" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      isVideoStopped
                        ? "bg-red-500/20 border border-red-500/40 text-red-400"
                        : "bg-slate-900 border border-slate-800 hover:border-purple-500 text-purple-400"
                    }`}
                  >
                    {isVideoStopped ? <VideoOff size={20} /> : <Video size={20} />}
                  </div>
                  <span className="text-[11px] font-semibold">
                    {isVideoStopped ? "Start Video" : "Stop Video"}
                  </span>
                </button>

                {/* Raise Hand */}
                <button
                  onClick={toggleRaiseHand}
                  className={`flex flex-col items-center gap-1 p-2 transition ${
                    isHandRaised ? "text-emerald-400" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      isHandRaised
                        ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse"
                        : "bg-slate-900 border border-slate-800 hover:border-purple-500 text-slate-300"
                    }`}
                  >
                    <Hand size={20} />
                  </div>
                  <span className="text-[11px] font-semibold">
                    {isHandRaised ? "Hand Raised" : "Raise Hand"}
                  </span>
                </button>

                {/* More */}
                <button
                  onClick={() => setIsNovaOpen(true)}
                  className="flex flex-col items-center gap-1 p-2 text-slate-300 hover:text-white transition"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500 flex items-center justify-center text-slate-300">
                    <MoreHorizontal size={20} />
                  </div>
                  <span className="text-[11px] font-semibold">More</span>
                </button>
              </div>

              {/* Leave Button */}
              <button
                onClick={() => router.push("/live-classes")}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition active:scale-95"
              >
                <PhoneOff size={16} />
                <span>Leave</span>
              </button>
            </div>

            {/* Bottom Row: 2 Cards (Resources/Tabs on Left, Course Progress on Right) */}
            <div className="grid md:grid-cols-[1fr_240px] gap-5 items-stretch">
              {/* Bottom Left Card: Tabs (Resources, Assignments, Notes, Polls) */}
              <div className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: "resources", label: "Resources" },
                    { id: "assignments", label: "Assignments" },
                    { id: "notes", label: "Notes" },
                    { id: "polls", label: "Polls" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveBottomTab(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                        activeBottomTab === tab.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <ClassroomTools
                  tab={activeBottomTab}
                  isTeacher={false}
                  poll={poll}
                  onVotePoll={handleVotePoll}
                  assignment={assignment}
                  resources={resources}
                  classNotes={studentNotes}
                  onUpdateNotes={(n) => setStudentNotes(n)}
                  onAskNova={(p) => handleAskNova(p)}
                />
              </div>

              {/* Bottom Right Card: Your Progress (72% Course Progress Gauge) */}
              <div className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 flex flex-col items-center justify-center text-center">
                <h4 className="font-bold text-white text-xs mb-3">Your Progress</h4>

                {/* Circular SVG Gauge: 72% */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#1e293b"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - 0.72)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white">
                    72%
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  Course Progress
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Chat */}
          <div className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 flex flex-col justify-between h-full min-h-[580px]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                <h3 className="font-bold text-white text-sm">Chat</h3>
                <button
                  onClick={() => handleAskNova("What are the key points in this lecture?")}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                >
                  <Sparkles size={12} />
                  <span>Ask Nova</span>
                </button>
              </div>

              {/* Message List */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-2.5 items-start">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                      {m.avatar ? (
                        <Image src={m.avatar} alt={m.sender} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white">
                          {m.sender[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {m.sender}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md shadow-purple-600/30 transition active:scale-95 flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nova AI Modal */}
      <NovaClassAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        initialPrompt={novaInitialPrompt}
        isTeacher={false}
      />
    </div>
  );
}

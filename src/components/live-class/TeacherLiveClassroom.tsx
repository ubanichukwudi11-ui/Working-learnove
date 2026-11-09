"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Video,
  FileEdit,
  CheckCircle,
  NotebookPen,
  Calendar,
  Sparkles,
  Trophy,
  BarChart,
  MessageSquare,
  Bell,
  User,
  Settings,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Hand,
  BarChart2,
  MoreHorizontal,
  LayoutGrid,
  Check,
  Send,
  Users,
  ChevronRight,
  Pencil,
  AppWindow,
  Share2,
} from "lucide-react";

import {
  classroomSync,
  ChatMessage,
  Participant,
  LivePoll,
  LiveAssignment,
  SharedResource,
} from "@/lib/classroomSync";
import { webrtcManager } from "@/lib/webrtcManager";
import ClassroomTools from "./ClassroomTools";
import NovaClassAssistantModal from "./NovaClassAssistantModal";

export default function TeacherLiveClassroom({
  classId = "math-001",
  onSwitchToStudentView,
}: {
  classId?: string;
  onSwitchToStudentView?: () => void;
}) {
  const router = useRouter();

  // Media & WebRTC states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareSource, setScreenShareSource] = useState<
    "screen1" | "window" | "whiteboard"
  >("screen1");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(23 * 60 + 17); // 00:23:17 as in reference
  const [isRecording, setIsRecording] = useState(true);

  // Tab states for interactive tools container
  const [activeToolTab, setActiveToolTab] = useState<
    "share" | "polls" | "assignments" | "resources" | "notes"
  >("share");

  // Real-time classroom data
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "Alex Carter",
      role: "student",
      text: "Can you explain this again?",
      timestamp: "10:24 AM",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: "2",
      sender: "Ms. Sarah Johnson",
      role: "teacher",
      text: "Sure, let me show another example.",
      timestamp: "10:25 AM",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
      important: true,
    },
    {
      id: "3",
      sender: "Sophia Kim",
      role: "student",
      text: "Thank you ma'am! 🙏",
      timestamp: "10:26 AM",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "p1",
      name: "Alex Carter",
      role: "STUDENT",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      initials: "AS",
      color: "bg-blue-600",
      micOn: true,
      videoOn: true,
      handRaised: false,
      joinedAt: "10:00 AM",
    },
    {
      id: "p2",
      name: "Sophia Kim",
      role: "STUDENT",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      initials: "SK",
      color: "bg-purple-600",
      micOn: false,
      videoOn: true,
      handRaised: false,
      joinedAt: "10:01 AM",
    },
    {
      id: "p3",
      name: "Daniel Smith",
      role: "STUDENT",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      initials: "DS",
      color: "bg-amber-600",
      micOn: false,
      videoOn: true,
      handRaised: true, // Daniel has hand raised in reference image!
      joinedAt: "10:02 AM",
    },
    {
      id: "p4",
      name: "Grace Wilson",
      role: "STUDENT",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      initials: "GW",
      color: "bg-cyan-600",
      micOn: true,
      videoOn: true,
      handRaised: false,
      joinedAt: "10:04 AM",
    },
    {
      id: "p5",
      name: "James Brown",
      role: "STUDENT",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      initials: "JB",
      color: "bg-emerald-600",
      micOn: false,
      videoOn: true,
      handRaised: false,
      joinedAt: "10:05 AM",
    },
  ]);

  const [activePoll, setActivePoll] = useState<LivePoll | null>({
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

  const [activeAssignment] = useState<LiveAssignment>({
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
      title: "Parabola & Vertex Formula Cheat Sheet",
      type: "pdf",
      size: "1.1 MB",
      url: "#",
    },
  ]);

  const [classNotes, setClassNotes] = useState(
    "• Standard form: ax² + bx + c = 0\n• Discriminant D = b² - 4ac dictates number of real solutions\n• Vertex coordinates: h = -b / (2a), k = f(h)\n• Homework due by 6:00 PM today."
  );

  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [selectedStudentAction, setSelectedStudentAction] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Classroom timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync listener for cross-tab events
  useEffect(() => {
    classroomSync.init(classId);

    const unsubscribe = classroomSync.subscribe(({ type, payload }) => {
      if (type === "CHAT_MESSAGE") {
        setMessages((prev) => [...prev, payload]);
      } else if (type === "RAISE_HAND") {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === payload.userId || p.name === payload.userName
              ? { ...p, handRaised: payload.raised }
              : p
          )
        );
      } else if (type === "POLL_VOTE") {
        setActivePoll((prev) => {
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
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === payload.userId ? { ...p, micOn: !payload.muted } : p
          )
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [classId]);

  // Audio analysis subscriber
  useEffect(() => {
    const unsub = webrtcManager.onAudioLevel((level) => {
      setAudioLevel(level);
    });
    return unsub;
  }, []);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle local webcam toggle
  const toggleRealCamera = async () => {
    if (!useRealCamera) {
      const stream = await webrtcManager.startLocalMedia(true, true);
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setUseRealCamera(true);
      }
    } else {
      webrtcManager.closeAll();
      setUseRealCamera(false);
    }
  };

  // Handle Screen Share toggle
  const handleStartScreenShare = async (source: "screen1" | "window" | "whiteboard") => {
    setScreenShareSource(source);
    if (source === "window") {
      const stream = await webrtcManager.startScreenShare();
      if (stream) {
        setIsScreenSharing(true);
        classroomSync.broadcast("SCREEN_SHARE_CHANGE", {
          type: "window",
          slideTitle: "Teacher Desktop / Window",
        });
      }
    } else if (source === "whiteboard") {
      setIsScreenSharing(true);
      classroomSync.broadcast("SCREEN_SHARE_CHANGE", {
        type: "whiteboard",
        slideTitle: "Interactive Math Whiteboard",
      });
    } else {
      // Screen 1 (default Quadratic Equations slide)
      webrtcManager.stopScreenShare();
      setIsScreenSharing(true);
      classroomSync.broadcast("SCREEN_SHARE_CHANGE", {
        type: "slide",
        slideTitle: "Quadratic Equations",
      });
    }
  };

  // Chat message send handler
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "Ms. Sarah Johnson",
      role: "teacher",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
      important: true,
    };

    classroomSync.broadcast("CHAT_MESSAGE", newMsg);
    setChatInput("");
  };

  // Teacher actions on student
  const handleMuteStudent = (id: string, currentMuted: boolean) => {
    classroomSync.broadcast("MUTE_PARTICIPANT", {
      userId: id,
      muted: currentMuted,
    });
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, micOn: !currentMuted } : p))
    );
    setSelectedStudentAction(null);
  };

  const handleLowerHand = (id: string) => {
    classroomSync.broadcast("RAISE_HAND", {
      userId: id,
      raised: false,
    });
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, handRaised: false } : p))
    );
    setSelectedStudentAction(null);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sidebar navigation items matching Learnova design
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Courses", href: "/subjects", icon: BookOpen },
    { name: "Live Classes", href: "/live-classes", icon: Video, active: true },
    { name: "Assignments", href: "/dashboard", icon: FileEdit },
    { name: "Tests", href: "/dashboard", icon: CheckCircle },
    { name: "Notebook", href: "/notebook", icon: NotebookPen },
    { name: "Study Planner", href: "/dashboard", icon: Calendar },
    { name: "Nova AI", href: "/nova", icon: Sparkles },
    { name: "Achievements", href: "/dashboard", icon: Trophy },
    { name: "Leaderboard", href: "/dashboard", icon: BarChart },
    { name: "Messages", href: "/dashboard", icon: MessageSquare, badge: 3 },
    { name: "Notifications", href: "/dashboard", icon: Bell, badge: 5 },
    { name: "Profile", href: "/dashboard", icon: User },
    { name: "Settings", href: "/dashboard", icon: Settings },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070b14] text-white flex select-none font-sans"
    >
      {/* 1. LEFT NAVIGATION SIDEBAR (Teacher View) */}
      <aside className="w-56 bg-[#0c1222] border-r border-slate-800/80 flex flex-col justify-between py-5 px-3 flex-shrink-0 hidden xl:flex">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/40">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Learnova
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    item.active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Classroom View Switcher for Evaluator/Reviewer */}
        {onSwitchToStudentView && (
          <div className="p-2 bg-slate-900/80 rounded-2xl border border-purple-500/30 text-center">
            <span className="text-[10px] text-purple-300 uppercase tracking-wider block mb-1">
              Active Mode
            </span>
            <button
              onClick={onSwitchToStudentView}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow transition"
            >
              Switch to Student View
            </button>
          </div>
        )}
      </aside>

      {/* 2. MAIN CLASSROOM WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-6 py-3.5 border-b border-slate-800/80 bg-[#090f1d]/90 backdrop-blur flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link
              href="/live-classes"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Classes</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
                  Mathematics Live Class
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Today • 10:00 AM – 11:00 AM | 24 Students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Recording Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-red-400 text-xs tracking-wider">REC</span>
              <span className="font-mono text-slate-300 text-xs">{formatTime(timerSeconds)}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* End Class Button */}
            <button
              onClick={() => {
                if (confirm("End this live classroom session for all students?")) {
                  classroomSync.broadcast("CHAT_MESSAGE", {
                    id: Date.now().toString(),
                    sender: "Ms. Sarah Johnson",
                    role: "teacher",
                    text: "Class session ended by teacher. Thank you everyone!",
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    important: true,
                  });
                  router.push("/live-classes");
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-600/30 active:scale-95"
            >
              End Class
            </button>
          </div>
        </header>

        {/* Classroom Center Grid: Video & Tools on left, Sidebar (Participants & Chat) on right */}
        <div className="flex-1 p-6 grid xl:grid-cols-[1fr_360px] gap-6 max-w-[1720px] w-full mx-auto">
          {/* LEFT COLUMN: Teacher Video + Student Strip + Interactive Tools */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Main Teacher Live Video Feed */}
            <div className="relative rounded-3xl overflow-hidden bg-[#0d1527] border border-slate-800 aspect-[16/9] max-h-[460px] flex items-center justify-center shadow-2xl group">
              {useRealCamera ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                /* High-Quality Teacher Feed Image Matching Reference */
                <div className="relative w-full h-full">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop&q=80"
                    alt="Ms. Sarah Johnson"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                  {/* Subtle blackboard mathematical formula overlay */}
                  <div className="absolute top-6 right-8 pointer-events-none opacity-40 select-none hidden md:block">
                    <p className="font-serif text-3xl font-bold text-white tracking-widest drop-shadow-md">
                      a² + b² = c²
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Teacher Name Badge */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-200 text-xs font-bold shadow-lg">
                <span>👑</span>
                <span>Ms. Sarah Johnson</span>
                {audioLevel > 10 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              {/* Toggle to Real Camera if Teacher wants live webcam */}
              <button
                onClick={toggleRealCamera}
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-purple-600/90 backdrop-blur border border-slate-700/60 text-[11px] font-semibold text-slate-200 transition opacity-0 group-hover:opacity-100"
              >
                {useRealCamera ? "Show Standard Feed" : "Use Real Webcam"}
              </button>
            </div>

            {/* Student Video Strip (Directly beneath Teacher Video) */}
            <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
              {/* Alex Carter [AS] */}
              <div className="relative flex-shrink-0 w-28 h-20 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  AS
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-[10px] font-medium text-slate-300 truncate">
                    Alex Carter
                  </span>
                  <Mic size={10} className="text-emerald-400 flex-shrink-0" />
                </div>
              </div>

              {/* Sophia Kim [SK] */}
              <div className="relative flex-shrink-0 w-28 h-20 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  SK
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-[10px] font-medium text-slate-300 truncate">
                    Sophia Kim
                  </span>
                  <MicOff size={10} className="text-red-400 flex-shrink-0" />
                </div>
              </div>

              {/* Daniel Smith (Photo avatar + Raised Hand badge) */}
              <div className="relative flex-shrink-0 w-28 h-20 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 p-2 flex flex-col justify-between items-center text-center shadow-lg shadow-emerald-500/10">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-emerald-400">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Daniel Smith"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-white">
                    <Hand size={8} />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-[10px] font-bold text-emerald-300 truncate">
                    Daniel Smith
                  </span>
                  <Mic size={10} className="text-emerald-400 flex-shrink-0" />
                </div>
              </div>

              {/* Grace Wilson [GW] */}
              <div className="relative flex-shrink-0 w-28 h-20 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between items-center text-center">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                  GW
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-[10px] font-medium text-slate-300 truncate">
                    Grace Wilson
                  </span>
                  <MicOff size={10} className="text-red-400 flex-shrink-0" />
                </div>
              </div>

              {/* +19 Students Pill */}
              <button
                onClick={() => {
                  const el = document.getElementById("participants-card");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-shrink-0 w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500 flex items-center justify-center font-bold text-slate-300 hover:text-white text-sm transition"
              >
                +19
              </button>
            </div>

            {/* Interactive Tools Container (Share Screen, Polls, Assignments, Resources, Notes) */}
            <div className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 space-y-4">
              {/* Tab Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: "share", label: "Share Screen" },
                  { id: "polls", label: "Polls" },
                  { id: "assignments", label: "Assignments" },
                  { id: "resources", label: "Resources" },
                  { id: "notes", label: "Notes" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveToolTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                      activeToolTab === tab.id
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Share Screen Options (Matching Reference Image) */}
              {activeToolTab === "share" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  {/* Card 1: Screen 1 (Selected with checkmark ring) */}
                  <div
                    onClick={() => handleStartScreenShare("screen1")}
                    className={`relative p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between aspect-[4/3] ${
                      screenShareSource === "screen1"
                        ? "border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-600/10"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    {/* Checkmark badge */}
                    {screenShareSource === "screen1" && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Miniature slide representation */}
                    <div className="w-full flex-1 rounded-xl bg-white/90 p-2 text-[9px] text-slate-800 font-bold flex flex-col justify-center items-center">
                      <span className="text-[10px] text-purple-900">Learnova</span>
                      <span className="text-[8px] text-slate-600">Quadratic Equations</span>
                    </div>

                    <span className="text-xs font-semibold text-slate-300 mt-2 block text-center">
                      Screen 1
                    </span>
                  </div>

                  {/* Card 2: Window (Chrome Icon) */}
                  <div
                    onClick={() => handleStartScreenShare("window")}
                    className={`relative p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between aspect-[4/3] ${
                      screenShareSource === "window"
                        ? "border-purple-500 bg-purple-950/30"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full flex-1 rounded-xl bg-slate-800/80 flex items-center justify-center text-cyan-400">
                      <AppWindow size={28} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 mt-2 block text-center">
                      Window
                    </span>
                  </div>

                  {/* Card 3: Whiteboard (Pencil Icon) */}
                  <div
                    onClick={() => handleStartScreenShare("whiteboard")}
                    className={`relative p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between aspect-[4/3] ${
                      screenShareSource === "whiteboard"
                        ? "border-purple-500 bg-purple-950/30"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full flex-1 rounded-xl bg-slate-800/80 flex items-center justify-center text-amber-400">
                      <Pencil size={26} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 mt-2 block text-center">
                      Whiteboard
                    </span>
                  </div>

                  {/* Share Action Button */}
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={() => handleStartScreenShare(screenShareSource)}
                      className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition active:scale-95"
                    >
                      Broadcast Screen
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs 2, 3, 4, 5: Modular Tools */}
              {activeToolTab !== "share" && (
                <ClassroomTools
                  tab={activeToolTab}
                  isTeacher={true}
                  poll={activePoll}
                  onCreatePoll={(q, opts) => {
                    const newP: LivePoll = {
                      id: Date.now().toString(),
                      question: q,
                      options: opts.map((opt, i) => ({
                        id: `opt-${i}`,
                        text: opt,
                        votes: 0,
                      })),
                      totalVotes: 0,
                      active: true,
                      createdAt: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    };
                    setActivePoll(newP);
                    classroomSync.broadcast("POLL_CREATED", newP);
                  }}
                  assignment={activeAssignment}
                  resources={resources}
                  classNotes={classNotes}
                  onUpdateNotes={(n) => setClassNotes(n)}
                  onAskNova={(p) => setIsNovaOpen(true)}
                />
              )}
            </div>

            {/* Bottom Dock Control Bar (Teacher) */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="bg-[#0e1424] border border-slate-800 rounded-3xl px-4 py-2 flex items-center gap-3 shadow-xl">
                {/* Mute */}
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition ${
                    isMicMuted
                      ? "bg-red-500/20 text-red-400"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  <span className="text-[10px] font-semibold">
                    {isMicMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* Video */}
                <button
                  onClick={() => setIsVideoStopped(!isVideoStopped)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition ${
                    isVideoStopped
                      ? "bg-red-500/20 text-red-400"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {isVideoStopped ? <VideoOff size={18} /> : <Video size={18} />}
                  <span className="text-[10px] font-semibold">
                    {isVideoStopped ? "Start Video" : "Stop Video"}
                  </span>
                </button>

                {/* Share Screen (Green monitor icon) */}
                <button
                  onClick={() => setActiveToolTab("share")}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl hover:bg-slate-800 text-emerald-400 transition"
                >
                  <Monitor size={18} />
                  <span className="text-[10px] font-semibold">Share Screen</span>
                </button>

                {/* Raise Hand */}
                <button
                  onClick={() => {
                    alert("Hand-raise permissions: Enabled for all 24 students.");
                  }}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <Hand size={18} />
                  <span className="text-[10px] font-semibold">Raise Hand</span>
                </button>

                {/* Polls */}
                <button
                  onClick={() => setActiveToolTab("polls")}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <BarChart2 size={18} />
                  <span className="text-[10px] font-semibold">Polls</span>
                </button>

                {/* More */}
                <button
                  onClick={() => setIsNovaOpen(true)}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <MoreHorizontal size={18} />
                  <span className="text-[10px] font-semibold">More</span>
                </button>

                {/* Class Tools (Purple button with 4-square grid) */}
                <button
                  onClick={() => setActiveToolTab("resources")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition"
                >
                  <LayoutGrid size={15} />
                  <span>Class Tools</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Participants (24) Card + Live Chat Card */}
          <div className="space-y-4 flex flex-col">
            {/* 1. PARTICIPANTS (24) CARD */}
            <div
              id="participants-card"
              className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">
                  Participants ({participants.length + 19})
                </h3>
                <button
                  onClick={() =>
                    alert("Full participant roster: 24 active students connected via WebRTC.")
                  }
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>See all</span>
                  <span>→</span>
                </button>
              </div>

              {/* Participant List */}
              <div className="space-y-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/60 transition group cursor-pointer"
                    onClick={() =>
                      setSelectedStudentAction(selectedStudentAction === p.id ? null : p.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                        {p.avatar ? (
                          <Image
                            src={p.avatar}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                            {p.initials}
                          </div>
                        )}
                        {p.handRaised && (
                          <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[8px] text-white">
                            ✋
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                          {p.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          (Student) {p.handRaised && "• Hand Raised"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      {p.micOn ? (
                        <Mic size={14} className="text-emerald-400" />
                      ) : (
                        <MicOff size={14} className="text-red-400" />
                      )}
                      <Video size={14} className="text-slate-300" />
                    </div>
                  </div>
                ))}

                {/* +19 More Button */}
                <button
                  onClick={() =>
                    alert("Displaying all 24 connected students in this classroom.")
                  }
                  className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition text-center"
                >
                  + 19 more
                </button>
              </div>

              {/* Student Action Popup if Teacher clicks a participant */}
              {selectedStudentAction && (
                <div className="mt-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                  <span className="text-purple-200">Teacher Control</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMuteStudent(selectedStudentAction, true)}
                      className="px-2.5 py-1 bg-red-600 rounded-lg text-[11px] font-bold"
                    >
                      Mute Audio
                    </button>
                    <button
                      onClick={() => handleLowerHand(selectedStudentAction)}
                      className="px-2.5 py-1 bg-slate-800 rounded-lg text-[11px]"
                    >
                      Lower Hand
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. LIVE CHAT CARD */}
            <div className="rounded-3xl bg-[#0c1222] border border-slate-800 p-5 flex-1 flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                  <h3 className="font-bold text-white text-sm">Live Chat</h3>
                  <button
                    onClick={() => setIsNovaOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                  >
                    <Sparkles size={12} />
                    <span>Nova AI</span>
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1 no-scrollbar">
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

              {/* Chat Input Bar */}
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
      </div>

      {/* Nova AI Modal */}
      <NovaClassAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        isTeacher={true}
      />
    </div>
  );
}

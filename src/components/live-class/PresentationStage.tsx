"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Maximize2,
  Minimize2,
  Pencil,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
} from "lucide-react";

interface PresentationStageProps {
  type: "slide" | "window" | "whiteboard" | "none";
  screenStream?: MediaStream | null;
  isTeacher?: boolean;
  onAskNova?: () => void;
}

export default function PresentationStage({
  type,
  screenStream,
  isTeacher = false,
  onAskNova,
}: PresentationStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#6366f1");
  const [penSize, setPenSize] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Attach live screen share stream if active
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, type]);

  // Whiteboard drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

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

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden bg-white text-slate-900 shadow-2xl flex flex-col justify-between aspect-[16/9] min-h-[360px] md:min-h-[440px] select-none"
    >
      {/* Background Graphic Flare (Purple organic gradient wave) */}
      <div className="absolute top-0 right-0 w-[55%] h-full pointer-events-none opacity-90 overflow-hidden">
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M 120 0 Q 30 180 180 320 T 500 500 L 500 0 Z"
            fill="url(#purpleGrad)"
            opacity="0.15"
          />
          <path
            d="M 220 0 Q 140 220 280 380 T 500 500 L 500 0 Z"
            fill="url(#purpleGradLight)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="purpleGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#e9d5ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Slide Header */}
      <div className="relative z-10 px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
            <GraduationCap size={20} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Learnova
          </span>
        </div>

        {/* Stage controls */}
        <div className="flex items-center gap-2">
          {onAskNova && (
            <button
              onClick={onAskNova}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold transition"
            >
              <Sparkles size={14} />
              <span>Explain Slide</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {type === "window" && screenStream ? (
        <div className="relative z-10 w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      ) : type === "whiteboard" ? (
        <div className="relative z-10 w-full flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Interactive Math Whiteboard
            </span>
            <div className="flex items-center gap-2">
              {["#6366f1", "#ef4444", "#10b981", "#0f172a"].map((color) => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    penColor === color ? "scale-125 ring-2 ring-purple-400" : ""
                  }`}
                />
              ))}
              <button
                onClick={clearWhiteboard}
                className="ml-2 flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded-lg"
              >
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={900}
            height={420}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full rounded-2xl bg-slate-50/50 border border-slate-200 cursor-crosshair touch-none"
          />
        </div>
      ) : (
        /* Default Slide: Quadratic Equations */
        <div className="relative z-10 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 flex-1">
          {/* Left: Titles & Tag */}
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl md:text-5xl font-black text-[#1e1b4b] tracking-tight leading-tight">
              Quadratic<br />Equations
            </h1>

            <p className="text-slate-600 font-medium text-base md:text-lg">
              Solving, Graphing and Applications
            </p>

            <div>
              <span className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs tracking-wide shadow-md shadow-purple-600/30">
                Learn. Practice. Excel.
              </span>
            </div>
          </div>

          {/* Right: Coordinate Graph with Parabola Curve */}
          <div className="relative flex-1 max-w-[420px] aspect-[4/3] flex items-center justify-center">
            <svg
              viewBox="0 0 400 320"
              className="w-full h-full drop-shadow-md"
            >
              {/* Grid Lines */}
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                </pattern>
                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" />
                </marker>
              </defs>

              <rect width="400" height="320" fill="url(#grid)" opacity="0.8" />

              {/* Y Axis */}
              <line
                x1="200"
                y1="280"
                x2="200"
                y2="30"
                stroke="#1e293b"
                strokeWidth="2.5"
                markerEnd="url(#arrow)"
              />
              <text x="206" y="26" fontSize="14" fontWeight="bold" fill="#0f172a">
                y
              </text>

              {/* X Axis */}
              <line
                x1="40"
                y1="190"
                x2="360"
                y2="190"
                stroke="#1e293b"
                strokeWidth="2.5"
                markerEnd="url(#arrow)"
              />
              <text x="368" y="195" fontSize="14" fontWeight="bold" fill="#0f172a">
                x
              </text>

              {/* Tick Marks on X and Y */}
              {[-3, -2, -1, 1, 2, 3].map((n) => (
                <g key={n}>
                  <line
                    x1={200 + n * 40}
                    y1="187"
                    x2={200 + n * 40}
                    y2="193"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                </g>
              ))}

              {/* Parabola Curve: y = a*(x-h)^2 + k -> apex at (200, 240) opening up */}
              <path
                d="M 80 40 Q 200 310 320 40"
                fill="none"
                stroke="url(#curveGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Vertex Point */}
              <circle cx="200" cy="175" r="5" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Formula badge below graph */}
            <div className="absolute bottom-2 bg-slate-900 text-white font-mono font-bold text-xs md:text-sm px-4 py-1.5 rounded-xl shadow-lg border border-slate-700/60 tracking-wider">
              ax² + bx + c = 0
            </div>
          </div>
        </div>
      )}

      {/* Subtle Bottom Accent Strip */}
      <div className="relative z-10 px-8 pb-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Topic: Quadratic Graphs & Parabolas</span>
        <span>Slide 1 of 8</span>
      </div>
    </div>
  );
}

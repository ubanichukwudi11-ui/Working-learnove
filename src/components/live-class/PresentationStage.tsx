"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { DEFAULT_SLIDES_BY_ID, SlideItem } from "@/lib/liveClasses";
import { WhiteboardStroke } from "@/lib/classroomSync";

interface PresentationStageProps {
  classId: string;
  subject?: string;
  type: "slide" | "window" | "whiteboard";
  slideIndex: number;
  screenStream?: MediaStream | null;
  whiteboardStrokes?: WhiteboardStroke[];
  isTeacher?: boolean;
  onChangeSlide?: (nextIndex: number) => void;
  onAddStroke?: (stroke: WhiteboardStroke) => void;
  onClearWhiteboard?: () => void;
  onAskNova?: () => void;
}

export default function PresentationStage({
  classId,
  subject = "Mathematics",
  type,
  slideIndex,
  screenStream,
  whiteboardStrokes = [],
  isTeacher = false,
  onChangeSlide,
  onAddStroke,
  onClearWhiteboard,
  onAskNova,
}: PresentationStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#0B1F3A");
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: SlideItem[] =
    DEFAULT_SLIDES_BY_ID[classId] || DEFAULT_SLIDES_BY_ID["math-001"];
  const safeIndex = Math.min(Math.max(slideIndex, 0), slides.length - 1);
  const currentSlide = slides[safeIndex];

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, type]);

  // Redraw synced whiteboard strokes whenever updated
  useEffect(() => {
    if (type !== "whiteboard" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of whiteboardStrokes) {
      if (!stroke.points.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [whiteboardStrokes, type]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pt = getCanvasPoint(e);
    currentStrokeRef.current = [pt];
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacher) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pt = getCanvasPoint(e);
    currentStrokeRef.current.push(pt);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (isTeacher && currentStrokeRef.current.length > 1 && onAddStroke) {
      onAddStroke({
        id: `stroke-${Date.now()}`,
        color: penColor,
        width: 3,
        points: currentStrokeRef.current,
      });
    }
    currentStrokeRef.current = [];
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
      className="relative w-full rounded-2xl overflow-hidden bg-white text-[#0B1F3A] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[340px] lg:min-h-[420px]"
    >
      {/* Top Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-[#FAF8F3] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-[#F59E0B]">
            <GraduationCap size={17} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#0B1F3A] block leading-tight">
              {subject} Classroom Stage
            </span>
            <span className="text-[11px] text-slate-500">
              {type === "window"
                ? "Live Shared Screen"
                : type === "whiteboard"
                ? "Synced Class Whiteboard"
                : `Slide ${safeIndex + 1} of ${slides.length}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {type === "slide" && isTeacher && onChangeSlide && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={() => onChangeSlide(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-[#0B1F3A]"
                title="Previous slide"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => onChangeSlide(Math.min(slides.length - 1, safeIndex + 1))}
                disabled={safeIndex === slides.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-[#0B1F3A]"
                title="Next slide"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {onAskNova && (
            <button
              onClick={onAskNova}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] text-xs font-bold transition whitespace-nowrap"
            >
              <Sparkles size={13} />
              Ask Nova
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {type === "window" ? (
        screenStream ? (
          <div className="w-full flex-1 flex items-center justify-center bg-[#060E1B] min-h-[260px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full max-h-[380px] object-contain"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F7F8FA]">
            <Monitor size={34} className="text-[#0D9488] mb-3" />
            <p className="text-sm font-bold text-[#0B1F3A]">
              {isTeacher ? "Screen sharing preview ready" : "Teacher switched to Screen Share mode"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              {isTeacher
                ? "Select Share Screen below to broadcast a browser tab, document, or past-question PDF."
                : "Your teacher's shared screen stream appears here whenever screen sharing is active."}
            </p>
          </div>
        )
      ) : type === "whiteboard" ? (
        <div className="w-full flex-1 flex flex-col p-4 bg-[#F7F8FA]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isTeacher
                ? "Draw below — strokes sync automatically to students"
                : "Read-only live board from your teacher"}
            </span>
            {isTeacher && (
              <div className="flex items-center gap-2">
                {["#0B1F3A", "#0D9488", "#D97706", "#DC2626"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      penColor === color ? "scale-125 ring-2 ring-[#0D9488]" : ""
                    }`}
                  />
                ))}
                <button
                  onClick={() => onClearWhiteboard?.()}
                  className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              </div>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={900}
            height={360}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`w-full flex-1 rounded-xl bg-white border border-slate-200 touch-none ${
              isTeacher ? "cursor-crosshair" : "cursor-default"
            }`}
          />
        </div>
      ) : (
        /* Curriculum Presentation Slide */
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div className="grid md:grid-cols-[1.2fr_0.9fr] gap-6 items-center my-auto">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">
                  {subject} · Term 2 Lesson Deck
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1 leading-tight">
                  {currentSlide.title}
                </h2>
                <p className="text-sm text-slate-600 mt-1">{currentSlide.subtitle}</p>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {currentSlide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-[#0D9488] mt-0.5">
                      0{i + 1}.
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {currentSlide.formula && (
                <div className="inline-block rounded-xl bg-[#0B1F3A] text-white font-mono font-bold text-xs sm:text-sm px-4 py-2.5">
                  {currentSlide.formula}
                </div>
              )}
            </div>

            {/* Clean Coordinate / Concept Diagram */}
            <div className="rounded-xl border border-slate-200 bg-[#FAF8F3] p-4 flex items-center justify-center">
              <svg viewBox="0 0 360 250" className="w-full max-w-[320px] h-auto">
                <line x1="180" y1="220" x2="180" y2="20" stroke="#0B1F3A" strokeWidth="2" />
                <line x1="30" y1="155" x2="330" y2="155" stroke="#0B1F3A" strokeWidth="2" />
                <text x="188" y="28" fontSize="12" fontWeight="bold" fill="#0B1F3A">y</text>
                <text x="322" y="148" fontSize="12" fontWeight="bold" fill="#0B1F3A">x</text>
                <path
                  d="M 65 30 Q 180 260 295 30"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="180" cy="145" r="5" fill="#D97706" stroke="#ffffff" strokeWidth="2" />
                <text x="190" y="144" fontSize="11" fontWeight="bold" fill="#0B1F3A">
                  Vertex
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Footer Strip */}
      <div className="px-5 py-2.5 border-t border-slate-200 bg-[#FAF8F3] flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>2025/2026 Session · Second Term</span>
        <span className="tabular-nums">
          {type === "slide" ? `Slide ${safeIndex + 1} / ${slides.length}` : "Live Classroom Stage"}
        </span>
      </div>
    </div>
  );
}

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
  const [penColor, setPenColor] = useState("#0B1230");
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
      className="relative w-full rounded-2xl overflow-hidden bg-white text-[#0B1230] border border-[#E4E1F5] shadow-sm flex flex-col justify-between min-h-[340px] lg:min-h-[420px]"
    >
      {/* Top Bar */}
      <div className="px-5 py-3.5 border-b border-[#E4E1F5] bg-[#FAF8FF] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shrink-0">
            <GraduationCap size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-[#0B1230] block leading-tight truncate">
              {subject} Classroom Stage
            </span>
            <span className="text-[11px] text-[#4A5073] block truncate">
              {type === "window"
                ? "Live Shared Screen"
                : type === "whiteboard"
                ? "Synced Class Whiteboard"
                : `Slide ${safeIndex + 1} of ${slides.length}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {type === "slide" && isTeacher && onChangeSlide && (
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={() => onChangeSlide(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="p-1.5 rounded-lg border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] disabled:opacity-40 text-[#0B1230] transition"
                title="Previous slide"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => onChangeSlide(Math.min(slides.length - 1, safeIndex + 1))}
                disabled={safeIndex === slides.length - 1}
                className="p-1.5 rounded-lg border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] disabled:opacity-40 text-[#0B1230] transition"
                title="Next slide"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {onAskNova && (
            <button
              onClick={onAskNova}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DCD7F5] text-[#6D28D9] text-xs font-bold transition whitespace-nowrap"
            >
              <Sparkles size={13} />
              Ask Nova
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] text-[#4A5073] transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {type === "window" ? (
        screenStream ? (
          <div className="w-full flex-1 flex items-center justify-center bg-[#070D24] min-h-[260px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full max-h-[380px] object-contain"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5F4FB]">
            <Monitor size={34} className="text-[#4F46E5] mb-3" />
            <p className="text-sm font-bold text-[#0B1230]">
              {isTeacher ? "Screen sharing preview ready" : "Teacher switched to Screen Share mode"}
            </p>
            <p className="text-xs text-[#4A5073] mt-1 max-w-md">
              {isTeacher
                ? "Select Share Screen below to broadcast a browser tab, document, or past-question PDF."
                : "Your teacher's shared screen stream appears here whenever screen sharing is active."}
            </p>
          </div>
        )
      ) : type === "whiteboard" ? (
        <div className="w-full flex-1 flex flex-col p-4 bg-[#F5F4FB]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-[#4A5073]">
              {isTeacher
                ? "Draw below — strokes sync automatically to students"
                : "Read-only live board from your teacher"}
            </span>
            {isTeacher && (
              <div className="flex items-center gap-2">
                {["#0B1230", "#4F46E5", "#7C3AED", "#0891B2", "#DC2626"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      penColor === color ? "scale-125 ring-2 ring-[#7C3AED]" : ""
                    }`}
                  />
                ))}
                <button
                  onClick={() => onClearWhiteboard?.()}
                  className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-[#0B1230] px-2.5 py-1 rounded-lg border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF]"
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
            className={`w-full flex-1 rounded-xl bg-white border border-[#E4E1F5] touch-none ${
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
                <p className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                  {subject} · Term 2 Lesson Deck
                </p>
                <h2 className="landing-display text-2xl sm:text-3xl font-extrabold text-[#0B1230] mt-1 leading-tight">
                  {currentSlide.title}
                </h2>
                <p className="text-sm text-[#4A5073] mt-1">{currentSlide.subtitle}</p>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-[#323859]">
                {currentSlide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-[#4F46E5] mt-0.5 tabular-nums">
                      0{i + 1}.
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {currentSlide.formula && (
                <div className="inline-block rounded-xl bg-[#0B1230] text-white font-mono font-bold text-xs sm:text-sm px-4 py-2.5">
                  {currentSlide.formula}
                </div>
              )}
            </div>

            {/* Clean Coordinate / Concept Diagram */}
            <div className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 flex items-center justify-center">
              <svg viewBox="0 0 360 250" className="w-full max-w-[320px] h-auto">
                <line x1="180" y1="220" x2="180" y2="20" stroke="#0B1230" strokeWidth="2" />
                <line x1="30" y1="155" x2="330" y2="155" stroke="#0B1230" strokeWidth="2" />
                <text x="188" y="28" fontSize="12" fontWeight="bold" fill="#0B1230">y</text>
                <text x="322" y="148" fontSize="12" fontWeight="bold" fill="#0B1230">x</text>
                <path
                  d="M 65 30 Q 180 260 295 30"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="180" cy="145" r="5" fill="#06B6D4" stroke="#ffffff" strokeWidth="2" />
                <text x="190" y="144" fontSize="11" fontWeight="bold" fill="#0B1230">
                  Vertex
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Footer Strip */}
      <div className="px-5 py-2.5 border-t border-[#E4E1F5] bg-[#FAF8FF] flex items-center justify-between text-[11px] font-medium text-[#4A5073]">
        <span>2025/2026 Session · Second Term</span>
        <span className="tabular-nums">
          {type === "slide" ? `Slide ${safeIndex + 1} / ${slides.length}` : "Live Classroom Stage"}
        </span>
      </div>
    </div>
  );
}

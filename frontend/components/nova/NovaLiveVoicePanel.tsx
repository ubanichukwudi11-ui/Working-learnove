"use client";

import { useEffect, useRef, useState } from "react";
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  Radio,
} from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: "You" | "Nova";
  text: string;
}

const VOICES = ["Zephyr", "Kore", "Puck", "Charon", "Fenrir"] as const;

export default function NovaLiveVoicePanel() {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [subject, setSubject] = useState("Mathematics & Physics");
  const [voice, setVoice] = useState<(typeof VOICES)[number]>("Zephyr");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mutedRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  function float32ToPcm16Base64(float32: Float32Array): string {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64PcmToFloat32(base64: string): Float32Array<ArrayBuffer> {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    const samples = Math.floor(len / 2);
    const float32 = new Float32Array(new ArrayBuffer(samples * 4));
    for (let i = 0; i < samples; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }
    return float32;
  }

  function clearScheduledPlayback() {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // already ended
      }
    }
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }

  function schedulePcmPlayback(base64Audio: string) {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    const float32 = base64PcmToFloat32(base64Audio);
    if (float32.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
    };
  }

  function stopLiveSession() {
    clearScheduledPlayback();
    try {
      processorRef.current?.disconnect();
    } catch {}
    processorRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (inputCtxRef.current && inputCtxRef.current.state !== "closed") {
      inputCtxRef.current.close().catch(() => {});
    }
    inputCtxRef.current = null;

    if (outputCtxRef.current && outputCtxRef.current.state !== "closed") {
      outputCtxRef.current.close().catch(() => {});
    }
    outputCtxRef.current = null;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setStatus("idle");
  }

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startLiveSession() {
    setErrorMsg(null);
    setStatus("connecting");
    setTranscripts([]);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const params = new URLSearchParams({ subject, voice });
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/nova-live?${params.toString()}`
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") {
            setStatus("live");
          } else if (msg.type === "audio" && msg.audio) {
            schedulePcmPlayback(msg.audio);
          } else if (msg.type === "interrupted") {
            clearScheduledPlayback();
          } else if (msg.type === "inputTranscript" && msg.text) {
            setTranscripts((prev) => [
              ...prev,
              { id: `u-${Date.now()}-${Math.random()}`, speaker: "You", text: msg.text },
            ]);
          } else if (msg.type === "outputTranscript" && msg.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === "Nova") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: `${last.text}${msg.text}` },
                ];
              }
              return [
                ...prev,
                { id: `n-${Date.now()}-${Math.random()}`, speaker: "Nova", text: msg.text },
              ];
            });
          } else if (msg.type === "error") {
            setErrorMsg(msg.error || "Live voice session error.");
            stopLiveSession();
            setStatus("error");
          } else if (msg.type === "closed") {
            stopLiveSession();
          }
        } catch {
          // ignore parse issue
        }
      };

      ws.onerror = () => {
        setErrorMsg("Unable to connect to the Nova Live Voice WebSocket server.");
        stopLiveSession();
        setStatus("error");
      };

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const pcmBase64 = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: pcmBase64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to start voice session.");
      stopLiveSession();
      setStatus("error");
    }
  }

  return (
    <div className="p-2 sm:p-4 space-y-5 max-w-4xl mx-auto">
      <div className="learnova-banner-dark bg-architectural-grid-dark text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
            <Radio size={14} className={status === "live" ? "text-emerald-400" : "text-[#22D3EE]"} />
            Real-Time Voice Tutor · Conversational Audio
          </div>
          <h2 className="landing-display text-lg sm:text-xl font-extrabold">
            Speak Directly with Nova Tutor
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Ask questions aloud, interrupt naturally mid-explanation, and practice WAEC/JAMB oral
            and conceptual revision in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {status === "live" || status === "connecting" ? (
            <>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  muted
                    ? "bg-[#F59E0B] text-[#070D24]"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {muted ? <MicOff size={15} /> : <Mic size={15} />}
                {muted ? "Muted" : "Mic On"}
              </button>
              <button
                type="button"
                onClick={stopLiveSession}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
              >
                <PhoneOff size={15} /> End Voice Call
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startLiveSession}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white text-sm font-bold transition shadow-[0_8px_22px_rgba(79,70,229,0.4)] whitespace-nowrap"
            >
              <PhoneCall size={16} /> Start Live Voice Call
            </button>
          )}
        </div>
      </div>

      {/* Voice & Subject Controls */}
      <div className="grid sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-[#4A5073] mb-1.5">
            Practice Subject Focus
          </label>
          <input
            type="text"
            disabled={status === "live" || status === "connecting"}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Further Mathematics, Oral English, Organic Chemistry"
            className="learnova-input w-full px-3.5 py-2.5 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4A5073] mb-1.5">
            Tutor Voice Persona
          </label>
          <select
            disabled={status === "live" || status === "connecting"}
            value={voice}
            onChange={(e) => setVoice(e.target.value as any)}
            className="learnova-input w-full px-3.5 py-2.5 text-sm disabled:opacity-60"
          >
            {VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Status & Caption Feed */}
      <div className="rounded-2xl border border-[#E4E1F5] bg-[#FAF8FF] p-5 h-72 overflow-y-auto space-y-3">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#4A5073] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#DCD7F5] flex items-center justify-center">
              <Volume2
                size={24}
                className={status === "live" ? "text-[#4F46E5]" : "text-[#6D28D9]"}
              />
            </div>
            <p className="text-sm font-bold text-[#0B1230]">
              {status === "live"
                ? "Connected! Start speaking aloud — Nova is listening."
                : status === "connecting"
                ? "Connecting to Nova Live voice channel..."
                : "Press Start Live Voice Call to begin a real-time spoken tutorial."}
            </p>
            <p className="text-xs text-[#7C82A1] max-w-sm">
              16kHz microphone capture &amp; 24kHz HD voice playback with live captions.
            </p>
          </div>
        ) : (
          transcripts.map((t) => (
            <div
              key={t.id}
              className={`flex ${t.speaker === "You" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                  t.speaker === "You"
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                    : "bg-white border border-[#E4E1F5] text-[#0B1230]"
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">
                  {t.speaker}
                </span>
                {t.text}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

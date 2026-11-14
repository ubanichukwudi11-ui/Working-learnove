"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Square, Loader2, ImagePlus, X } from "lucide-react";

export interface AttachedImagePayload {
  base64: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}

type Props = {
  disabled?: boolean;
  subjectLabel?: string;
  onSend: (message: string, image?: AttachedImagePayload) => void;
};

export default function ChatInput({
  disabled = false,
  subjectLabel,
  onSend,
}: Props) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<AttachedImagePayload | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message]);

  function submit() {
    if (
      (!message.trim() && !attachedImage) ||
      disabled ||
      recording ||
      transcribing
    ) {
      return;
    }
    onSend(message.trim(), attachedImage || undefined);
    setMessage("");
    setAttachedImage(null);
  }

  async function handleImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    setMicError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMicError("Please select a PNG, JPG, or WEBP photo.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMicError("Image exceeds 4 MB. Please pick a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      setAttachedImage({
        base64,
        mimeType: file.type,
        previewUrl: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function toggleRecording() {
    setMicError(null);

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch("/api/nova/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Unable to transcribe audio.");
          }
          if (data.text) {
            setMessage((prev) => (prev ? `${prev} ${data.text}` : data.text));
          }
        } catch (err: any) {
          setMicError(err?.message || "Audio transcription failed.");
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      setMicError(err?.message || "Could not access microphone.");
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="rounded-2xl border border-slate-300 focus-within:border-[#0D9488] bg-[#F7F8FA] focus-within:bg-white transition p-2.5 shadow-2xs">
        {attachedImage && (
          <div className="mb-2 px-2 flex items-center gap-3">
            <div className="relative inline-block">
              <img
                src={attachedImage.previewUrl}
                alt={attachedImage.fileName}
                className="h-16 w-16 object-cover rounded-xl border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                aria-label="Remove attached photo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center shadow"
              >
                <X size={11} />
              </button>
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-bold text-[#0B1F3A] truncate">
                Snap &amp; Solve Photo Attached
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {attachedImage.fileName}
              </p>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            recording
              ? `Recording voice (${seconds}s)... Click stop to transcribe`
              : transcribing
              ? "Transcribing your speech with Gemini 3.5 Transcribe..."
              : attachedImage
              ? "Add a question about this photo (or click Send to solve)..."
              : subjectLabel
              ? `Ask Nova about ${subjectLabel} — or snap a homework photo...`
              : "Ask Nova Classroom AI to explain a topic, solve a snapped photo, or draft notes..."
          }
          className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-[#0F1F38] placeholder:text-slate-400 outline-none leading-relaxed max-h-40"
        />

        <div className="flex items-center justify-between gap-2 pt-1.5 px-1">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Press Enter to send · Attach textbook or homework photo (PNG/JPG/WEBP)
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImagePicked}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || recording || transcribing}
              title="Snap & Solve: upload homework or equation photo"
              className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition border bg-white hover:bg-slate-100 text-[#0B1F3A] border-slate-200"
            >
              <ImagePlus size={14} className="text-[#0D9488]" />
              <span className="hidden sm:inline">Snap Photo</span>
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              disabled={transcribing || disabled}
              title={
                recording
                  ? "Stop recording and transcribe"
                  : "Dictate question with microphone"
              }
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition border ${
                recording
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                  : transcribing
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-white hover:bg-slate-100 text-[#0B1F3A] border-slate-200"
              }`}
            >
              {transcribing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : recording ? (
                <Square size={13} />
              ) : (
                <Mic size={14} />
              )}
              <span>
                {recording ? `${seconds}s` : transcribing ? "Transcribing" : "Dictate"}
              </span>
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={
                (!message.trim() && !attachedImage) ||
                disabled ||
                recording ||
                transcribing
              }
              aria-label="Send message"
              className="w-9 h-9 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white flex items-center justify-center transition disabled:opacity-40"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {micError && (
        <p className="text-[11px] font-medium text-red-600 px-1">{micError}</p>
      )}
    </div>
  );
}

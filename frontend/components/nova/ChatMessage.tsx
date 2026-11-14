"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  NotebookPen,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface GroundingSource {
  title: string;
  uri: string;
}

type Props = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  modeLabel?: string;
  sources?: GroundingSource[];
  onSaveToNotebook?: (content: string) => void;
};

export default function ChatMessage({
  role,
  content,
  imageUrl,
  modeLabel,
  sources,
  onSaveToNotebook,
}: Props) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.replace(/[#*`_]/g, ""));
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] sm:max-w-[72%] rounded-2xl bg-[#0B1F3A] text-white px-4 py-3 text-sm leading-relaxed space-y-2.5">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Attached homework"
              className="max-h-56 w-auto rounded-xl border border-white/20 object-contain bg-white/5"
            />
          )}
          {content && <p className="whitespace-pre-wrap">{content}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-3xl">
      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={15} className="text-[#0D9488]" />
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        {modeLabel && (
          <p className="text-[11px] font-semibold text-slate-500">{modeLabel}</p>
        )}

        <div className="text-[15px] leading-relaxed text-[#0F1F38] prose prose-sm max-w-none prose-headings:text-[#0B1F3A] prose-headings:font-bold prose-strong:text-[#0B1F3A] prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#0B1F3A] prose-pre:text-slate-100 prose-a:text-[#0D9488]">
          <Markdown>{content}</Markdown>
        </div>

        {sources && sources.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Globe size={12} className="text-[#0D9488]" />
              Grounded Google Search Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a
                  key={`${src.uri}-${i}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7F8FA] border border-slate-200 hover:border-[#0D9488] text-[11px] font-semibold text-[#0B1F3A] transition max-w-xs truncate"
                  title={src.uri}
                >
                  <span className="truncate">{src.title || src.uri}</span>
                  <ExternalLink size={10} className="shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Classroom Action Strip on every Nova response */}
        <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 hover:text-[#0B1F3A] font-semibold transition"
          >
            {copied ? <Check size={13} className="text-[#0D9488]" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {onSaveToNotebook && (
            <button
              type="button"
              onClick={() => {
                onSaveToNotebook(content);
                setSaved(true);
              }}
              className="inline-flex items-center gap-1 hover:text-[#0D9488] font-semibold transition"
            >
              {saved ? (
                <>
                  <Check size={13} className="text-[#0D9488]" />
                  <span className="text-[#0D9488]">Saved to Notebook</span>
                </>
              ) : (
                <>
                  <NotebookPen size={13} />
                  <span>Save to Notebook</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSpeak}
            className="inline-flex items-center gap-1 hover:text-[#0B1F3A] font-semibold transition"
          >
            {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            {speaking ? "Stop audio" : "Listen"}
          </button>
        </div>
      </div>
    </div>
  );
}

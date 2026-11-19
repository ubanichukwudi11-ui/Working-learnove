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
        <div className="max-w-[82%] sm:max-w-[72%] rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white px-4 py-3 text-sm leading-relaxed space-y-2.5 shadow-[0_8px_20px_rgba(79,70,229,0.2)]">
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
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(79,70,229,0.25)]">
        <Sparkles size={15} />
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        {modeLabel && (
          <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
            {modeLabel}
          </p>
        )}

        <div className="text-[15px] leading-relaxed text-[var(--foreground)] prose prose-sm dark:prose-invert max-w-none prose-headings:text-[var(--foreground)] prose-headings:font-bold prose-strong:text-[var(--foreground)] prose-code:bg-violet-50 dark:prose-code:bg-violet-950/60 prose-code:text-indigo-600 dark:prose-code:text-indigo-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#070D24] prose-pre:text-slate-100 prose-a:text-violet-600 dark:prose-a:text-violet-400">
          <Markdown>{content}</Markdown>
        </div>

        {sources && sources.length > 0 && (
          <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
            <p className="text-[11px] font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
              <Globe size={12} className="text-cyan-600 dark:text-cyan-400" />
              Grounded Google Search Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a
                  key={`${src.uri}-${i}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-lavender)] border border-[var(--border-strong)] hover:border-[#7C3AED] text-[11px] font-semibold text-[var(--foreground)] transition max-w-xs truncate"
                  title={src.uri}
                >
                  <span className="truncate">{src.title || src.uri}</span>
                  <ExternalLink size={10} className="shrink-0 text-[var(--foreground-subtle)]" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Classroom Action Strip on every Nova response */}
        <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 hover:text-[var(--foreground)] font-semibold transition"
          >
            {copied ? (
              <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy size={13} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>

          {onSaveToNotebook && (
            <button
              type="button"
              onClick={() => {
                onSaveToNotebook(content);
                setSaved(true);
              }}
              className="inline-flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 font-semibold transition"
            >
              {saved ? (
                <>
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Saved to Notebook
                  </span>
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
            className="inline-flex items-center gap-1 hover:text-[var(--foreground)] font-semibold transition"
          >
            {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            {speaking ? "Stop audio" : "Listen"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Download, ExternalLink, FileText, FolderOpen, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  file?: string;
  downloadUrl?: string;
  fileName?: string;
  mimeType?: string;
};

function detectKind(file?: string, fileName?: string, mimeType?: string) {
  const hint = `${fileName || ""} ${file || ""}`.toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  const isImage =
    mime.startsWith("image/") ||
    Boolean(hint.match(/\.(jpg|jpeg|png|gif|webp)(\?|&|$)/i)) ||
    Boolean(file?.startsWith("data:image")) ||
    Boolean(file?.includes("docKey=profilePhoto"));

  const isPdf =
    mime === "application/pdf" ||
    Boolean(hint.match(/\.pdf(\?|&|$)/i)) ||
    Boolean(file?.startsWith("data:application/pdf"));

  return { isImage, isPdf };
}

export default function DocumentPreviewModal({
  open,
  onClose,
  title,
  file,
  downloadUrl,
  fileName,
  mimeType,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const { isImage, isPdf } = detectKind(file, fileName, mimeType);
  const resolvedDownloadHref =
    downloadUrl ||
    (file
      ? file.includes("/api/lms/teacher-documents")
        ? `${file}${file.includes("?") ? "&" : "?"}download=1`
        : file
      : undefined);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-[#070D24]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="learnova-glass-modal rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="landing-display text-lg sm:text-xl font-bold text-[var(--foreground)] truncate">
              {title}
            </h2>
            <p className="text-xs text-[var(--foreground-subtle)] mt-0.5 truncate">
              {fileName || "Authenticated Verification Document Preview"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="w-9 h-9 rounded-xl bg-[var(--surface-lavender)] hover:bg-rose-600 hover:text-white text-[var(--foreground)] flex items-center justify-center transition shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* Preview */}
        <div
          className="bg-[#0B1230] flex items-center justify-center overflow-auto p-5"
          style={{ height: "66vh" }}
        >
          {!file ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#C4B5FD]">
                <FileText size={32} />
              </div>
              <p className="text-sm text-[#C4B5FD]">No document uploaded.</p>
            </div>
          ) : isImage ? (
            <img
              src={file}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full rounded-2xl shadow-xl object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={file}
              title={title}
              className="w-full h-full rounded-2xl bg-white"
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-cyan-300">
                <FolderOpen size={32} />
              </div>
              <p className="text-sm text-[#C4B5FD]">
                Inline preview is unavailable for this file format. Open or download the file to inspect it.
              </p>
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition"
              >
                <ExternalLink size={15} />
                Open Document
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-4 flex flex-wrap justify-end gap-3">
          {file && (
            <>
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-lavender)] text-[var(--foreground)] text-xs font-bold hover:border-[#4F46E5] transition"
              >
                <ExternalLink size={14} />
                Open in Tab
              </a>

              {resolvedDownloadHref && (
                <a
                  href={resolvedDownloadHref}
                  download={fileName || true}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition shadow-xs"
                >
                  <Download size={14} />
                  Download
                </a>
              )}
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-lavender)] text-[var(--foreground)] text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
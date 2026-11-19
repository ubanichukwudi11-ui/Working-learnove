"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, FolderOpen, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  file?: string;
  fileHint?: "image" | "pdf" | "auto";
};

export default function DocumentPreviewModal({
  open,
  onClose,
  title,
  file,
  fileHint = "auto",
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [file, open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!open) return null;

  const basePath = (file || "").split("?")[0].toLowerCase();
  const isImageByExt =
    /\.(jpg|jpeg|png|gif|webp)$/i.test(basePath) ||
    Boolean(file?.startsWith("data:image")) ||
    Boolean(file?.includes("field=profilePhoto"));
  const isPdfByExt = basePath.endsWith(".pdf");

  const isImage =
    !imageFailed &&
    (fileHint === "image" || (fileHint === "auto" && isImageByExt));
  const isPdf = fileHint === "pdf" || isPdfByExt || (!isImage && Boolean(file?.startsWith("/api/lms/teacher-applications/document")));

  const downloadHref = file
    ? file.startsWith("/api/lms/teacher-applications/document")
      ? `${file}${file.includes("?") ? "&" : "?"}download=1`
      : file
    : undefined;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-[#070D24]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="learnova-glass-modal rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-[var(--border)]">
          <div>
            <h2 className="landing-display text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-subtle)] mt-0.5">
              Authenticated Verification Document Preview
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="w-10 h-10 rounded-xl bg-[var(--surface-lavender)] hover:bg-rose-600 hover:text-white text-[var(--foreground)] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div
          className="bg-[var(--surface-subtle)] flex items-center justify-center overflow-auto p-6"
          style={{ height: "68vh" }}
        >
          {!file ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--foreground-subtle)]">
                <FileText size={32} />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">No document uploaded.</p>
            </div>
          ) : isImage ? (
            <img
              src={file}
              alt={title}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="max-h-full max-w-full rounded-2xl shadow-xl object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={file}
              title={title}
              className="w-full h-full rounded-2xl bg-white border border-[var(--border)]"
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-[#4F46E5] dark:text-[#A5B4FC]">
                <FolderOpen size={32} />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                Inline preview unavailable for this format. Open or download the document below.
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition"
              >
                <ExternalLink size={15} />
                Open in Tab
              </a>

              <a
                href={downloadHref}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition"
              >
                <Download size={15} />
                Download
              </a>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-lavender)] text-[var(--foreground)] text-sm font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { Download, ExternalLink, FileText, FolderOpen, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  file?: string;
};

export default function DocumentPreviewModal({
  open,
  onClose,
  title,
  file,
}: Props) {
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

  const isImage =
    file?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
    file?.startsWith("data:image");

  const isPdf = file?.toLowerCase().endsWith(".pdf");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-[#070D24]/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0B1230] border border-white/15 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden text-white flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-white/10">
          <div>
            <h2 className="landing-display text-xl sm:text-2xl font-bold text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#C4B5FD] mt-0.5">
              Document Preview
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div
          className="bg-[#070D24] flex items-center justify-center overflow-auto p-6"
          style={{ height: "68vh" }}
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
              <p className="text-sm text-[#C4B5FD]">Preview unavailable.</p>
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
        <div className="border-t border-white/10 px-6 py-4 flex flex-wrap justify-end gap-3">
          {file && (
            <>
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition"
              >
                <ExternalLink size={15} />
                Open
              </a>

              <a
                href={file}
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
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
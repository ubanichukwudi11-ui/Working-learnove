"use client";

import { useEffect } from "react";

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
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  if (!open) return null;

  const isImage =
    file?.match(
      /\.(jpg|jpeg|png|gif|webp)$/i
    ) || file?.startsWith("data:image");

  const isPdf =
    file?.toLowerCase().endsWith(".pdf");

  return (
    <div
      onClick={onClose}
      className="
      fixed
      inset-0
      z-[9999]
      bg-black/80
      backdrop-blur-sm
      flex
      items-center
      justify-center
      p-6
      "
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="
        bg-[#111827]
        border
        border-slate-700
        rounded-3xl
        shadow-2xl
        w-full
        max-w-6xl
        max-h-[90vh]
        overflow-hidden
        "
      >
        {/* Header */}

        <div
          className="
          flex
          justify-between
          items-center
          px-8
          py-6
          border-b
          border-slate-800
          "
        >
          <div>
            <h2 className="text-2xl font-bold">
              {title}
            </h2>

            <p className="text-slate-400 mt-1">
              Document Preview
            </p>
          </div>

          <button
            onClick={onClose}
            className="
            w-12
            h-12
            rounded-xl
            bg-slate-800
            hover:bg-red-600
            text-xl
            transition
            "
          >
            ✕
          </button>
        </div>

        {/* Preview */}

        <div
          className="
          bg-slate-950
          flex
          items-center
          justify-center
          overflow-auto
          p-6
          "
          style={{
            height: "70vh",
          }}
        >
          {!file ? (
            <div className="text-center">
              <div className="text-7xl">
                📄
              </div>

              <p className="mt-6 text-slate-400">
                No document uploaded.
              </p>
            </div>
          ) : isImage ? (
            <img
              src={file}
              alt={title}
              className="
              max-h-full
              max-w-full
              rounded-2xl
              shadow-xl
              object-contain
              "
            />
          ) : isPdf ? (
            <iframe
              src={file}
              className="
              w-full
              h-full
              rounded-2xl
              bg-white
              "
            />
          ) : (
            <div className="text-center">
              <div className="text-7xl">
                📁
              </div>

              <p className="text-slate-400 mt-5">
                Preview unavailable.
              </p>

              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="
                inline-block
                mt-6
                px-6
                py-3
                rounded-xl
                bg-cyan-600
                hover:bg-cyan-500
                "
              >
                Open Document
              </a>
            </div>
          )}
        </div>

        {/* Footer */}

        <div
          className="
          border-t
          border-slate-800
          p-6
          flex
          justify-end
          gap-4
          "
        >
          {file && (
            <>
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="
                px-6
                py-3
                rounded-xl
                bg-cyan-600
                hover:bg-cyan-500
                transition
                "
              >
                Open
              </a>

              <a
                href={file}
                download
                className="
                px-6
                py-3
                rounded-xl
                bg-green-600
                hover:bg-green-500
                transition
                "
              >
                Download
              </a>
            </>
          )}

          <button
            onClick={onClose}
            className="
            px-6
            py-3
            rounded-xl
            bg-slate-700
            hover:bg-slate-600
            transition
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
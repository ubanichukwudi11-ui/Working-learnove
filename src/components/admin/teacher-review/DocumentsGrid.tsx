"use client";

import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import DocumentPreviewModal from "./DocumentPreviewModal";
import { TeacherReviewProps } from "./types";

export default function DocumentsGrid({ teacher }: TeacherReviewProps) {
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    file: string;
  } | null>(null);

  const teachingCert = teacher.teachingCertificate || teacher.certificate;

  const documents = [
    { title: "Profile Photo", file: teacher.profilePhoto },
    { title: "Teaching Certificate", file: teachingCert },
    { title: "Degree Certificate", file: teacher.degreeCertificate },
    { title: "Government ID / TRCN", file: teacher.governmentId },
    { title: "Curriculum Vitae", file: teacher.cv },
  ];

  const isPreviewableImage = (url?: string) => {
    if (!url) return false;
    return (
      Boolean(url.match(/\.(jpg|jpeg|png|gif|webp)(\?|&|$)/i)) ||
      url.startsWith("data:image") ||
      url.includes("docKey=profilePhoto")
    );
  };

  return (
    <div className="learnova-card p-6 space-y-4">
      <div>
        <h2 className="landing-display text-lg font-bold text-[var(--foreground)]">
          Uploaded Credentials
        </h2>
        <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
          Preview submitted certificates and identification securely before approving educator access.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const isImage = isPreviewableImage(doc.file);
          const downloadHref = doc.file
            ? doc.file.includes("/api/lms/teacher-documents")
              ? `${doc.file}${doc.file.includes("?") ? "&" : "?"}download=1`
              : doc.file
            : undefined;

          return (
            <div
              key={doc.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-lavender)] overflow-hidden flex flex-col justify-between"
            >
              <div className="h-36 bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center overflow-hidden">
                {!doc.file ? (
                  <div className="text-center text-[var(--foreground-subtle)]">
                    <FileText size={28} className="mx-auto mb-1 opacity-60" />
                    <span className="text-xs">Not uploaded</span>
                  </div>
                ) : isImage ? (
                  <img
                    src={doc.file}
                    alt={doc.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[var(--foreground)]">
                    <FileText size={28} className="mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold">Verified File On Record</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">{doc.title}</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)]">
                    {doc.file ? "Available for review" : "Missing file"}
                  </p>
                </div>
                {doc.file && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ title: doc.title, file: doc.file! })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    {downloadHref && (
                      <a
                        href={downloadHref}
                        download
                        title={`Download ${doc.title}`}
                        className="p-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                      >
                        <Download size={13} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || "Document Preview"}
        file={previewDoc?.file}
      />
    </div>
  );
}
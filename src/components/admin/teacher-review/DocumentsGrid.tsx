"use client";

import { FileText } from "lucide-react";
import { TeacherReviewProps } from "./types";

export default function DocumentsGrid({ teacher }: TeacherReviewProps) {
  const documents = [
    { title: "Profile Photo", file: teacher.profilePhoto },
    { title: "Teaching Certificate", file: teacher.certificate },
    { title: "Degree Certificate", file: teacher.degreeCertificate },
    { title: "Government ID", file: teacher.governmentId },
    { title: "Curriculum Vitae", file: teacher.cv },
  ];

  return (
    <div className="learnova-card p-6 space-y-4">
      <div>
        <h2 className="landing-display text-lg font-bold text-[var(--foreground)]">
          Uploaded Credentials
        </h2>
        <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
          Inspect submitted certificates and identification before approval.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const isImage =
            doc.file?.includes("jpg") ||
            doc.file?.includes("jpeg") ||
            doc.file?.includes("png") ||
            doc.file?.startsWith("data:image");

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
                    <span className="text-xs font-semibold">Document Uploaded</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">{doc.title}</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)]">
                    {doc.file ? "Available for review" : "Missing file"}
                  </p>
                </div>
                {doc.file && (
                  <a
                    href={doc.file}
                    download
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold transition whitespace-nowrap"
                  >
                    Open
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
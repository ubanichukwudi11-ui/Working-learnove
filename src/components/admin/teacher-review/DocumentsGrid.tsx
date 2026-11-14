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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0B1F3A]">Uploaded Credentials</h2>
        <p className="text-xs text-slate-600 mt-0.5">
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
              className="rounded-xl border border-slate-200 bg-[#F7F8FA] overflow-hidden flex flex-col justify-between"
            >
              <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                {!doc.file ? (
                  <div className="text-center text-slate-400">
                    <FileText size={28} className="mx-auto mb-1" />
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
                  <div className="text-center text-[#0B1F3A]">
                    <FileText size={28} className="mx-auto mb-1 text-[#0D9488]" />
                    <span className="text-xs font-semibold">Document Uploaded</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#0B1F3A]">{doc.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.file ? "Available for review" : "Missing file"}
                  </p>
                </div>
                {doc.file && (
                  <a
                    href={doc.file}
                    download
                    className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold"
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
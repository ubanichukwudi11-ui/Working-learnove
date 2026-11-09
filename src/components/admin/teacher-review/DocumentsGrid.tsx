"use client";

import { TeacherReviewProps } from "./types";

export default function DocumentsGrid({
  teacher,
}: TeacherReviewProps) {
  const documents = [
    {
      title: "Profile Photo",
      file: teacher.profilePhoto,
    },
    {
      title: "Teaching Certificate",
      file: teacher.certificate,
    },
    {
      title: "Degree Certificate",
      file: teacher.degreeCertificate,
    },
    {
      title: "Government ID",
      file: teacher.governmentId,
    },
    {
      title: "Curriculum Vitae",
      file: teacher.cv,
    },
  ];

  return (
    <div
      className="
      bg-[#111827]
      border
      border-slate-800
      rounded-3xl
      p-8
      "
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Uploaded Documents
        </h2>

        <p className="text-slate-400 mt-2">
          Review every uploaded document before
          approving this teacher.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.title}
            title={doc.title}
            file={doc.file}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentCard({
  title,
  file,
}: {
  title: string;
  file?: string;
}) {
  const isImage =
    file?.includes("jpg") ||
    file?.includes("jpeg") ||
    file?.includes("png") ||
    file?.includes("gif") ||
    file?.startsWith("data:image");

  const isPdf =
    file?.includes(".pdf");

  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      overflow-hidden
      hover:border-cyan-500/30
      transition
      "
    >
      {/* Preview */}

      <div
        className="
        h-56
        bg-slate-950
        flex
        items-center
        justify-center
        overflow-hidden
        "
      >
        {!file ? (
          <div className="text-center text-slate-500">
            <div className="text-5xl mb-3">
              📄
            </div>

            <p>No File Uploaded</p>
          </div>
        ) : isImage ? (
          <img
            src={file}
            alt={title}
            className="
            w-full
            h-full
            object-cover
            "
          />
        ) : isPdf ? (
          <div className="text-center">
            <div className="text-6xl">
              📕
            </div>

            <p className="mt-3 text-slate-400">
              PDF Document
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl">
              📁
            </div>

            <p className="mt-3 text-slate-400">
              Document Uploaded
            </p>
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="p-5">

        <h3 className="font-semibold text-lg">
          {title}
        </h3>

        <p className="text-sm text-slate-400 mt-2">
          {file
            ? "Document available"
            : "Document missing"}
        </p>

        {file && (
          <div className="flex gap-3 mt-5">

            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="
              flex-1
              text-center
              py-3
              rounded-xl
              bg-cyan-600
              hover:bg-cyan-500
              transition
              "
            >
              View
            </a>

            <a
              href={file}
              download
              className="
              flex-1
              text-center
              py-3
              rounded-xl
              bg-slate-700
              hover:bg-slate-600
              transition
              "
            >
              Download
            </a>

          </div>
        )}
      </div>
    </div>
  );
}
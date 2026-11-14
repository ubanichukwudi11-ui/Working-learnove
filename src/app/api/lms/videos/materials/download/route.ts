import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireApiAuth } from "@/lib/serverAuth";
import { loadLmsState } from "@/lib/lmsDb";
import { buildSimplePdfBuffer } from "@backend/services/videoLessonsService";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function sanitizeDownloadName(raw: string, fallback = "learnova-study-material.pdf"): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || fallback;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const localFileParam = searchParams.get("file");
  const videoId = searchParams.get("videoId") || "";
  const materialId = searchParams.get("materialId") || "";

  // 1. Direct local uploaded material file
  if (localFileParam) {
    const safeName = path.basename(localFileParam);
    const fullPath = path.join(process.cwd(), ".aistudio", "uploads", "materials", safeName);
    try {
      const buf = await readFile(fullPath);
      const ext = path.extname(safeName).toLowerCase();
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${sanitizeDownloadName(safeName)}"`,
          "Content-Length": String(buf.length),
        },
      });
    } catch {
      return NextResponse.json({ error: "Material file not found." }, { status: 404 });
    }
  }

  // 2. Lookup video & optional material in LMS state
  if (!videoId) {
    return NextResponse.json(
      { error: "Specify videoId or file to download lesson material." },
      { status: 400 }
    );
  }

  const state = await loadLmsState();
  const video = (state.videoLessons || []).find((v) => v.id === videoId);
  if (!video) {
    return NextResponse.json({ error: "Video lesson not found." }, { status: 404 });
  }

  const subject = state.subjects.find((s) => s.id === video.subjectId);
  const term = state.terms.find((t) => t.id === video.termId);
  const topic = (state.curriculumTopics || []).find((t) => t.id === video.topicId);

  const material = materialId
    ? (video.materials || []).find((m) => m.id === materialId)
    : undefined;

  // If material points to an external uploaded URL (e.g. Supabase Storage), stream it as attachment
  if (
    material &&
    material.url &&
    !material.url.startsWith("/api/lms/videos/materials/download")
  ) {
    if (material.type === "LINK") {
      return NextResponse.redirect(material.url);
    }
    try {
      const remoteRes = await fetch(material.url);
      if (remoteRes.ok) {
        const arrBuf = await remoteRes.arrayBuffer();
        const fileName = sanitizeDownloadName(
          material.fileName || `${material.title}.pdf`
        );
        return new NextResponse(arrBuf, {
          status: 200,
          headers: {
            "Content-Type":
              material.mimeType ||
              remoteRes.headers.get("content-type") ||
              "application/octet-stream",
            "Content-Disposition": `attachment; filename="${fileName}"`,
          },
        });
      }
    } catch {
      // Fall back to generating a clean PDF study guide below if remote fetch fails
    }
  }

  const subtitle = `${subject?.name || "Subject"} · ${term?.name || "Academic Term"} · ${topic?.title || "Topic"}`;
  const pdfTitle = material?.title || `${video.title} — Lesson Summary Sheet`;
  const bodyText =
    material?.contentText ||
    `TOPIC OVERVIEW\n${topic?.title || video.title}\n${topic?.description || ""}\n\nVIDEO LESSON SUMMARY\n${video.title}\nPresenter: ${video.uploadedByName}\nDuration: ${video.durationLabel || "Self-paced"}\n\nLESSON NOTES\n${video.description}\n\nSTUDY CHECKLIST\n1. Watch the complete video walkthrough and pause to replicate worked steps.\n2. Save key formulas and definitions to your Learnova Study Notebook.\n3. Ask Nova AI for 3 WAEC/JAMB practice questions on this topic to test mastery.`;

  const pdfBuffer = buildSimplePdfBuffer(pdfTitle, subtitle, bodyText);
  const downloadFileName = sanitizeDownloadName(
    material?.fileName || `${video.title}-Study-Sheet.pdf`
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${downloadFileName}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { requireApiAuth } from "@/lib/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";

const VIDEO_BUCKET = "learnova-video-lessons";
const MAX_VIDEO_BYTES = 85 * 1024 * 1024; // 85 MB

const ALLOWED_MIME_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-m4v": ".m4v",
  "video/ogg": ".ogv",
};

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a video file (.mp4, .webm, or .mov) to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded video file appears empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        {
          error:
            "Video file exceeds the 85 MB browser upload limit. Compress the video or attach a YouTube link instead.",
        },
        { status: 400 }
      );
    }

    const mimeType = (file.type || "video/mp4").split(";")[0].trim().toLowerCase();
    const rawExt = path.extname(file.name || "").toLowerCase();
    const ext =
      ALLOWED_MIME_EXT[mimeType] ||
      ([".mp4", ".webm", ".mov", ".m4v", ".ogv"].includes(rawExt) ? rawExt : ".mp4");

    if (!mimeType.startsWith("video/") && ![".mp4", ".webm", ".mov", ".m4v", ".ogv"].includes(rawExt)) {
      return NextResponse.json(
        { error: "Only video files (.mp4, .webm, .mov, .m4v) are accepted." },
        { status: 400 }
      );
    }

    const safeBase = (file.name || "lesson")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 48);
    const filename = `${Date.now()}_${auth.user.id.slice(0, 8)}_${safeBase}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    // 1. Try Supabase Storage public bucket first
    try {
      const sb = getSupabaseServerClient();
      const { data: buckets } = await sb.storage.listBuckets();
      if (!buckets?.some((b) => b.id === VIDEO_BUCKET)) {
        await sb.storage.createBucket(VIDEO_BUCKET, { public: true });
      }
      const { error: uploadErr } = await sb.storage
        .from(VIDEO_BUCKET)
        .upload(filename, bytes, {
          contentType: mimeType || "video/mp4",
          upsert: false,
        });

      if (!uploadErr) {
        const { data: pub } = sb.storage.from(VIDEO_BUCKET).getPublicUrl(filename);
        if (pub?.publicUrl) {
          return NextResponse.json({
            success: true,
            videoUrl: pub.publicUrl,
            storagePath: `supabase://${VIDEO_BUCKET}/${filename}`,
            mimeType: mimeType || "video/mp4",
            fileSizeBytes: file.size,
          });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase video storage upload fallback to local disk:", sbErr);
    }

    // 2. Fallback to persistent workspace upload directory streamed via HTTP Range endpoint
    const uploadDir = path.join(process.cwd(), ".aistudio", "uploads", "videos");
    await fs.mkdir(uploadDir, { recursive: true });
    const targetPath = path.join(uploadDir, filename);
    await fs.writeFile(targetPath, bytes);

    return NextResponse.json({
      success: true,
      videoUrl: `/api/lms/videos/stream/${encodeURIComponent(filename)}`,
      storagePath: `local://${filename}`,
      mimeType: mimeType || "video/mp4",
      fileSizeBytes: file.size,
    });
  } catch (err: any) {
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process video upload." },
      { status: 500 }
    );
  }
}

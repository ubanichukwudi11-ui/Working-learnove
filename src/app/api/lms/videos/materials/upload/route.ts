import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireApiAuth } from "@/lib/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";

const MATERIALS_BUCKET = "learnova-lesson-materials";
const MAX_MATERIAL_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_EXTS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

function inferMaterialType(ext: string): "PDF" | "SLIDES" | "WORKSHEET" | "NOTES" {
  if (ext === ".pdf") return "PDF";
  if (ext === ".ppt" || ext === ".pptx") return "SLIDES";
  if (ext === ".doc" || ext === ".docx" || ext === ".csv") return "WORKSHEET";
  return "NOTES";
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN", "TEACHER"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please attach a document, slide deck, or study sheet file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_MATERIAL_BYTES) {
      return NextResponse.json(
        { error: "Study material file must be 25MB or smaller." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name || "").toLowerCase() || ".pdf";
    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        {
          error:
            "Unsupported material format. Upload .pdf, .doc, .docx, .ppt, .pptx, .txt, .md, .csv, or image files.",
        },
        { status: 400 }
      );
    }

    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 48);
    const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safeBase || "material"}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    // Attempt Supabase Storage upload first
    try {
      const sb = getSupabaseServerClient();
      const { data: buckets } = await sb.storage.listBuckets();
      if (!buckets?.some((b) => b.name === MATERIALS_BUCKET)) {
        await sb.storage.createBucket(MATERIALS_BUCKET, {
          public: true,
          fileSizeLimit: MAX_MATERIAL_BYTES,
        });
      }

      const { error: uploadErr } = await sb.storage
        .from(MATERIALS_BUCKET)
        .upload(uniqueName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!uploadErr) {
        const { data: publicUrlData } = sb.storage
          .from(MATERIALS_BUCKET)
          .getPublicUrl(uniqueName);

        return NextResponse.json({
          success: true,
          url: publicUrlData.publicUrl,
          fileName: file.name,
          mimeType,
          fileSizeBytes: file.size,
          materialType: inferMaterialType(ext),
          storage: "supabase",
        });
      }
    } catch {
      // Fall back to persistent local disk directory
    }

    const dir = path.join(process.cwd(), ".aistudio", "uploads", "materials");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, uniqueName), buffer);

    return NextResponse.json({
      success: true,
      url: `/api/lms/videos/materials/download?file=${encodeURIComponent(uniqueName)}`,
      fileName: file.name,
      mimeType,
      fileSizeBytes: file.size,
      materialType: inferMaterialType(ext),
      storage: "local",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to upload lesson material." },
      { status: 500 }
    );
  }
}

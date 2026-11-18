import crypto from "crypto";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@backend/services/serverAuth";
import {
  checkSupabaseServerConfigured,
  getSupabaseServerClient,
  SUPABASE_SERVER_CONFIG_ERROR,
} from "@backend/services/supabaseServer";

const TEACHER_DOCS_BUCKET = "teacher-documents";
const PROFILE_IMAGES_BUCKET = "profile-images";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_DOC_EXTS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
]);

const ALLOWED_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function POST(req: NextRequest) {
  if (!checkSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: SUPABASE_SERVER_CONFIG_ERROR },
      { status: 503 }
    );
  }

  try {
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "teacher-documents")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 48);

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please attach a file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File must be non-empty and under 10 MB." },
        { status: 400 }
      );
    }

    const isProfileAvatarFolder =
      folder === "profile" || folder === "avatar" || folder === "profile-images";
    const ext = path.extname(file.name || "").toLowerCase() || ".pdf";

    if (isProfileAvatarFolder) {
      if (!authUser) {
        return NextResponse.json(
          { error: "Authentication required for profile image uploads." },
          { status: 401 }
        );
      }
      if (!ALLOWED_IMAGE_EXTS.has(ext)) {
        return NextResponse.json(
          { error: "Profile images must be .png, .jpg, .jpeg, or .webp." },
          { status: 400 }
        );
      }
    } else if (!ALLOWED_DOC_EXTS.has(ext)) {
      return NextResponse.json(
        {
          error:
            "Documents must be .pdf, .doc, .docx, .png, .jpg, .jpeg, or .webp.",
        },
        { status: 400 }
      );
    }

    const bucketName = isProfileAvatarFolder
      ? PROFILE_IMAGES_BUCKET
      : TEACHER_DOCS_BUCKET;
    const ownerPrefix = authUser?.id ? authUser.id : "pending-applicant";
    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const objectPath = `${ownerPrefix}/${folder || "doc"}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeBase || "file"}${ext}`;

    const sb = getSupabaseServerClient();
    const { data: buckets } = await sb.storage.listBuckets();
    const existing = buckets?.find(
      (b) => b.id === bucketName || b.name === bucketName
    );
    if (!existing) {
      await sb.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: MAX_UPLOAD_BYTES,
      });
    } else if (existing.public) {
      await sb.storage
        .updateBucket(bucketName, { public: false, fileSizeLimit: MAX_UPLOAD_BYTES })
        .catch(() => {});
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await sb.storage
      .from(bucketName)
      .upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Failed to store file: ${uploadErr.message}` },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      storageRef: `storage://${bucketName}/${objectPath}`,
      bucket: bucketName,
      objectPath,
      fileName: file.name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

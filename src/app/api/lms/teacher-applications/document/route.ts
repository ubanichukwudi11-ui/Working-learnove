import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { loadLmsState } from "@backend/services/lmsDb";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "@backend/services/supabaseServer";

const FIELD_TO_COLUMN: Record<string, string> = {
  profilePhoto: "profile_photo",
  teachingCertificate: "teaching_certificate",
  certificate: "teaching_certificate",
  degreeCertificate: "degree_certificate",
  governmentId: "government_id",
  cv: "cv",
};

const FIELD_TO_APP_KEY: Record<
  string,
  "profilePhoto" | "teachingCertificate" | "degreeCertificate" | "governmentId" | "cv"
> = {
  profilePhoto: "profilePhoto",
  teachingCertificate: "teachingCertificate",
  certificate: "teachingCertificate",
  degreeCertificate: "degreeCertificate",
  governmentId: "governmentId",
  cv: "cv",
};

function parseStorageRef(rawValue: string): { bucket: string; objectPath: string } | null {
  const clean = rawValue.trim();
  if (clean.startsWith("storage://") || clean.startsWith("supabase://")) {
    const rest = clean.replace(/^(storage|supabase):\/\//, "");
    const idx = rest.indexOf("/");
    if (idx > 0) {
      return { bucket: rest.slice(0, idx), objectPath: rest.slice(idx + 1) };
    }
  }
  if (clean.includes("/storage/v1/object/public/teacher-documents/")) {
    const objectPath = clean.split("/storage/v1/object/public/teacher-documents/")[1] || "";
    if (objectPath) return { bucket: "teacher-documents", objectPath };
  }
  return null;
}

function guessContentType(pathStr: string, fallback?: string | null): string {
  const clean = pathStr.split("?")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".doc")) return "application/msword";
  if (clean.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return fallback || "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse || !auth.user) return auth.errorResponse;

  const user = auth.user;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const teacherUserId = req.nextUrl.searchParams.get("teacherUserId")?.trim() || user.id;
  const field = req.nextUrl.searchParams.get("field")?.trim() || "";
  const applicationId = req.nextUrl.searchParams.get("applicationId")?.trim() || "";
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!isAdmin && teacherUserId !== user.id) {
    return NextResponse.json(
      { error: "You do not have permission to view another educator's documents." },
      { status: 403 }
    );
  }

  const column = FIELD_TO_COLUMN[field];
  const appKey = FIELD_TO_APP_KEY[field];
  if (!column || !appKey) {
    return NextResponse.json({ error: "Invalid document field specified." }, { status: 400 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: "Document storage unavailable." }, { status: 503 });
  }

  const sb = getSupabaseServerClient();
  let rawRef: string | undefined;

  if (applicationId) {
    const state = await loadLmsState();
    const matchedApp = state.teacherApplications.find(
      (a) => a.id === applicationId && a.teacherUserId === teacherUserId
    );
    rawRef = matchedApp?.documentUrls?.[appKey];
  }

  if (!rawRef) {
    const { data: tp } = await sb
      .from("teacher_profiles")
      .select(column)
      .eq("user_id", teacherUserId)
      .maybeSingle();
    const val = tp ? (tp as unknown as Record<string, unknown>)[column] : undefined;
    if (typeof val === "string" && val.trim()) {
      rawRef = val.trim();
    }
  }

  if (!rawRef) {
    const state = await loadLmsState();
    const fallbackApp = state.teacherApplications.find(
      (a) => a.teacherUserId === teacherUserId && a.documentUrls?.[appKey]
    );
    rawRef = fallbackApp?.documentUrls?.[appKey];
  }

  if (!rawRef) {
    return NextResponse.json({ error: "Document has not been uploaded." }, { status: 404 });
  }

  const parsed = parseStorageRef(rawRef);
  if (!parsed) {
    if (/^https?:\/\//i.test(rawRef)) {
      return NextResponse.redirect(rawRef);
    }
    return NextResponse.json({ error: "Unsupported document reference." }, { status: 400 });
  }

  const { data: fileBlob, error: dlError } = await sb.storage
    .from(parsed.bucket)
    .download(parsed.objectPath);

  if (dlError || !fileBlob) {
    return NextResponse.json(
      { error: dlError?.message || "Document could not be retrieved from storage." },
      { status: 404 }
    );
  }

  const fileName =
    parsed.objectPath.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || `${field}.pdf`;
  const contentType = guessContentType(parsed.objectPath, fileBlob.type);
  const arrayBuffer = await fileBlob.arrayBuffer();

  return new NextResponse(Buffer.from(arrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

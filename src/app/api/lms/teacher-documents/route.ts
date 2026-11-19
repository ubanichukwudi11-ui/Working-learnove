import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { loadLmsState } from "@backend/services/lmsDb";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";

const VALID_DOC_KEYS = new Set([
  "profilePhoto",
  "teachingCertificate",
  "certificate",
  "degreeCertificate",
  "governmentId",
  "cv",
]);

const DB_COLUMN_BY_DOC_KEY: Record<string, string> = {
  profilePhoto: "profile_photo",
  teachingCertificate: "teaching_certificate",
  certificate: "teaching_certificate",
  degreeCertificate: "degree_certificate",
  governmentId: "government_id",
  cv: "cv",
};

const APP_DOC_FIELD_BY_DOC_KEY: Record<
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

function inferMimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

function parseStorageReference(
  rawValue: string
): { bucket: string; objectPath: string } | null {
  const clean = rawValue.trim();
  if (clean.startsWith("storage://") || clean.startsWith("supabase://")) {
    const rest = clean.replace(/^(storage|supabase):\/\//, "");
    const idx = rest.indexOf("/");
    if (idx > 0) {
      return {
        bucket: rest.slice(0, idx),
        objectPath: rest.slice(idx + 1),
      };
    }
  }
  const publicMarker = "/storage/v1/object/public/";
  if (clean.includes(publicMarker)) {
    const after = clean.split(publicMarker)[1] || "";
    const idx = after.indexOf("/");
    if (idx > 0) {
      return {
        bucket: after.slice(0, idx),
        objectPath: after.slice(idx + 1).split("?")[0],
      };
    }
  }
  return null;
}

export async function resolveRawTeacherDocRef(params: {
  teacherId: string;
  docKey: string;
  appId?: string | null;
}): Promise<string | null> {
  const { teacherId, docKey, appId } = params;
  const appField = APP_DOC_FIELD_BY_DOC_KEY[docKey];
  const dbColumn = DB_COLUMN_BY_DOC_KEY[docKey];

  try {
    const state = await loadLmsState();
    if (appId) {
      const targetApp = state.teacherApplications.find(
        (a) => a.id === appId && a.teacherUserId === teacherId
      );
      const fromTarget = targetApp?.documentUrls?.[appField];
      if (fromTarget) return fromTarget;
    }

    for (const app of state.teacherApplications) {
      if (app.teacherUserId === teacherId && app.documentUrls?.[appField]) {
        return app.documentUrls[appField] || null;
      }
    }
  } catch {
    // Fallback to direct teacher_profiles lookup
  }

  try {
    const sb = getSupabaseServerClient();
    const { data: tp } = await sb
      .from("teacher_profiles")
      .select("profile_photo,teaching_certificate,degree_certificate,government_id,cv")
      .eq("user_id", teacherId)
      .maybeSingle();

    const record = tp as Record<string, string | null | undefined> | null;
    if (record && dbColumn && record[dbColumn]) {
      return record[dbColumn] || null;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN", "TEACHER"], {
    allowUnapprovedTeacher: true,
  });
  if (auth.errorResponse) return auth.errorResponse;

  const teacherId = req.nextUrl.searchParams.get("teacherId")?.trim() || "";
  const docKey = req.nextUrl.searchParams.get("docKey")?.trim() || "";
  const appId = req.nextUrl.searchParams.get("appId")?.trim() || null;
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!teacherId || !VALID_DOC_KEYS.has(docKey)) {
    return NextResponse.json(
      { error: "Valid teacherId and docKey parameters are required." },
      { status: 400 }
    );
  }

  const isAdmin =
    auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";
  if (!isAdmin && auth.user.id !== teacherId) {
    return NextResponse.json(
      { error: "You do not have permission to access another educator's private documents." },
      { status: 403 }
    );
  }

  const rawRef = await resolveRawTeacherDocRef({ teacherId, docKey, appId });
  if (!rawRef) {
    return NextResponse.json(
      { error: "Requested verification document was not found." },
      { status: 404 }
    );
  }

  const parsed = parseStorageReference(rawRef);
  if (!parsed) {
    if (/^https?:\/\//i.test(rawRef)) {
      return NextResponse.redirect(rawRef);
    }
    return NextResponse.json(
      { error: "Unsupported document storage reference." },
      { status: 400 }
    );
  }

  const sb = getSupabaseServerClient();
  const { data: blob, error } = await sb.storage
    .from(parsed.bucket)
    .download(parsed.objectPath);

  if (error || !blob) {
    return NextResponse.json(
      { error: "Unable to retrieve private document from storage." },
      { status: 404 }
    );
  }

  const fileName =
    path.basename(parsed.objectPath).replace(/[^a-zA-Z0-9._-]/g, "_") ||
    `${docKey}.pdf`;
  const mimeType =
    blob.type && blob.type !== "application/octet-stream"
      ? blob.type
      : inferMimeFromFilename(fileName);
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

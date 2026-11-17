import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  resolveVideoMaterialDownload,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  try {
    const resolved = await resolveVideoMaterialDownload(auth.user, {
      localFileParam: searchParams.get("file"),
      videoId: searchParams.get("videoId") || "",
      materialId: searchParams.get("materialId") || "",
    });

    if (resolved.kind === "redirect") {
      return NextResponse.redirect(resolved.url);
    }

    return new NextResponse(new Uint8Array(resolved.data), {
      status: 200,
      headers: {
        "Content-Type": resolved.contentType,
        "Content-Disposition": `attachment; filename="${resolved.fileName}"`,
        "Content-Length": String(resolved.data.byteLength),
      },
    });
  } catch (err: unknown) {
    if (err instanceof VideoServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Unable to download lesson material." },
      { status: 500 }
    );
  }
}

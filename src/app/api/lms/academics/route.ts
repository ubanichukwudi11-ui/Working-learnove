import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { createInitialLmsState, loadLmsState } from "@backend/services/lmsDb";
import { isSupabaseServerConfigured } from "@backend/services/supabaseServer";
import {
  getAcademicsCatalog,
  handleAcademicsMutation,
} from "@backend/services/academicsService";

export async function GET(req: NextRequest) {
  const isPublicCatalog = req.nextUrl.searchParams.get("public") === "catalog";
  if (isPublicCatalog) {
    try {
      const state = isSupabaseServerConfigured
        ? await loadLmsState()
        : createInitialLmsState();
      return NextResponse.json({
        classLevels: state.classLevels.filter((c) => c.isActive),
        subjects: state.subjects.filter((s) => s.isActive),
      });
    } catch {
      const fallback = createInitialLmsState();
      return NextResponse.json({
        classLevels: fallback.classLevels.filter((c) => c.isActive),
        subjects: fallback.subjects.filter((s) => s.isActive),
      });
    }
  }

  const auth = await requireApiAuth(req, undefined, {
    allowUnapprovedTeacher: true,
  });
  if (auth.errorResponse) return auth.errorResponse;

  const catalog = await getAcademicsCatalog(auth.user);
  return NextResponse.json(catalog);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleAcademicsMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to update academics." },
      { status: 400 }
    );
  }
}

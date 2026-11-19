import { NextRequest, NextResponse } from "next/server";
import { loadLmsState } from "@backend/services/lmsDb";
import { isSupabaseServerConfigured } from "@backend/services/supabaseServer";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getAcademicsCatalog,
  handleAcademicsMutation,
} from "@backend/services/academicsService";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("public") === "1") {
    if (!isSupabaseServerConfigured) {
      return NextResponse.json({ classLevels: [], subjects: [] });
    }
    try {
      const state = await loadLmsState();
      return NextResponse.json({
        classLevels: state.classLevels.filter((c) => c.isActive),
        subjects: state.subjects.filter((s) => s.isActive),
      });
    } catch {
      return NextResponse.json({ classLevels: [], subjects: [] });
    }
  }

  const auth = await requireApiAuth(req);
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

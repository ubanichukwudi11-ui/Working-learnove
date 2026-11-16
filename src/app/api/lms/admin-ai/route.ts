import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  generateAdminTimetableSuggestions,
  getAdminAiOverview,
  runAdminCopilotChat,
} from "@backend/services/adminAiService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const overview = await getAdminAiOverview();
    return NextResponse.json(overview);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load Admin AI overview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "ASK_COPILOT");

    if (action === "SUGGEST_TIMETABLE") {
      const result = await generateAdminTimetableSuggestions({
        goal: typeof body.goal === "string" ? body.goal : undefined,
        targetClassLevelId:
          typeof body.targetClassLevelId === "string"
            ? body.targetClassLevelId
            : undefined,
        maxCapacityPerRoom:
          body.maxCapacityPerRoom !== undefined
            ? Number(body.maxCapacityPerRoom)
            : undefined,
        actorId: auth.user.id,
      });
      return NextResponse.json(result);
    }

    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Please enter a question or administrative task." },
        { status: 400 }
      );
    }

    const history: Array<{ role: string; text: string }> = Array.isArray(
      body.history
    )
      ? body.history
      : [];

    const result = await runAdminCopilotChat({
      message,
      history,
      actorName: auth.user.fullName,
      actorRole: auth.user.role,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Admin AI Copilot error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to run Admin AI Copilot. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { draftVideoQaReply, NovaApiError } from "@backend/ai/novaAiService";
import {
  askVideoQuestion,
  listVideoQuestions,
  replyToVideoQuestion,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireApiAuth(req);
  if (errorResponse) return errorResponse;

  const videoId = req.nextUrl.searchParams.get("videoId")?.trim();
  const topicId = req.nextUrl.searchParams.get("topicId")?.trim();
  const questions = await listVideoQuestions({ videoId, topicId });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "").trim();

    if (action === "ASK_QUESTION") {
      const record = await askVideoQuestion(user, body);
      return NextResponse.json({ question: record }, { status: 201 });
    }

    if (action === "REPLY_QUESTION") {
      const updated = await replyToVideoQuestion(user, body);
      return NextResponse.json({ question: updated });
    }

    if (action === "AI_DRAFT_REPLY") {
      const result = await draftVideoQaReply(body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported Q&A action." }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof VideoServiceError || err instanceof NovaApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to process video Q&A request." },
      { status: 400 }
    );
  }
}

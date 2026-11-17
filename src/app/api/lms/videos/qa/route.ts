import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@backend/services/serverAuth";
import { enforceAndConsumeNovaQuota } from "@backend/services/rateLimitService";
import { draftVideoQaReply, NovaApiError } from "@backend/ai/novaAiService";
import {
  askVideoQuestion,
  listVideoQuestions,
  replyToVideoQuestion,
  VideoServiceError,
} from "@backend/services/videoLessonsService";

const qaDraftSchema = z.object({
  question: z.string().min(1).max(2000),
  lessonContext: z.string().max(1500).optional(),
});

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
      const parsed = qaDraftSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid Q&A AI draft request." },
          { status: 400 }
        );
      }
      const quota = await enforceAndConsumeNovaQuota(user, "qa_draft");
      if (!quota.allowed) {
        return NextResponse.json(
          { error: quota.reason || "Daily Nova AI limit reached.", quota },
          {
            status: 429,
            headers: quota.retryAfterSeconds
              ? { "Retry-After": String(quota.retryAfterSeconds) }
              : undefined,
          }
        );
      }

      const result = await draftVideoQaReply(parsed.data);
      return NextResponse.json({ ...result, quota });
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

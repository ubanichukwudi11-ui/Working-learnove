import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@backend/services/serverAuth";
import { enforceAndConsumeNovaQuota } from "@backend/services/rateLimitService";
import {
  generateFlashcardsForTopic,
  NovaApiError,
  type FlashcardItem,
} from "@backend/ai/novaAiService";

export type { FlashcardItem };

const flashcardsSchema = z.object({
  title: z.string().max(300).optional(),
  subject: z.string().max(150).optional(),
  content: z.string().max(12000).optional(),
});

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const rawBody = await req.json();
    const parsed = flashcardsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid flashcards request payload." },
        { status: 400 }
      );
    }

    const quota = await enforceAndConsumeNovaQuota(user, "flashcards");
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

    const result = await generateFlashcardsForTopic(parsed.data);
    return NextResponse.json({ ...result, quota });
  } catch (error: unknown) {
    if (error instanceof NovaApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const errMsg = (error as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to create study flashcards." },
      { status: 500 }
    );
  }
}

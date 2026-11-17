import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@backend/services/serverAuth";
import { enforceAndConsumeNovaQuota } from "@backend/services/rateLimitService";
import { NovaApiError, runNovaChat } from "@backend/ai/novaAiService";

const novaChatSchema = z.object({
  message: z.string().max(8000).optional(),
  prompt: z.string().max(8000).optional(),
  mode: z.enum(["general", "fast", "deep", "search"]).optional(),
  persona: z.enum(["tutor", "stem_coach", "essay_marker", "quiz_master"]).optional(),
  subjectHint: z.string().max(200).optional(),
  imageBase64: z.string().max(8_000_000).optional(),
  imageMimeType: z.string().max(64).optional(),
  history: z
    .array(
      z.object({
        role: z.string().max(24),
        content: z.string().max(8000),
      })
    )
    .max(24)
    .optional(),
});

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const rawBody = await req.json();
    const parsed = novaChatSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Nova AI request payload." },
        { status: 400 }
      );
    }

    const quota = await enforceAndConsumeNovaQuota(user, "chat");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.reason || "Nova AI rate limit exceeded.",
          response: quota.reason || "Nova AI rate limit exceeded.",
          quota,
        },
        {
          status: 429,
          headers: quota.retryAfterSeconds
            ? { "Retry-After": String(quota.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    const result = await runNovaChat(parsed.data);
    return NextResponse.json({ ...result, quota });
  } catch (error: unknown) {
    if (error instanceof NovaApiError) {
      return NextResponse.json(
        error.responseText
          ? { error: error.message, response: error.responseText }
          : { error: error.message },
        { status: error.status }
      );
    }
    const errMsg = (error as { message?: string })?.message;
    console.error("NOVA API ERROR:", error);
    return NextResponse.json(
      {
        error: errMsg || "Failed to reach Nova AI.",
        response:
          errMsg || "Sorry, something went wrong while contacting Nova AI.",
      },
      { status: 500 }
    );
  }
}
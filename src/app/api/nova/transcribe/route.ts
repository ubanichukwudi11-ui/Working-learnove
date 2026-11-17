import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@backend/services/serverAuth";
import { enforceAndConsumeNovaQuota } from "@backend/services/rateLimitService";
import { NovaApiError, transcribeNovaAudio } from "@backend/ai/novaAiService";

const transcribeSchema = z.object({
  audioBase64: z.string().min(1).max(12_000_000),
  mimeType: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const rawBody = await req.json();
    const parsed = transcribeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid audio transcription payload." },
        { status: 400 }
      );
    }

    const quota = await enforceAndConsumeNovaQuota(user, "transcribe");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason || "Daily Nova AI transcription limit reached.", quota },
        {
          status: 429,
          headers: quota.retryAfterSeconds
            ? { "Retry-After": String(quota.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    const result = await transcribeNovaAudio(parsed.data);
    return NextResponse.json({ ...result, quota });
  } catch (error: unknown) {
    if (error instanceof NovaApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const errMsg = (error as { message?: string })?.message;
    console.error("NOVA TRANSCRIBE ERROR:", error);
    return NextResponse.json(
      { error: errMsg || "Audio transcription failed." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  generateFlashcardsForTopic,
  NovaApiError,
  type FlashcardItem,
} from "@backend/ai/novaAiService";

export type { FlashcardItem };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await generateFlashcardsForTopic(body);
    return NextResponse.json(result);
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

import { NextRequest, NextResponse } from "next/server";
import { NovaApiError, transcribeNovaAudio } from "@backend/ai/novaAiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await transcribeNovaAudio(body);
    return NextResponse.json(result);
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

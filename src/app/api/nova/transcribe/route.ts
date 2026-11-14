import { NextRequest, NextResponse } from "next/server";
import { ai, GEMINI_MODELS } from "@backend/ai/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const audioBase64 = String(body.audioBase64 || "").trim();
    const mimeType = String(body.mimeType || "audio/webm").split(";")[0].trim();

    if (!audioBase64) {
      return NextResponse.json(
        { error: "Audio recording data is required." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const contentsPayload = {
      parts: [
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
        {
          text: "Transcribe this spoken student audio accurately into clear plain text. If there is only silence or no speech, return an empty string. Return only the transcription.",
        },
      ],
    };

    let modelUsed: string = GEMINI_MODELS.TRANSCRIBE;
    let response;

    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODELS.TRANSCRIBE,
        contents: contentsPayload,
      });
    } catch (primaryErr: any) {
      const msg = String(primaryErr?.message || "");
      const isTransient =
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("500") ||
        msg.includes("high demand");
      if (!isTransient) throw primaryErr;

      // Retry once briefly or fall back to multimodal Gemini 4 Hydrogen audio transcription
      await new Promise((r) => setTimeout(r, 600));
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODELS.TRANSCRIBE,
          contents: contentsPayload,
        });
      } catch {
        modelUsed = GEMINI_MODELS.GENERAL;
        response = await ai.models.generateContent({
          model: GEMINI_MODELS.GENERAL,
          contents: contentsPayload,
        });
      }
    }

    return NextResponse.json({
      success: true,
      text: (response.text || "").trim(),
      modelUsed,
    });
  } catch (error: any) {
    console.error("NOVA TRANSCRIBE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Audio transcription failed." },
      { status: 500 }
    );
  }
}

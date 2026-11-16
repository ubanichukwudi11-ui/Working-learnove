import { NextRequest, NextResponse } from "next/server";
import { NovaApiError, runNovaChat } from "@backend/ai/novaAiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runNovaChat(body);
    return NextResponse.json(result);
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
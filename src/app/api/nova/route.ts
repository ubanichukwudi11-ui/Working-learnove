import { NextRequest, NextResponse } from "next/server";
import {
  ai,
  getNovaSystemInstruction,
  resolveNovaModelConfig,
  type NovaChatMode,
  type NovaPersona,
} from "@backend/ai/geminiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || body.prompt || "").trim();
    const mode = (body.mode || "general") as NovaChatMode;
    const persona = (body.persona || "tutor") as NovaPersona;
    const subjectHint = typeof body.subjectHint === "string" ? body.subjectHint.trim() : "";
    const rawHistory: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a question or prompt." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured in the server environment.",
          response:
            "Gemini API key is not configured on the server. Add GEMINI_API_KEY in your environment to chat with Nova AI.",
        },
        { status: 503 }
      );
    }

    const cfg = resolveNovaModelConfig(mode);
    const systemInstruction = getNovaSystemInstruction(persona, subjectHint);

    // Ensure chat history begins with a user turn and preserves alternating history cleanly
    const cleanTurns = rawHistory
      .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
      .slice(-16);
    const firstUserIdx = cleanTurns.findIndex((m) => m.role === "user");
    const validTurns = firstUserIdx >= 0 ? cleanTurns.slice(firstUserIdx) : [];

    const sdkHistory = validTurns.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chatConfig: Record<string, any> = {
      systemInstruction,
    };

    if (cfg.thinkingLevel) {
      chatConfig.thinkingConfig = {
        thinkingLevel: cfg.thinkingLevel,
      };
    }

    if (cfg.useSearch) {
      chatConfig.tools = [{ googleSearch: {} }];
    }

    let response;
    let effectiveLabel = cfg.label;
    let searchFallback = false;

    try {
      const chat = ai.chats.create({
        model: cfg.model,
        history: sdkHistory,
        config: chatConfig,
      });
      response = await chat.sendMessage({ message });
    } catch (err: any) {
      const errText = String(err?.message || "");
      const isQuotaError =
        err?.status === 429 ||
        errText.includes("429") ||
        errText.includes("RESOURCE_EXHAUSTED");

      if (cfg.useSearch && isQuotaError) {
        searchFallback = true;
        effectiveLabel = "Gemini 4 Hydrogen (Live Web Search quota unavailable)";
        const fallbackConfig = { ...chatConfig };
        delete fallbackConfig.tools;
        const fallbackChat = ai.chats.create({
          model: cfg.model,
          history: sdkHistory,
          config: fallbackConfig,
        });
        response = await fallbackChat.sendMessage({ message });
      } else {
        throw err;
      }
    }

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const seenUrls = new Set<string>();
    const sources: Array<{ title: string; uri: string }> = [];

    for (const chunk of groundingChunks as any[]) {
      const uri = chunk?.web?.uri;
      if (uri && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        sources.push({
          uri,
          title: chunk?.web?.title || uri,
        });
      }
    }

    const responseText =
      (response.text || "No response returned from Nova AI.") +
      (searchFallback
        ? "\n\n*(Note: Live Google Search grounding exceeded the current API quota, so this answer was generated using Nova's built-in curriculum knowledge.)*"
        : "");

    return NextResponse.json({
      response: responseText,
      modelUsed: cfg.model,
      modeLabel: effectiveLabel,
      mode,
      sources,
      searchFallback,
    });
  } catch (error: any) {
    console.error("NOVA API ERROR:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to reach Nova AI.",
        response:
          error?.message || "Sorry, something went wrong while contacting Nova AI.",
      },
      { status: 500 }
    );
  }
}
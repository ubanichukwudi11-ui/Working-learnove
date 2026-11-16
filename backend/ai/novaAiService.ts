import { Type } from "@google/genai";
import {
  ai,
  GEMINI_MODELS,
  getNovaSystemInstruction,
  resolveNovaModelConfig,
  type NovaChatMode,
  type NovaPersona,
} from "./geminiClient";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export class NovaApiError extends Error {
  status: number;
  responseText?: string;

  constructor(message: string, status: number, responseText?: string) {
    super(message);
    this.status = status;
    this.responseText = responseText;
  }
}

const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export async function runNovaChat(input: {
  message?: string;
  prompt?: string;
  mode?: NovaChatMode;
  persona?: NovaPersona;
  subjectHint?: string;
  imageBase64?: string;
  imageMimeType?: string;
  history?: Array<{ role: string; content: string }>;
}) {
  const message = String(input.message || input.prompt || "").trim();
  const mode = (input.mode || "general") as NovaChatMode;
  const persona = (input.persona || "tutor") as NovaPersona;
  const subjectHint =
    typeof input.subjectHint === "string" ? input.subjectHint.trim() : "";
  const imageBase64 =
    typeof input.imageBase64 === "string" ? input.imageBase64.trim() : "";
  const imageMimeType =
    typeof input.imageMimeType === "string"
      ? input.imageMimeType.trim().toLowerCase()
      : "";
  const rawHistory: Array<{ role: string; content: string }> = Array.isArray(
    input.history
  )
    ? input.history
    : [];

  if (!message && !imageBase64) {
    throw new NovaApiError(
      "Please enter a question or attach a homework photo.",
      400
    );
  }

  if (imageBase64 && !ALLOWED_IMAGE_MIME.has(imageMimeType)) {
    throw new NovaApiError(
      "Unsupported image format. Upload a PNG, JPG, or WEBP photo.",
      400
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new NovaApiError(
      "GEMINI_API_KEY is not configured in the server environment.",
      503,
      "Gemini API key is not configured on the server. Add GEMINI_API_KEY in your environment to chat with Nova AI."
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

  const chatConfig: Record<string, unknown> = {
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

  const effectivePrompt =
    message ||
    "Inspect this homework / textbook photo carefully, read every question visible, and explain the solution step by step.";

  if (imageBase64) {
    // Multimodal Snap & Solve path using generateContent with full conversation context
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const contents = [
      ...sdkHistory,
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: imageMimeType === "image/jpg" ? "image/jpeg" : imageMimeType,
              data: cleanBase64,
            },
          },
          { text: effectivePrompt },
        ],
      },
    ];
    effectiveLabel = `${cfg.label} · Snap & Solve Vision`;
    response = await ai.models.generateContent({
      model: cfg.model,
      contents,
      config: chatConfig,
    });
  } else {
    try {
      const chat = ai.chats.create({
        model: cfg.model,
        history: sdkHistory,
        config: chatConfig,
      });
      response = await chat.sendMessage({ message: effectivePrompt });
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string };
      const errText = String(errObj?.message || "");
      const isQuotaError =
        errObj?.status === 429 ||
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
        response = await fallbackChat.sendMessage({ message: effectivePrompt });
      } else {
        throw err;
      }
    }
  }

  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seenUrls = new Set<string>();
  const sources: Array<{ title: string; uri: string }> = [];

  for (const chunk of groundingChunks as Array<{
    web?: { uri?: string; title?: string };
  }>) {
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

  return {
    response: responseText,
    modelUsed: cfg.model,
    modeLabel: effectiveLabel,
    mode,
    sources,
    searchFallback,
    hadImage: Boolean(imageBase64),
  };
}

function buildDeterministicFlashcards(
  title: string,
  subject: string,
  content: string
): FlashcardItem[] {
  const cleanLines = content
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*#\d.)\s]+/, "").trim())
    .filter((l) => l.length > 12);

  const cards: FlashcardItem[] = [];
  for (let i = 0; i < Math.min(5, cleanLines.length); i++) {
    const line = cleanLines[i];
    const colonIdx = line.indexOf(":");
    if (colonIdx > 3 && colonIdx < 48) {
      cards.push({
        id: `fc-local-${i}`,
        front: `Define or explain: ${line.slice(0, colonIdx).trim()}`,
        back: line.slice(colonIdx + 1).trim(),
        hint: subject,
      });
    } else {
      cards.push({
        id: `fc-local-${i}`,
        front: `Key Point ${i + 1} (${title})`,
        back: line,
        hint: subject,
      });
    }
  }

  if (cards.length < 3) {
    cards.push(
      {
        id: "fc-default-1",
        front: `Core Concept: ${title}`,
        back:
          content.slice(0, 220) ||
          `Review key formulas and principles in ${subject}.`,
        hint: subject,
      },
      {
        id: "fc-default-2",
        front: `Exam Checklist for ${subject}`,
        back: `Always show step-by-step workings, include correct SI units, and verify edge cases for ${title}.`,
        hint: "WAEC & JAMB Strategy",
      }
    );
  }

  return cards;
}

export async function generateFlashcardsForTopic(input: {
  title?: string;
  subject?: string;
  content?: string;
}) {
  const title = String(input.title || "Study Topic").trim();
  const subject = String(input.subject || "General").trim();
  const content = String(input.content || "").trim();

  if (!title && !content) {
    throw new NovaApiError("Please provide a topic or study note content.", 400);
  }

  const fallback = buildDeterministicFlashcards(title, subject, content);

  if (!process.env.GEMINI_API_KEY) {
    return { flashcards: fallback, generatedByAi: false };
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.FAST,
      contents: `Turn the following Nigerian secondary school study material into 6 crisp interactive revision flashcards for WAEC/JAMB exam preparation.
Subject: ${subject}
Title: ${title}
Material:
${content.slice(0, 3500)}

Each card should have a concise question/term on the 'front', a clear memorable explanation/formula on the 'back', and a short optional 'hint'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["flashcards"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as {
      flashcards?: Array<{ front: string; back: string; hint?: string }>;
    };

    const valid = (parsed.flashcards || [])
      .filter((f) => f.front && f.back)
      .slice(0, 8)
      .map((f, idx) => ({
        id: `fc-ai-${Date.now()}-${idx}`,
        front: f.front,
        back: f.back,
        hint: f.hint || subject,
      }));

    if (valid.length >= 2) {
      return { flashcards: valid, generatedByAi: true };
    }
  } catch (err) {
    console.warn("Flashcards Gemini generation fell back cleanly:", err);
  }

  return { flashcards: fallback, generatedByAi: false };
}

export async function transcribeNovaAudio(input: {
  audioBase64?: string;
  mimeType?: string;
}) {
  const audioBase64 = String(input.audioBase64 || "").trim();
  const mimeType = String(input.mimeType || "audio/webm").split(";")[0].trim();

  if (!audioBase64) {
    throw new NovaApiError("Audio recording data is required.", 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new NovaApiError("GEMINI_API_KEY is not configured on the server.", 503);
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
  } catch (primaryErr: unknown) {
    const msg = String((primaryErr as { message?: string })?.message || "");
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

  return {
    success: true,
    text: (response.text || "").trim(),
    modelUsed,
  };
}

export async function draftVideoQaReply(input: {
  question?: string;
  lessonContext?: string;
}) {
  const questionText = String(input.question || "").trim();
  const lessonContext = String(input.lessonContext || "").trim();

  if (!questionText) {
    throw new NovaApiError("Question text is required.", 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      draft:
        "Great question! Revisit the worked formula step shown in the video segment and check every unit conversion carefully.",
    };
  }

  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODELS.FAST,
      contents: `You are a concise Nigerian secondary school subject teacher replying to a student's question underneath a video lesson.
Lesson Context: ${lessonContext || "Curriculum Lesson"}
Student Question: ${questionText}

Write a clear, encouraging, accurate 2-4 sentence explanation suitable for posting as a teacher reply.`,
    });
    return {
      draft: (res.text || "").trim(),
    };
  } catch {
    return {
      draft:
        "Good observation! Review the core formula highlighted in this segment and test one practice problem from the lesson sheet.",
    };
  }
}

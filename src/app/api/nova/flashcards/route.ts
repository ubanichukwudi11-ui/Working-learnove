import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { ai, GEMINI_MODELS } from "@backend/ai/geminiClient";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
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
        back: content.slice(0, 220) || `Review key formulas and principles in ${subject}.`,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "Study Topic").trim();
    const subject = String(body.subject || "General").trim();
    const content = String(body.content || "").trim();

    if (!title && !content) {
      return NextResponse.json(
        { error: "Please provide a topic or study note content." },
        { status: 400 }
      );
    }

    const fallback = buildDeterministicFlashcards(title, subject, content);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ flashcards: fallback, generatedByAi: false });
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
        return NextResponse.json({ flashcards: valid, generatedByAi: true });
      }
    } catch (err) {
      console.warn("Flashcards Gemini generation fell back cleanly:", err);
    }

    return NextResponse.json({ flashcards: fallback, generatedByAi: false });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create study flashcards." },
      { status: 500 }
    );
  }
}

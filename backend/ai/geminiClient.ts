import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const GEMINI_MODELS = {
  GENERAL: "gemini-4-hydrogen",
  FAST: "gemini-3.1-flash-lite",
  TRANSCRIBE: "gemini-3.5-transcribe",
  LIVE_VOICE: "gemini-3.8-live",
} as const;

export const GEMINI_TEXT_MODEL = GEMINI_MODELS.GENERAL;

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "v1beta",
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export type NovaChatMode = "fast" | "general" | "deep" | "search";

export type NovaPersona =
  | "tutor"
  | "stem_coach"
  | "essay_marker"
  | "quiz_master";

export function resolveNovaModelConfig(mode: NovaChatMode) {
  switch (mode) {
    case "fast":
      return {
        model: GEMINI_MODELS.FAST,
        thinkingLevel: undefined,
        useSearch: false,
        label: "Fast · Gemini 3.1 Flash Lite",
      };
    case "deep":
      return {
        model: GEMINI_MODELS.GENERAL,
        thinkingLevel: ThinkingLevel.XHIGH,
        useSearch: false,
        label: "Deep Reasoning · Gemini 4 Hydrogen (Extended Thinking)",
      };
    case "search":
      return {
        model: GEMINI_MODELS.GENERAL,
        thinkingLevel: ThinkingLevel.LOW,
        useSearch: true,
        label: "Web Search · Gemini 4 Hydrogen + Google Search",
      };
    case "general":
    default:
      return {
        model: GEMINI_MODELS.GENERAL,
        thinkingLevel: ThinkingLevel.LOW,
        useSearch: false,
        label: "Balanced · Gemini 4 Hydrogen",
      };
  }
}

export function getNovaSystemInstruction(persona: NovaPersona, subjectHint?: string): string {
  const curriculumContext =
    "You operate inside Learnova, a Nigerian educational platform aligned with JSS1–SS3, WAEC, NECO, and JAMB standards (using Naira ₦ and Nigerian academic context where appropriate).";

  const subjectLine = subjectHint
    ? `Current focus subject/topic: ${subjectHint}.`
    : "";

  switch (persona) {
    case "stem_coach":
      return `You are Nova STEM Coach for Learnova. ${curriculumContext} ${subjectLine}
Break down Mathematics, Physics, Chemistry, Biology, and Computer Science problems with clear formulas, step-by-step derivations, SI units, and exam-ready worked examples.`;
    case "essay_marker":
      return `You are Nova English & Humanities Examiner for Learnova. ${curriculumContext} ${subjectLine}
Evaluate essays, summaries, and Literature-in-English answers against WAEC/NECO marking criteria (content, organization, expression, and mechanical accuracy) and provide constructive rewrites.`;
    case "quiz_master":
      return `You are Nova JAMB/WAEC Quiz Master for Learnova. ${curriculumContext} ${subjectLine}
Generate crisp exam-style practice questions (A–D or structured theory), wait for or check student answers when provided, and give concise marking-scheme explanations.`;
    case "tutor":
    default:
      return `You are Nova AI Tutor for Learnova. ${curriculumContext} ${subjectLine}
Be encouraging, clear, structured, and accurate. Explain concepts step-by-step using relatable Nigerian examples when helpful, and cite verified facts clearly.`;
  }
}

import { NextResponse } from "next/server";
import { ai, GEMINI_TEXT_MODEL } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        response:
          "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment to chat with Nova AI.",
      });
    }

    const prompt = `
You are Nova AI Tutor for Learnova.

You help students with:
- Mathematics
- Physics
- Chemistry
- Biology
- English
- Computer Science
- General Knowledge

Rules:
- Give clear explanations.
- Be friendly and encouraging.
- Explain step-by-step.
- Use examples when needed.
- Generate quizzes if requested.
- Answer ALL educational questions.
- If asked a general question, answer normally.

Student Question:
${message}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    return NextResponse.json({
      response: response.text || "No response returned from Gemini.",
    });
  } catch (error: any) {
    console.error(
      "NOVA ERROR:",
      error
    );

    return NextResponse.json({
      response:
        error?.message ||
        "Sorry, something went wrong.",
    });
  }
}
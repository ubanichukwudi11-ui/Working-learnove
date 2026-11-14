import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import { loadLmsState, mutateLmsState } from "@backend/services/lmsDb";
import {
  generateTopicQuizWithGemini,
  getTopicQuizQuestions,
  TIMED_CBT_PACKS,
} from "@backend/services/quizBankService";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const topicId = req.nextUrl.searchParams.get("topicId")?.trim();
  const subjectId = req.nextUrl.searchParams.get("subjectId")?.trim();
  const state = await loadLmsState();

  const questions = getTopicQuizQuestions(topicId, subjectId);
  const myAttempts = (state.quizAttempts || [])
    .filter((a) => a.studentUserId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    questions,
    cbtPacks: TIMED_CBT_PACKS,
    attempts: myAttempts,
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const body = await req.json();
  const action = String(body.action || "").trim();

  if (action === "GENERATE_AI_QUIZ") {
    const subjectName = String(body.subjectName || "Mathematics").trim();
    const subjectId = String(body.subjectId || "sub-math").trim();
    const topicTitle = String(body.topicTitle || "Topic Review").trim();
    const topicId = typeof body.topicId === "string" ? body.topicId : undefined;
    const topicDescription =
      typeof body.topicDescription === "string" ? body.topicDescription : "";

    const generated = await generateTopicQuizWithGemini({
      subjectName,
      subjectId,
      topicTitle,
      topicId,
      topicDescription,
    });
    return NextResponse.json(generated);
  }

  if (action === "SUBMIT_ATTEMPT") {
    const subjectId = String(body.subjectId || "sub-math").trim();
    const subjectName = String(body.subjectName || "General").trim();
    const topicId = typeof body.topicId === "string" ? body.topicId : undefined;
    const topicTitle = typeof body.topicTitle === "string" ? body.topicTitle : undefined;
    const quizType = body.quizType === "TIMED_CBT" ? "TIMED_CBT" : "TOPIC_QUIZ";
    const title = String(body.title || "Topic Mastery Quiz").trim();
    const score = Math.max(0, Number(body.score || 0));
    const total = Math.max(1, Number(body.total || 1));
    const durationSeconds = Math.max(0, Number(body.durationSeconds || 0));
    const percentage = Math.min(100, Math.round((score / total) * 100));

    const attempt = await mutateLmsState((state) => {
      const record = {
        id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentUserId: user.id,
        studentName: user.fullName,
        subjectId,
        subjectName,
        topicId,
        topicTitle,
        quizType: quizType as "TOPIC_QUIZ" | "TIMED_CBT",
        title,
        score,
        total,
        percentage,
        durationSeconds,
        createdAt: new Date().toISOString(),
      };
      state.quizAttempts.unshift(record);
      return record;
    });

    return NextResponse.json({ attempt }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported quiz action." }, { status: 400 });
}

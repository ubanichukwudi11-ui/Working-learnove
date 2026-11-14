import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  appendNotification,
  loadLmsState,
  mutateLmsState,
} from "@backend/services/lmsDb";
import { ai, GEMINI_MODELS } from "@backend/ai/geminiClient";

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireApiAuth(req);
  if (errorResponse) return errorResponse;

  const videoId = req.nextUrl.searchParams.get("videoId")?.trim();
  const topicId = req.nextUrl.searchParams.get("topicId")?.trim();
  const state = await loadLmsState();

  const items = (state.videoQuestions || []).filter((q) => {
    if (videoId && q.videoId !== videoId) return false;
    if (topicId && q.topicId !== topicId) return false;
    return true;
  });

  return NextResponse.json({
    questions: items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const body = await req.json();
  const action = String(body.action || "").trim();

  if (action === "ASK_QUESTION") {
    const videoId = String(body.videoId || "").trim();
    const topicId = String(body.topicId || "").trim();
    const question = String(body.question || "").trim();
    const timestampLabel = String(body.timestampLabel || "").trim() || undefined;

    if (!videoId || !topicId || !question) {
      return NextResponse.json(
        { error: "Video ID, topic ID, and question text are required." },
        { status: 400 }
      );
    }

    const record = await mutateLmsState((state) => {
      const video = state.videoLessons.find((v) => v.id === videoId);
      const item = {
        id: `vqa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        videoId,
        topicId,
        timestampLabel,
        authorUserId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        question,
        replies: [],
        createdAt: new Date().toISOString(),
      };
      state.videoQuestions.unshift(item);

      if (video && video.uploadedByUserId !== user.id) {
        appendNotification(state, {
          recipientUserId:
            video.uploadedByUserId === "system-seed"
              ? "ALL_ADMINS"
              : video.uploadedByUserId,
          recipientRole:
            video.uploadedByUserId === "system-seed" ? "ALL_ADMINS" : undefined,
          category: "VIDEO_LESSON",
          title: "New Topic Question Posted",
          message: `${user.fullName} asked on "${video.title}"${
            timestampLabel ? ` (${timestampLabel})` : ""
          }: "${question.slice(0, 80)}"`,
          href: `/videos?videoId=${encodeURIComponent(video.id)}&topicId=${encodeURIComponent(
            topicId
          )}`,
        });
      }

      return item;
    });

    return NextResponse.json({ question: record }, { status: 201 });
  }

  if (action === "REPLY_QUESTION") {
    const questionId = String(body.questionId || "").trim();
    const replyBody = String(body.body || "").trim();
    const isAiAssisted = Boolean(body.isAiAssisted);

    if (!questionId || !replyBody) {
      return NextResponse.json(
        { error: "Question ID and reply body are required." },
        { status: 400 }
      );
    }

    try {
      const updated = await mutateLmsState((state) => {
        const q = state.videoQuestions.find((item) => item.id === questionId);
        if (!q) throw new Error("Question thread not found.");
        const reply = {
          id: `vqr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          authorUserId: user.id,
          authorName: user.fullName,
          authorRole: user.role,
          body: replyBody,
          isAiAssisted,
          createdAt: new Date().toISOString(),
        };
        q.replies.push(reply);

        if (q.authorUserId !== user.id) {
          appendNotification(state, {
            recipientUserId: q.authorUserId,
            category: "VIDEO_LESSON",
            title: "Reply to Your Video Question",
            message: `${user.fullName} replied to your question on this lesson.`,
            href: `/videos?videoId=${encodeURIComponent(q.videoId)}&topicId=${encodeURIComponent(
              q.topicId
            )}`,
          });
        }

        return q;
      });
      return NextResponse.json({ question: updated });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Failed to post reply." },
        { status: 404 }
      );
    }
  }

  if (action === "AI_DRAFT_REPLY") {
    const questionText = String(body.question || "").trim();
    const lessonContext = String(body.lessonContext || "").trim();
    if (!questionText) {
      return NextResponse.json({ error: "Question text is required." }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        draft:
          "Great question! Revisit the worked formula step shown in the video segment and check every unit conversion carefully.",
      });
    }
    try {
      const res = await ai.models.generateContent({
        model: GEMINI_MODELS.FAST,
        contents: `You are a concise Nigerian secondary school subject teacher replying to a student's question underneath a video lesson.
Lesson Context: ${lessonContext || "Curriculum Lesson"}
Student Question: ${questionText}

Write a clear, encouraging, accurate 2-4 sentence explanation suitable for posting as a teacher reply.`,
      });
      return NextResponse.json({
        draft: (res.text || "").trim(),
      });
    } catch {
      return NextResponse.json({
        draft:
          "Good observation! Review the core formula highlighted in this segment and test one practice problem from the lesson sheet.",
      });
    }
  }

  return NextResponse.json({ error: "Unsupported Q&A action." }, { status: 400 });
}

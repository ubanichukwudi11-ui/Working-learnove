import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "@/lib/lmsDb";
import { normalizeVideoSourceInput } from "@backend/services/videoLessonsService";
import type {
  CurriculumTopicRecord,
  VideoLessonMaterialRecord,
  VideoLessonRecord,
  VideoPublishStatus,
  VideoUploadRequestRecord,
} from "@backend/services/lmsTypes";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";
  const isTeacher = auth.user.role === "TEACHER";

  const [state, users] = await Promise.all([
    loadLmsState(),
    isAdmin ? fetchDirectoryUsers() : Promise.resolve([]),
  ]);

  const classLevels = isAdmin
    ? state.classLevels
    : state.classLevels.filter((c) => c.isActive);
  const subjects = isAdmin
    ? state.subjects
    : state.subjects.filter((s) => s.isActive);

  const topics = (state.curriculumTopics || [])
    .filter((t) => isAdmin || isTeacher || t.isPublished)
    .sort((a, b) => a.topicOrder - b.topicOrder);

  const videos = (state.videoLessons || []).filter((v) => {
    if (isAdmin) return true;
    if (isTeacher) {
      return v.status === "PUBLISHED" || v.uploadedByUserId === auth.user.id;
    }
    return v.status === "PUBLISHED";
  });

  const requests = isAdmin
    ? state.videoUploadRequests || []
    : isTeacher
    ? (state.videoUploadRequests || []).filter(
        (r) => r.teacherUserId === auth.user.id
      )
    : [];

  const enrolment =
    auth.user.role === "STUDENT"
      ? state.studentEnrolments.find((e) => e.studentUserId === auth.user.id) ||
        null
      : null;
  const entitlement =
    auth.user.role === "STUDENT"
      ? state.studentEntitlements.find((e) => e.studentUserId === auth.user.id) ||
        null
      : null;

  const approvedPairs = isTeacher
    ? state.teacherApprovals.filter(
        (a) => a.teacherUserId === auth.user.id && a.status === "APPROVED"
      )
    : [];

  const teachers = isAdmin
    ? users
        .filter((u) => u.role === "TEACHER" && u.status !== "REJECTED")
        .map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          status: u.status,
          approvals: state.teacherApprovals
            .filter((a) => a.teacherUserId === u.id && a.status === "APPROVED")
            .map((a) => ({
              subjectId: a.subjectId,
              subjectName: a.subjectName,
              classLevelId: a.classLevelId,
              classLevelName: a.classLevelName,
            })),
        }))
    : [];

  return NextResponse.json({
    role: auth.user.role,
    classLevels,
    subjects,
    terms: state.terms,
    sessions: state.sessions,
    topics,
    videos,
    requests,
    teachers,
    approvedPairs,
    enrolment,
    entitlement,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";
  const isTeacher = auth.user.role === "TEACHER";

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "RECORD_VIDEO_VIEW") {
      const videoId = String(body.videoId || "");
      const updated = await mutateLmsState((state) => {
        const video = (state.videoLessons || []).find((v) => v.id === videoId);
        if (!video) throw new Error("Video lesson not found.");
        video.viewCount = (video.viewCount || 0) + 1;
        return video;
      });
      return NextResponse.json({ success: true, video: updated });
    }

    if (!isAdmin && !isTeacher) {
      return NextResponse.json(
        { error: "Only teachers and administrators can modify video lessons." },
        { status: 403 }
      );
    }

    const result = await mutateLmsState(async (state) => {
      if (!Array.isArray(state.curriculumTopics)) state.curriculumTopics = [];
      if (!Array.isArray(state.videoLessons)) state.videoLessons = [];
      if (!Array.isArray(state.videoUploadRequests)) state.videoUploadRequests = [];

      switch (action) {
        case "CREATE_TOPIC": {
          const subjectId = String(body.subjectId || "").trim();
          const termId = String(body.termId || "").trim();
          const classLevelId = String(body.classLevelId || "").trim();
          const title = String(body.title || "").trim();
          const description = String(body.description || "").trim();
          const weekLabel = String(body.weekLabel || "").trim();

          if (!subjectId || !termId || !classLevelId || !title) {
            throw new Error(
              "Subject, term, class level, and topic title are required."
            );
          }

          if (isTeacher && !isAdmin) {
            const hasApproval = state.teacherApprovals.some(
              (a) =>
                a.teacherUserId === auth.user.id &&
                a.subjectId === subjectId &&
                a.status === "APPROVED"
            );
            if (state.teacherApprovals.some((a) => a.teacherUserId === auth.user.id) && !hasApproval) {
              throw new Error(
                "You can only add topics for subjects you are approved to teach."
              );
            }
          }

          const existingCount = state.curriculumTopics.filter(
            (t) =>
              t.subjectId === subjectId &&
              t.termId === termId &&
              t.classLevelId === classLevelId
          ).length;

          const now = new Date().toISOString();
          const created: CurriculumTopicRecord = {
            id: `top-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            subjectId,
            termId,
            classLevelId,
            topicOrder: Number(body.topicOrder) || existingCount + 1,
            weekLabel: weekLabel || `Topic ${existingCount + 1}`,
            title,
            description:
              description ||
              "Structured curriculum topic with recorded walkthroughs and curated resources.",
            isPublished: true,
            createdBy: auth.user.id,
            createdAt: now,
            updatedAt: now,
          };

          state.curriculumTopics.push(created);
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "CREATE_CURRICULUM_TOPIC",
            entityType: "curriculum_topic",
            entityId: created.id,
            metadata: { subjectId, termId, classLevelId, title },
          });

          return { topic: created };
        }

        case "DELETE_TOPIC": {
          if (!isAdmin) {
            throw new Error("Only administrators can remove curriculum topics.");
          }
          const topicId = String(body.topicId || "");
          const before = state.curriculumTopics.length;
          state.curriculumTopics = state.curriculumTopics.filter(
            (t) => t.id !== topicId
          );
          if (state.curriculumTopics.length === before) {
            throw new Error("Topic not found.");
          }
          state.videoLessons = state.videoLessons.filter(
            (v) => v.topicId !== topicId
          );
          state.videoUploadRequests = state.videoUploadRequests.filter(
            (r) => r.topicId !== topicId
          );
          return { deletedTopicId: topicId };
        }

        case "CREATE_VIDEO_LESSON": {
          const topicId = String(body.topicId || "").trim();
          const title = String(body.title || "").trim();
          const description = String(body.description || "").trim();
          const durationLabel = String(body.durationLabel || "").trim();
          const requestId = String(body.requestId || "").trim() || undefined;
          const rawSourceType = String(body.sourceType || "YOUTUBE");
          const rawVideoUrl = String(body.videoUrl || "").trim();

          const topic = state.curriculumTopics.find((t) => t.id === topicId);
          if (!topic) {
            throw new Error("Selected curriculum topic was not found.");
          }
          if (!title) {
            throw new Error("Video lesson title is required.");
          }

          const normalized = normalizeVideoSourceInput({
            sourceType: rawSourceType,
            videoUrl: rawVideoUrl,
          });

          const incomingMaterials: VideoLessonMaterialRecord[] = Array.isArray(body.materials)
            ? body.materials
                .filter((m: any) => m && m.title && m.url)
                .map((m: any) => ({
                  id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: String(m.title).trim(),
                  type: (["PDF", "WORKSHEET", "SLIDES", "NOTES", "LINK"].includes(
                    String(m.type)
                  )
                    ? m.type
                    : "PDF") as VideoLessonMaterialRecord["type"],
                  url: String(m.url).trim(),
                  fileName: m.fileName ? String(m.fileName) : undefined,
                  mimeType: m.mimeType ? String(m.mimeType) : undefined,
                  fileSizeBytes: m.fileSizeBytes ? Number(m.fileSizeBytes) : undefined,
                  contentText: m.contentText ? String(m.contentText) : undefined,
                  createdAt: new Date().toISOString(),
                }))
            : [];

          const now = new Date().toISOString();
          const created: VideoLessonRecord = {
            id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            topicId: topic.id,
            subjectId: topic.subjectId,
            termId: topic.termId,
            classLevelId: topic.classLevelId,
            title,
            description:
              description ||
              `${topic.title} video lesson curated for Nigerian curriculum learners.`,
            sourceType: normalized.sourceType,
            videoUrl: normalized.videoUrl,
            youtubeVideoId: normalized.youtubeVideoId,
            storagePath: body.storagePath ? String(body.storagePath) : undefined,
            mimeType: body.mimeType ? String(body.mimeType) : undefined,
            fileSizeBytes: body.fileSizeBytes
              ? Number(body.fileSizeBytes)
              : undefined,
            durationLabel: durationLabel || undefined,
            materials: incomingMaterials,
            uploadedByUserId: auth.user.id,
            uploadedByName: auth.user.fullName,
            uploadedByRole: auth.user.role,
            status: "PUBLISHED",
            requestId,
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
          };

          state.videoLessons.unshift(created);

          if (requestId) {
            const reqRecord = state.videoUploadRequests.find(
              (r) => r.id === requestId
            );
            if (reqRecord) {
              reqRecord.fulfilledVideoId = created.id;
              reqRecord.status = isAdmin ? "APPROVED" : "SUBMITTED";
              reqRecord.updatedAt = now;

              if (!isAdmin) {
                appendNotification(state, {
                  recipientUserId: reqRecord.requestedByUserId,
                  recipientRole: "ALL_ADMINS",
                  category: "VIDEO_LESSON",
                  title: `Video Lesson Submitted: ${topic.title}`,
                  message: `${auth.user.fullName} uploaded "${created.title}" in response to your topic video request.`,
                  href: "/admin/videos",
                });
              }
            }
          }

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "CREATE_VIDEO_LESSON",
            entityType: "video_lesson",
            entityId: created.id,
            metadata: {
              topicId: topic.id,
              sourceType: created.sourceType,
              requestId,
            },
          });

          return { video: created };
        }

        case "DELETE_VIDEO_LESSON": {
          const videoId = String(body.videoId || "");
          const existing = state.videoLessons.find((v) => v.id === videoId);
          if (!existing) throw new Error("Video lesson not found.");
          if (!isAdmin && existing.uploadedByUserId !== auth.user.id) {
            throw new Error(
              "You can only delete video lessons that you uploaded."
            );
          }
          state.videoLessons = state.videoLessons.filter(
            (v) => v.id !== videoId
          );
          return { deletedVideoId: videoId };
        }

        case "UPDATE_VIDEO_STATUS": {
          if (!isAdmin) {
            throw new Error("Only administrators can moderate video status.");
          }
          const videoId = String(body.videoId || "");
          const status = String(body.status || "PUBLISHED") as VideoPublishStatus;
          const reviewNotes = String(body.reviewNotes || "").trim();

          const video = state.videoLessons.find((v) => v.id === videoId);
          if (!video) throw new Error("Video lesson not found.");

          video.status = status;
          if (reviewNotes) video.reviewNotes = reviewNotes;
          video.updatedAt = new Date().toISOString();

          if (status === "REVISION_REQUESTED" && video.uploadedByUserId !== auth.user.id) {
            appendNotification(state, {
              recipientUserId: video.uploadedByUserId,
              recipientRole: "TEACHER",
              category: "VIDEO_LESSON",
              title: `Revision Requested: ${video.title}`,
              message:
                reviewNotes ||
                "An administrator requested an update to your uploaded topic video.",
              href: "/teacher/videos",
            });
          }

          return { video };
        }

        case "ASSIGN_VIDEO_REQUEST": {
          if (!isAdmin) {
            throw new Error(
              "Only administrators can assign teacher video upload requests."
            );
          }
          const topicId = String(body.topicId || "").trim();
          const teacherUserId = String(body.teacherUserId || "").trim();
          const instructions = String(body.instructions || "").trim();
          const dueDate = String(body.dueDate || "").trim() || undefined;

          const topic = state.curriculumTopics.find((t) => t.id === topicId);
          if (!topic) throw new Error("Please select a valid curriculum topic.");
          if (!teacherUserId) throw new Error("Please select a teacher.");

          const users = await fetchDirectoryUsers();
          const teacher = users.find((u) => u.id === teacherUserId);
          if (!teacher) throw new Error("Selected teacher account not found.");

          const subject = state.subjects.find((s) => s.id === topic.subjectId);
          const term = state.terms.find((t) => t.id === topic.termId);

          const now = new Date().toISOString();
          const created: VideoUploadRequestRecord = {
            id: `vreq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            topicId: topic.id,
            subjectId: topic.subjectId,
            termId: topic.termId,
            classLevelId: topic.classLevelId,
            teacherUserId: teacher.id,
            teacherName: teacher.fullName,
            requestedByUserId: auth.user.id,
            requestedByName: auth.user.fullName,
            instructions:
              instructions ||
              `Please record and upload a clear video lesson covering "${topic.title}".`,
            dueDate,
            status: "REQUESTED",
            createdAt: now,
            updatedAt: now,
          };

          state.videoUploadRequests.unshift(created);

          appendNotification(state, {
            recipientUserId: teacher.id,
            recipientRole: "TEACHER",
            category: "VIDEO_LESSON",
            title: `Video Upload Requested: ${topic.title}`,
            message: `${subject?.name || "Subject"} (${term?.name || "Term"}): ${created.instructions}`,
            href: "/teacher/videos",
          });

          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "ASSIGN_VIDEO_UPLOAD_REQUEST",
            entityType: "video_upload_request",
            entityId: created.id,
            metadata: {
              topicId: topic.id,
              teacherUserId: teacher.id,
              dueDate,
            },
          });

          return { request: created };
        }

        case "REVIEW_VIDEO_REQUEST": {
          if (!isAdmin) {
            throw new Error("Only administrators can review upload requests.");
          }
          const requestId = String(body.requestId || "");
          const decision = String(body.decision || "APPROVED") as
            | "APPROVED"
            | "REVISION_REQUESTED";
          const adminReviewNotes = String(body.adminReviewNotes || "").trim();

          const reqRecord = state.videoUploadRequests.find(
            (r) => r.id === requestId
          );
          if (!reqRecord) throw new Error("Upload request not found.");

          reqRecord.status = decision;
          if (adminReviewNotes) reqRecord.adminReviewNotes = adminReviewNotes;
          reqRecord.updatedAt = new Date().toISOString();

          if (reqRecord.fulfilledVideoId) {
            const vid = state.videoLessons.find(
              (v) => v.id === reqRecord.fulfilledVideoId
            );
            if (vid) {
              vid.status =
                decision === "APPROVED" ? "PUBLISHED" : "REVISION_REQUESTED";
              if (adminReviewNotes) vid.reviewNotes = adminReviewNotes;
              vid.updatedAt = reqRecord.updatedAt;
            }
          }

          const topic = state.curriculumTopics.find(
            (t) => t.id === reqRecord.topicId
          );

          appendNotification(state, {
            recipientUserId: reqRecord.teacherUserId,
            recipientRole: "TEACHER",
            category: "VIDEO_LESSON",
            title:
              decision === "APPROVED"
                ? `Video Approved: ${topic?.title || "Topic Lesson"}`
                : `Revision Needed: ${topic?.title || "Topic Lesson"}`,
            message:
              adminReviewNotes ||
              (decision === "APPROVED"
                ? "Your video submission has been approved and is live for students."
                : "Please review the admin feedback and upload an updated video."),
            href: "/teacher/videos",
          });

          return { request: reqRecord };
        }

        case "ATTACH_VIDEO_MATERIAL": {
          const videoId = String(body.videoId || "").trim();
          const title = String(body.title || "").trim();
          const url = String(body.url || "").trim();
          const contentText = String(body.contentText || "").trim();
          const type = (["PDF", "WORKSHEET", "SLIDES", "NOTES", "LINK"].includes(
            String(body.type)
          )
            ? body.type
            : "PDF") as VideoLessonMaterialRecord["type"];

          const video = state.videoLessons.find((v) => v.id === videoId);
          if (!video) throw new Error("Video lesson not found.");
          if (!isAdmin && video.uploadedByUserId !== auth.user.id) {
            throw new Error(
              "You can only attach study materials to your own uploaded videos."
            );
          }
          if (!title) throw new Error("Material title is required.");
          if (!url && !contentText) {
            throw new Error("Attach a file/link or provide study notes text.");
          }

          const matId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const now = new Date().toISOString();
          const resolvedUrl =
            url ||
            `/api/lms/videos/materials/download?videoId=${encodeURIComponent(
              video.id
            )}&materialId=${encodeURIComponent(matId)}`;

          const createdMat: VideoLessonMaterialRecord = {
            id: matId,
            title,
            type,
            url: resolvedUrl,
            fileName: body.fileName ? String(body.fileName) : `${title}.pdf`,
            mimeType: body.mimeType ? String(body.mimeType) : "application/pdf",
            fileSizeBytes: body.fileSizeBytes
              ? Number(body.fileSizeBytes)
              : undefined,
            contentText: contentText || undefined,
            createdAt: now,
          };

          if (!Array.isArray(video.materials)) video.materials = [];
          video.materials.push(createdMat);
          video.updatedAt = now;
          return { video, material: createdMat };
        }

        case "REMOVE_VIDEO_MATERIAL": {
          const videoId = String(body.videoId || "").trim();
          const materialId = String(body.materialId || "").trim();
          const video = state.videoLessons.find((v) => v.id === videoId);
          if (!video) throw new Error("Video lesson not found.");
          if (!isAdmin && video.uploadedByUserId !== auth.user.id) {
            throw new Error("You can only remove materials from your own videos.");
          }
          video.materials = (video.materials || []).filter(
            (m) => m.id !== materialId
          );
          video.updatedAt = new Date().toISOString();
          return { video };
        }

        default:
          throw new Error("Unsupported video lessons action.");
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update video lessons." },
      { status: 400 }
    );
  }
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Film,
  Plus,
  Trash2,
  UploadCloud,
  Link2,
  Eye,
  X,
  FileText,
} from "lucide-react";
import VideoLessonPlayer, {
  parseYouTubeIdClient,
  type VideoLessonItem,
  type VideoLessonMaterialItem,
} from "./VideoLessonPlayer";

interface RequestItem {
  id: string;
  topicId: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  teacherUserId: string;
  teacherName: string;
  requestedByName: string;
  instructions: string;
  dueDate?: string;
  status: string;
  fulfilledVideoId?: string;
  adminReviewNotes?: string;
  createdAt: string;
}

export default function TeacherVideoStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoLessonItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  // Selection cascade for publishing video
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [activeRequestId, setActiveRequestId] = useState("");

  // New topic inline creator
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicWeek, setNewTopicWeek] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  // Video submission form
  const [sourceMode, setSourceMode] = useState<"UPLOADED_VIDEO" | "YOUTUBE">(
    "UPLOADED_VIDEO"
  );
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [durationLabel, setDurationLabel] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedMeta, setUploadedMeta] = useState<{
    storagePath?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    fileName?: string;
  } | null>(null);
  const [pendingMaterials, setPendingMaterials] = useState<
    Array<{
      title: string;
      type: VideoLessonMaterialItem["type"];
      url: string;
      fileName?: string;
      mimeType?: string;
      fileSizeBytes?: number;
    }>
  >([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<VideoLessonItem | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/videos", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();

      const subs = json.subjects || [];
      const trms = json.terms || [];
      const lvls = json.classLevels || [];

      setSubjects(subs);
      setTerms(trms);
      setClassLevels(lvls);
      setTopics(json.topics || []);
      setVideos(json.videos || []);
      setRequests(json.requests || []);

      setSubjectId((prev) => prev || subs[0]?.id || "");
      setTermId(
        (prev) =>
          prev || trms.find((t: any) => t.isCurrent)?.id || trms[0]?.id || ""
      );
      setClassLevelId(
        (prev) =>
          prev || lvls.find((l: any) => l.code === "SS2")?.id || lvls[0]?.id || ""
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const matchingTopics = useMemo(
    () =>
      topics.filter(
        (t) =>
          (!subjectId || t.subjectId === subjectId) &&
          (!termId || t.termId === termId) &&
          (!classLevelId || t.classLevelId === classLevelId)
      ),
    [topics, subjectId, termId, classLevelId]
  );

  useEffect(() => {
    if (matchingTopics.length > 0 && !matchingTopics.some((t) => t.id === topicId)) {
      setTopicId(matchingTopics[0].id);
    } else if (matchingTopics.length === 0) {
      setTopicId("");
    }
  }, [matchingTopics, topicId]);

  const startFulfillRequest = (reqItem: RequestItem) => {
    setSubjectId(reqItem.subjectId);
    setTermId(reqItem.termId);
    setClassLevelId(reqItem.classLevelId);
    setTopicId(reqItem.topicId);
    setActiveRequestId(reqItem.id);
    const topic = topics.find((t) => t.id === reqItem.topicId);
    if (topic && !videoTitle) {
      setVideoTitle(`${topic.title} — Teacher Video Lesson`);
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingFile(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/lms/videos/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Video upload failed.");

      setVideoUrl(json.videoUrl);
      setUploadedMeta({
        storagePath: json.storagePath,
        mimeType: json.mimeType,
        fileSizeBytes: json.fileSizeBytes,
        fileName: file.name,
      });
      if (!videoTitle.trim()) {
        setVideoTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      }
      setFeedback({
        type: "ok",
        text: `Uploaded "${file.name}". Complete the lesson title and click Publish Video Lesson.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "Failed to upload video file.",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleMaterialUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingMaterial(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/lms/videos/materials/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Material upload failed.");
      setPendingMaterials((prev) => [
        ...prev,
        {
          title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
          type: json.materialType || "PDF",
          url: json.url,
          fileName: json.fileName,
          mimeType: json.mimeType,
          fileSizeBytes: json.fileSizeBytes,
        },
      ]);
      setFeedback({
        type: "ok",
        text: `Material "${file.name}" attached for student download.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "Failed to upload study material.",
      });
    } finally {
      setUploadingMaterial(false);
    }
  };

  const createInlineTopic = async () => {
    if (!newTopicTitle.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TOPIC",
          subjectId,
          termId,
          classLevelId,
          title: newTopicTitle.trim(),
          weekLabel: newTopicWeek.trim(),
          description: newTopicDesc.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create topic.");

      setNewTopicTitle("");
      setNewTopicWeek("");
      setNewTopicDesc("");
      setShowNewTopic(false);
      await loadData();
      if (json.topic?.id) setTopicId(json.topic.id);
      setFeedback({ type: "ok", text: `Topic "${json.topic?.title}" created.` });
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Failed to add topic." });
    } finally {
      setSaving(false);
    }
  };

  const publishVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) {
      setFeedback({
        type: "err",
        text: "Please select or create a curriculum topic first.",
      });
      return;
    }
    if (!videoUrl.trim()) {
      setFeedback({
        type: "err",
        text:
          sourceMode === "UPLOADED_VIDEO"
            ? "Please upload a video file first."
            : "Please paste a YouTube or educational video URL.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_VIDEO_LESSON",
          topicId,
          title: videoTitle.trim(),
          description: videoDesc.trim(),
          durationLabel: durationLabel.trim(),
          sourceType: sourceMode,
          videoUrl: videoUrl.trim(),
          storagePath: uploadedMeta?.storagePath,
          mimeType: uploadedMeta?.mimeType,
          fileSizeBytes: uploadedMeta?.fileSizeBytes,
          materials: pendingMaterials,
          requestId: activeRequestId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not publish video lesson.");

      setVideoTitle("");
      setVideoDesc("");
      setDurationLabel("");
      setVideoUrl("");
      setUploadedMeta(null);
      setPendingMaterials([]);
      setActiveRequestId("");
      await loadData();
      setFeedback({
        type: "ok",
        text: activeRequestId
          ? "Video published and submitted for the admin request!"
          : "Video lesson published for students.",
      });
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "Failed to publish video lesson.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_VIDEO_LESSON", videoId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete video.");
      await loadData();
      setFeedback({ type: "ok", text: "Video lesson removed." });
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Delete failed." });
    } finally {
      setSaving(false);
    }
  };

  const subName = (id: string) => subjects.find((s) => s.id === id)?.name || id;
  const termName = (id: string) => terms.find((t) => t.id === id)?.name || id;
  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;
  const topicTitle = (id: string) => topics.find((t) => t.id === id)?.title || id;

  const parsedPreviewYtId =
    sourceMode === "YOUTUBE" ? parseYouTubeIdClient(videoUrl) : null;

  const openRequests = requests.filter(
    (r) => r.status === "REQUESTED" || r.status === "REVISION_REQUESTED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="learnova-banner-dark bg-architectural-grid-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
            Educator Video Studio
          </p>
          <h1 className="landing-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Topic Video Lessons &amp; Admin Requests
          </h1>
          <p className="text-sm text-[#C4B5FD] mt-1 max-w-2xl">
            Fulfill video upload requests from School Administration, upload your own recorded
            lessons, or curate YouTube walkthroughs mapped to Subject, Term, and Topic.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-[#E0E7FF] tabular-nums shrink-0">
          <span>{openRequests.length} open requests</span>
          <span aria-hidden="true">·</span>
          <span>{videos.length} library videos</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
            feedback.type === "ok"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Assigned Admin Upload Requests */}
      <div className="learnova-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0B1230] flex items-center gap-2">
              <ClipboardCheck size={18} className="text-[#4F46E5]" />
              Assigned Admin Video Upload Requests ({requests.length})
            </h2>
            <p className="text-xs text-[#6B6F94] mt-0.5">
              Topics requested by your School Administrator for recording or curation.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B6F94]">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DCD7F5] bg-[#FAF8FF] p-6 text-center text-xs text-[#6B6F94]">
            No pending video upload requests assigned to you right now. You can still upload
            or curate topic videos directly below.
          </div>
        ) : (
          <div className="divide-y divide-[#E4E1F5] border border-[#E4E1F5] rounded-xl overflow-hidden">
            {requests.map((reqItem) => (
              <div
                key={reqItem.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6F94]">
                    <span className="font-bold text-[#4F46E5]">
                      {subName(reqItem.subjectId)} · {levelCode(reqItem.classLevelId)} ·{" "}
                      {termName(reqItem.termId)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#0B1230]">
                      Status: {reqItem.status.replace(/_/g, " ")}
                    </span>
                    {reqItem.dueDate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Due {reqItem.dueDate}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#0B1230]">
                    Topic: {topicTitle(reqItem.topicId)}
                  </p>
                  <p className="text-xs text-[#43466E]">{reqItem.instructions}</p>
                  {reqItem.adminReviewNotes && (
                    <p className="text-xs text-amber-700 font-medium mt-1">
                      Admin feedback: {reqItem.adminReviewNotes}
                    </p>
                  )}
                </div>

                {reqItem.status !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => startFulfillRequest(reqItem)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-xs font-bold shrink-0 whitespace-nowrap transition shadow-xs"
                  >
                    {reqItem.status === "SUBMITTED"
                      ? "Upload Replacement"
                      : "Fulfill Request"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Video Form */}
      <div
        ref={formRef}
        className="learnova-card p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0B1230]">
              Add Video Lesson to Topic
            </h2>
            <p className="text-xs text-[#6B6F94] mt-0.5">
              Upload a recorded video file or attach a curated YouTube / lesson link.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-[#F5F3FF] border border-[#E4E1F5] p-1">
            <button
              type="button"
              onClick={() => {
                setSourceMode("UPLOADED_VIDEO");
                setVideoUrl("");
                setUploadedMeta(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sourceMode === "UPLOADED_VIDEO"
                  ? "bg-white text-[#0B1230] shadow-xs"
                  : "text-[#6B6F94] hover:text-[#0B1230]"
              }`}
            >
              <UploadCloud size={14} /> Upload Video File
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode("YOUTUBE");
                setVideoUrl("");
                setUploadedMeta(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sourceMode === "YOUTUBE"
                  ? "bg-white text-[#0B1230] shadow-xs"
                  : "text-[#6B6F94] hover:text-[#0B1230]"
              }`}
            >
              <Link2 size={14} /> YouTube / Link
            </button>
          </div>
        </div>

        {activeRequestId && (
          <div className="rounded-xl bg-[#F5F3FF] border border-[#DCD7F5] px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-[#4F46E5] font-semibold">
            <span>
              Fulfilling Admin Request for topic:{" "}
              <strong>{topicTitle(topicId)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveRequestId("")}
              className="underline hover:text-[#4338CA]"
            >
              Unlink Request
            </button>
          </div>
        )}

        <form onSubmit={publishVideo} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#43466E] mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="learnova-input text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#43466E] mb-1">
                Academic Term
              </label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="learnova-input text-sm"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#43466E] mb-1">
                Class Level
              </label>
              <select
                value={classLevelId}
                onChange={(e) => setClassLevelId(e.target.value)}
                className="learnova-input text-sm"
              >
                {classLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.code} — {lvl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#43466E]">
                Curriculum Topic
              </label>
              <button
                type="button"
                onClick={() => setShowNewTopic((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
              >
                <Plus size={13} />
                {showNewTopic ? "Cancel New Topic" : "Create New Topic"}
              </button>
            </div>

            {showNewTopic ? (
              <div className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Topic title (e.g. Simultaneous Equations)"
                    className="sm:col-span-2 learnova-input text-sm bg-white"
                  />
                  <input
                    value={newTopicWeek}
                    onChange={(e) => setNewTopicWeek(e.target.value)}
                    placeholder="Week label (e.g. Week 5)"
                    className="learnova-input text-sm bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Brief objectives for students..."
                    className="flex-1 learnova-input text-sm bg-white"
                  />
                  <button
                    type="button"
                    disabled={saving || !newTopicTitle.trim()}
                    onClick={createInlineTopic}
                    className="px-4 py-2 rounded-xl bg-[#0B1230] hover:bg-[#151A44] text-white text-xs font-bold disabled:opacity-50 transition"
                  >
                    Save Topic
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="learnova-input text-sm"
              >
                {matchingTopics.length === 0 ? (
                  <option value="">
                    No topics in this combination yet — click Create New Topic above
                  </option>
                ) : (
                  matchingTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.weekLabel ? `${t.weekLabel}: ` : ""}
                      {t.title}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#43466E] mb-1">
                Video Lesson Title
              </label>
              <input
                required
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. Completing the Square — Worked WAEC Examples"
                className="learnova-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#43466E] mb-1">
                Duration (optional)
              </label>
              <input
                value={durationLabel}
                onChange={(e) => setDurationLabel(e.target.value)}
                placeholder="e.g. 12:30"
                className="learnova-input text-sm tabular-nums"
              />
            </div>
          </div>

          {sourceMode === "UPLOADED_VIDEO" ? (
            <div className="rounded-xl border border-dashed border-[#DCD7F5] bg-[#FAF8FF] p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0B1230]">
                    Select Lesson Recording (.mp4, .webm, .mov)
                  </p>
                  <p className="text-xs text-[#6B6F94]">
                    Uploaded videos stream directly inside the student topic theater (max 85 MB).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1230] hover:bg-[#151A44] text-white text-xs font-bold cursor-pointer transition shrink-0">
                  <UploadCloud size={15} />
                  {uploadingFile ? "Uploading Video..." : "Choose Video File"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                    disabled={uploadingFile}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {videoUrl && (
                <p className="text-xs font-semibold text-emerald-700">
                  Ready to publish: {uploadedMeta?.fileName || videoUrl}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#43466E] mb-1">
                  YouTube URL or External Video Link
                </label>
                <input
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="learnova-input text-sm"
                />
              </div>
              {parsedPreviewYtId && (
                <div className="max-w-md rounded-xl overflow-hidden border border-[#E4E1F5] aspect-video bg-[#070D24]">
                  <iframe
                    src={`https://www.youtube.com/embed/${parsedPreviewYtId}?rel=0`}
                    title="YouTube preview"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#43466E] mb-1">
              Lesson Summary / Key Takeaways
            </label>
            <textarea
              rows={2}
              value={videoDesc}
              onChange={(e) => setVideoDesc(e.target.value)}
              placeholder="Explain what students will learn and highlight any practice questions covered..."
              className="learnova-input text-sm"
            />
          </div>

          {/* Optional Downloadable Lesson Materials */}
          <div className="rounded-xl border border-[#E4E1F5] bg-[#FAF8FF] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#0B1230]">
                  Attach Downloadable Study Materials (Optional)
                </p>
                <p className="text-[11px] text-[#6B6F94]">
                  Upload PDF notes, worksheets, or slides (.pdf, .docx, .pptx, .txt) for students to download alongside the video.
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCD7F5] hover:border-[#4F46E5] text-xs font-bold text-[#0B1230] cursor-pointer shrink-0 transition">
                <FileText size={14} className="text-[#4F46E5]" />
                {uploadingMaterial ? "Uploading..." : "Attach Material"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg"
                  disabled={uploadingMaterial}
                  className="hidden"
                  onChange={(e) => handleMaterialUpload(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {pendingMaterials.length > 0 && (
              <div className="space-y-1.5">
                {pendingMaterials.map((m, idx) => (
                  <div
                    key={`${m.url}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white border border-[#E4E1F5] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-[#0B1230] truncate">
                      {m.type} · {m.title}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingMaterials((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-rose-700 font-semibold hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || uploadingFile || uploadingMaterial || !topicId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-bold transition disabled:opacity-50 shadow-xs"
          >
            <Film size={16} />
            {saving ? "Publishing..." : "Publish Video Lesson"}
          </button>
        </form>
      </div>

      {/* Published Video Library */}
      <div className="learnova-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E1F5] bg-[#FAF8FF]">
          <h2 className="text-base font-bold text-[#0B1230]">
            Curriculum Video Library ({videos.length})
          </h2>
        </div>
        <div className="divide-y divide-[#E4E1F5]">
          {videos.map((v) => (
            <div
              key={v.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6F94]">
                  <span className="font-bold text-[#4F46E5]">
                    {subName(v.subjectId)} · {levelCode(v.classLevelId)} ·{" "}
                    {termName(v.termId)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {v.sourceType === "UPLOADED_VIDEO"
                      ? "Uploaded Video"
                      : v.sourceType === "YOUTUBE"
                      ? "YouTube"
                      : "External Link"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{v.viewCount || 0} views</span>
                </div>
                <p className="text-sm font-bold text-[#0B1230] mt-0.5">{v.title}</p>
                <p className="text-xs text-[#6B6F94]">
                  Topic: {topicTitle(v.topicId)} · By {v.uploadedByName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewVideo(v)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD7F5] text-xs font-semibold text-[#0B1230] hover:bg-[#FAF8FF] transition"
                >
                  <Eye size={13} /> Preview
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => deleteVideo(v.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="learnova-card max-w-3xl w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#4F46E5]">
                  {subName(previewVideo.subjectId)} · {topicTitle(previewVideo.topicId)}
                </p>
                <h3 className="text-lg font-bold text-[#0B1230] truncate">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl hover:bg-[#FAF8FF] text-[#6B6F94]"
              >
                <X size={18} />
              </button>
            </div>
            <VideoLessonPlayer video={previewVideo} />
          </div>
        </div>
      )}
    </div>
  );
}

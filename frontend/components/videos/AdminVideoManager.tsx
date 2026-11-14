"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  Film,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  X,
  PlayCircle,
  FileText,
} from "lucide-react";
import VideoLessonPlayer, {
  parseYouTubeIdClient,
  type VideoLessonItem,
  type VideoLessonMaterialItem,
} from "./VideoLessonPlayer";

export default function AdminVideoManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "curriculum">("requests");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoLessonItem[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Request Teacher Form state
  const [reqSubjectId, setReqSubjectId] = useState("");
  const [reqTermId, setReqTermId] = useState("");
  const [reqLevelId, setReqLevelId] = useState("");
  const [reqTopicId, setReqTopicId] = useState("");
  const [reqTeacherId, setReqTeacherId] = useState("");
  const [reqDueDate, setReqDueDate] = useState("");
  const [reqInstructions, setReqInstructions] = useState("");

  // Topic Creator state
  const [topSubjectId, setTopSubjectId] = useState("");
  const [topTermId, setTopTermId] = useState("");
  const [topLevelId, setTopLevelId] = useState("");
  const [topTitle, setTopTitle] = useState("");
  const [topWeek, setTopWeek] = useState("");
  const [topDesc, setTopDesc] = useState("");

  // Direct Video Curation / Upload state
  const [vidTopicId, setVidTopicId] = useState("");
  const [vidTitle, setVidTitle] = useState("");
  const [vidDesc, setVidDesc] = useState("");
  const [vidDuration, setVidDuration] = useState("");
  const [vidSourceMode, setVidSourceMode] = useState<"YOUTUBE" | "UPLOADED_VIDEO">(
    "YOUTUBE"
  );
  const [vidUrl, setVidUrl] = useState("");
  const [adminMaterials, setAdminMaterials] = useState<
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
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/videos", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();

      const subs = json.subjects || [];
      const trms = json.terms || [];
      const lvls = json.classLevels || [];
      const tps = json.topics || [];
      const tchs = json.teachers || [];

      setSubjects(subs);
      setTerms(trms);
      setClassLevels(lvls);
      setTopics(tps);
      setVideos(json.videos || []);
      setRequests(json.requests || []);
      setTeachers(tchs);

      const defSub = subs[0]?.id || "";
      const defTerm = trms.find((t: any) => t.isCurrent)?.id || trms[0]?.id || "";
      const defLvl = lvls.find((l: any) => l.code === "SS2")?.id || lvls[0]?.id || "";

      setReqSubjectId((p) => p || defSub);
      setReqTermId((p) => p || defTerm);
      setReqLevelId((p) => p || defLvl);
      setTopSubjectId((p) => p || defSub);
      setTopTermId((p) => p || defTerm);
      setTopLevelId((p) => p || defLvl);
      setVidTopicId((p) => p || tps[0]?.id || "");
      setReqTeacherId((p) => p || tchs[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reqMatchingTopics = useMemo(
    () =>
      topics.filter(
        (t) =>
          (!reqSubjectId || t.subjectId === reqSubjectId) &&
          (!reqTermId || t.termId === reqTermId) &&
          (!reqLevelId || t.classLevelId === reqLevelId)
      ),
    [topics, reqSubjectId, reqTermId, reqLevelId]
  );

  useEffect(() => {
    if (
      reqMatchingTopics.length > 0 &&
      !reqMatchingTopics.some((t) => t.id === reqTopicId)
    ) {
      setReqTopicId(reqMatchingTopics[0].id);
    } else if (reqMatchingTopics.length === 0) {
      setReqTopicId("");
    }
  }, [reqMatchingTopics, reqTopicId]);

  const runAction = async (payload: Record<string, unknown>, okText: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lms/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed.");
      await loadData();
      setFeedback({ type: "ok", text: okText });
      return json;
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Action failed." });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleAdminFileUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingFile(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/lms/videos/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setVidUrl(json.videoUrl);
      if (!vidTitle.trim()) {
        setVidTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      }
      setFeedback({
        type: "ok",
        text: `Video "${file.name}" uploaded cleanly. Click Publish Video Lesson to save.`,
      });
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Upload failed." });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAdminMaterialUpload = async (file: File | null) => {
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
      setAdminMaterials((prev) => [
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
        text: `Material "${file.name}" attached for download.`,
      });
    } catch (err: any) {
      setFeedback({ type: "err", text: err?.message || "Material upload failed." });
    } finally {
      setUploadingMaterial(false);
    }
  };

  const subName = (id: string) => subjects.find((s) => s.id === id)?.name || id;
  const termName = (id: string) => terms.find((t) => t.id === id)?.name || id;
  const levelCode = (id: string) => classLevels.find((c) => c.id === id)?.code || id;
  const topicTitle = (id: string) => topics.find((t) => t.id === id)?.title || id;

  const isTeacherApprovedForReq = (t: any) =>
    Array.isArray(t.approvals) &&
    t.approvals.some(
      (a: any) =>
        a.subjectId === reqSubjectId &&
        (!reqLevelId || a.classLevelId === reqLevelId)
    );

  const previewYtId =
    vidSourceMode === "YOUTUBE" ? parseYouTubeIdClient(vidUrl) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
            School Admin · Curriculum Video Control
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Video Lessons, Curated Topics &amp; Teacher Requests
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Organize curriculum topics by Subject &amp; Term, request subject teachers to
            record or upload topic videos, approve submissions, or curate YouTube lessons.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
          >
            <Eye size={15} />
            Student View (/videos)
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Curriculum Topics</p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums">
            {topics.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Published Videos</p>
          <p className="text-2xl font-extrabold text-[#0D9488] mt-1 tabular-nums">
            {videos.filter((v) => v.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Pending Teacher Uploads</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {requests.filter((r) => r.status === "REQUESTED").length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Submitted for Review</p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums">
            {requests.filter((r) => r.status === "SUBMITTED").length}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 border ${
            feedback.type === "ok"
              ? "bg-teal-50 text-[#0D9488] border-teal-200"
              : "bg-red-50 text-red-700 border-red-200"
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

      {/* Workspace Switch Tabs */}
      <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
            activeTab === "requests"
              ? "bg-white text-[#0B1F3A] shadow-xs"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          <Send size={14} /> Assign &amp; Review Teacher Requests
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("curriculum")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
            activeTab === "curriculum"
              ? "bg-white text-[#0B1F3A] shadow-xs"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          <BookOpen size={14} /> Topics &amp; Curated Library
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
          Loading video management workspace...
        </div>
      ) : activeTab === "requests" ? (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Assign Video Upload Request Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await runAction(
                {
                  action: "ASSIGN_VIDEO_REQUEST",
                  topicId: reqTopicId,
                  teacherUserId: reqTeacherId,
                  dueDate: reqDueDate,
                  instructions: reqInstructions,
                },
                "Video upload request assigned and notification sent to teacher."
              );
              if (res) {
                setReqInstructions("");
                setReqDueDate("");
              }
            }}
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
              <Send size={16} className="text-[#0D9488]" />
              Assign Teacher Video Request
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Subject
                </label>
                <select
                  value={reqSubjectId}
                  onChange={(e) => setReqSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Class Level
                </label>
                <select
                  value={reqLevelId}
                  onChange={(e) => setReqLevelId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  {classLevels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Academic Term
              </label>
              <select
                value={reqTermId}
                onChange={(e) => setReqTermId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Topic
              </label>
              <select
                required
                value={reqTopicId}
                onChange={(e) => setReqTopicId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {reqMatchingTopics.length === 0 ? (
                  <option value="">
                    No topics found — create one in Topics &amp; Curated Library tab
                  </option>
                ) : (
                  reqMatchingTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.weekLabel ? `${t.weekLabel}: ` : ""}
                      {t.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Assign Teacher
              </label>
              <select
                required
                value={reqTeacherId}
                onChange={(e) => setReqTeacherId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {teachers.length === 0 ? (
                  <option value="">No active teachers available</option>
                ) : (
                  teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                      {isTeacherApprovedForReq(t) ? " (Approved Subject Teacher)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Due Date (optional)
              </label>
              <input
                type="date"
                value={reqDueDate}
                onChange={(e) => setReqDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Brief / Recording Instructions
              </label>
              <textarea
                rows={3}
                value={reqInstructions}
                onChange={(e) => setReqInstructions(e.target.value)}
                placeholder="e.g. Record a 10–12 min WAEC solved-examples walkthrough for SS2 learners."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !reqTopicId || !reqTeacherId}
              className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50"
            >
              {saving ? "Sending Request..." : "Assign Upload Request"}
            </button>
          </form>

          {/* Upload Requests Tracking & Review Queue */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <ClipboardList size={16} className="text-[#0D9488]" />
                Teacher Video Requests ({requests.length})
              </h2>
            </div>

            {requests.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No video upload requests created yet. Assign a teacher on the left to get
                started.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const linkedVideo = r.fulfilledVideoId
                    ? videos.find((v) => v.id === r.fulfilledVideoId)
                    : null;

                  return (
                    <div key={r.id} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-bold text-[#0D9488]">
                              {subName(r.subjectId)} · {levelCode(r.classLevelId)} ·{" "}
                              {termName(r.termId)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Teacher: {r.teacherName}</span>
                            {r.dueDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">Due {r.dueDate}</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-[#0B1F3A] mt-1">
                            {topicTitle(r.topicId)}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">{r.instructions}</p>
                        </div>

                        <span className="text-xs font-bold text-[#0B1F3A] shrink-0">
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {linkedVideo && (
                        <div className="rounded-xl bg-[#F7F8FA] border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs">
                            <p className="font-bold text-[#0B1F3A]">
                              Submitted: {linkedVideo.title}
                            </p>
                            <p className="text-slate-500">
                              Source:{" "}
                              {linkedVideo.sourceType === "UPLOADED_VIDEO"
                                ? "Uploaded Video File"
                                : "Curated Video Link"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(linkedVideo)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0B1F3A] hover:bg-slate-50 shrink-0"
                          >
                            <Eye size={13} /> Watch Submission
                          </button>
                        </div>
                      )}

                      {r.status === "SUBMITTED" && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            value={reviewNotesMap[r.id] || ""}
                            onChange={(e) =>
                              setReviewNotesMap((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional approval note or revision feedback..."
                            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              runAction(
                                {
                                  action: "REVIEW_VIDEO_REQUEST",
                                  requestId: r.id,
                                  decision: "APPROVED",
                                  adminReviewNotes: reviewNotesMap[r.id] || "",
                                },
                                "Submission approved and teacher notified."
                              )
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700"
                          >
                            Approve &amp; Publish
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              runAction(
                                {
                                  action: "REVIEW_VIDEO_REQUEST",
                                  requestId: r.id,
                                  decision: "REVISION_REQUESTED",
                                  adminReviewNotes:
                                    reviewNotesMap[r.id] ||
                                    "Please update the video clarity or syllabus coverage.",
                                },
                                "Revision requested from teacher."
                              )
                            }
                            className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100"
                          >
                            Request Revision
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CURRICULUM TOPICS & CURATED LIBRARY TAB */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Create Curriculum Topic */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await runAction(
                  {
                    action: "CREATE_TOPIC",
                    subjectId: topSubjectId,
                    termId: topTermId,
                    classLevelId: topLevelId,
                    title: topTitle,
                    weekLabel: topWeek,
                    description: topDesc,
                  },
                  `Topic "${topTitle}" added.`
                );
                if (res?.topic) {
                  setVidTopicId(res.topic.id);
                  setTopTitle("");
                  setTopWeek("");
                  setTopDesc("");
                }
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <Plus size={16} className="text-[#0D9488]" />
                Add Curriculum Topic
              </h2>

              <div className="grid grid-cols-3 gap-2.5">
                <select
                  value={topSubjectId}
                  onChange={(e) => setTopSubjectId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={topTermId}
                  onChange={(e) => setTopTermId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={topLevelId}
                  onChange={(e) => setTopLevelId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  {classLevels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  required
                  value={topTitle}
                  onChange={(e) => setTopTitle(e.target.value)}
                  placeholder="Topic title (e.g. Organic Hydrocarbons)"
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={topWeek}
                  onChange={(e) => setTopWeek(e.target.value)}
                  placeholder="Week (e.g. Week 4)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <textarea
                rows={2}
                value={topDesc}
                onChange={(e) => setTopDesc(e.target.value)}
                placeholder="Topic overview & WAEC/NECO learning objectives..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#0B1F3A] text-white text-sm font-bold hover:bg-[#143258] disabled:opacity-50"
              >
                Create Topic
              </button>
            </form>

            {/* Add Curated YouTube or Uploaded Video Directly */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await runAction(
                  {
                    action: "CREATE_VIDEO_LESSON",
                    topicId: vidTopicId,
                    title: vidTitle,
                    description: vidDesc,
                    durationLabel: vidDuration,
                    sourceType: vidSourceMode,
                    videoUrl: vidUrl,
                    materials: adminMaterials,
                  },
                  "Video lesson added to curriculum library."
                );
                if (res) {
                  setVidTitle("");
                  setVidDesc("");
                  setVidDuration("");
                  setVidUrl("");
                  setAdminMaterials([]);
                }
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                  <Film size={16} className="text-[#0D9488]" />
                  Add Curated Video or Upload
                </h2>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVidSourceMode("YOUTUBE");
                      setVidUrl("");
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      vidSourceMode === "YOUTUBE"
                        ? "bg-white text-[#0B1F3A] shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    YouTube / Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVidSourceMode("UPLOADED_VIDEO");
                      setVidUrl("");
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      vidSourceMode === "UPLOADED_VIDEO"
                        ? "bg-white text-[#0B1F3A] shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Topic
                </label>
                <select
                  required
                  value={vidTopicId}
                  onChange={(e) => setVidTopicId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {subName(t.subjectId)} ({levelCode(t.classLevelId)} ·{" "}
                      {termName(t.termId)}) — {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5">
                <input
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="Lesson title"
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value)}
                  placeholder="Duration (10:15)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                />
              </div>

              {vidSourceMode === "YOUTUBE" ? (
                <div className="space-y-2">
                  <input
                    required
                    value={vidUrl}
                    onChange={(e) => setVidUrl(e.target.value)}
                    placeholder="Paste YouTube URL or https:// lesson link..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  {previewYtId && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-w-xs bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${previewYtId}?rel=0`}
                        title="Curated preview"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-[#F7F8FA] p-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 truncate">
                    {vidUrl ? `Uploaded: ${vidUrl}` : "Select .mp4 / .webm / .mov file"}
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer shrink-0">
                    <UploadCloud size={14} />
                    {uploadingFile ? "Uploading..." : "Upload Video"}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      disabled={uploadingFile}
                      className="hidden"
                      onChange={(e) => handleAdminFileUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}

              <textarea
                rows={2}
                value={vidDesc}
                onChange={(e) => setVidDesc(e.target.value)}
                placeholder="Brief summary for students..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />

              <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Study Material Attachment (Optional)
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0D9488] text-xs font-bold text-[#0B1F3A] cursor-pointer">
                    <FileText size={13} className="text-[#0D9488]" />
                    {uploadingMaterial ? "Uploading..." : "Attach PDF / Slides"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg"
                      disabled={uploadingMaterial}
                      className="hidden"
                      onChange={(e) => handleAdminMaterialUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {adminMaterials.length > 0 && (
                  <div className="space-y-1">
                    {adminMaterials.map((m, idx) => (
                      <div
                        key={`${m.url}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs"
                      >
                        <span className="truncate font-medium text-[#0B1F3A]">
                          {m.type} · {m.title}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdminMaterials((p) => p.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 font-semibold hover:underline"
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
                disabled={saving || uploadingFile || uploadingMaterial || !vidTopicId || !vidUrl}
                className="w-full py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-bold hover:bg-teal-700 disabled:opacity-50"
              >
                Publish Video Lesson
              </button>
            </form>
          </div>

          {/* All Topics & Attached Videos */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0B1F3A]">
                All Curriculum Topics &amp; Attached Videos ({topics.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {topics.map((t) => {
                const tVideos = videos.filter((v) => v.topicId === t.id);
                return (
                  <div key={t.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#0D9488]">
                          {subName(t.subjectId)} · {levelCode(t.classLevelId)} ·{" "}
                          {termName(t.termId)}
                          {t.weekLabel ? ` · ${t.weekLabel}` : ""}
                        </p>
                        <h3 className="text-sm font-bold text-[#0B1F3A] mt-0.5">
                          {t.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 tabular-nums">
                          {tVideos.length} video(s)
                        </span>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            runAction(
                              { action: "DELETE_TOPIC", topicId: t.id },
                              `Topic "${t.title}" deleted.`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={12} /> Delete Topic
                        </button>
                      </div>
                    </div>

                    {tVideos.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {tVideos.map((v) => (
                          <div
                            key={v.id}
                            className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#0B1F3A] truncate">
                                {v.title}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                {v.sourceType === "YOUTUBE" ? (
                                  <PlayCircle size={12} className="text-red-600 shrink-0" />
                                ) : (
                                  <Film size={12} className="text-[#0D9488] shrink-0" />
                                )}
                                <span className="truncate">{v.uploadedByName}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(v)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#0B1F3A] hover:bg-slate-100"
                                title="Preview video"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  runAction(
                                    { action: "DELETE_VIDEO_LESSON", videoId: v.id },
                                    "Video lesson removed."
                                  )
                                }
                                className="p-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50"
                                title="Remove video"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#0D9488]">
                  {subName(previewVideo.subjectId)} · {topicTitle(previewVideo.topicId)}
                </p>
                <h3 className="text-lg font-bold text-[#0B1F3A]">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Film,
  Lock,
  NotebookPen,
  Play,
  PlaySquare,
  Search,
  Sparkles,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import VideoLessonPlayer, { type VideoLessonItem } from "./VideoLessonPlayer";
import VideoLessonStudyCompanion from "./VideoLessonStudyCompanion";
import { saveNoteToNotebook } from "@frontend/lib/notebookStorage";

interface ClassLevelItem {
  id: string;
  code: string;
  name: string;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string;
  classLevelIds: string[];
}

interface TermItem {
  id: string;
  sessionId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
}

interface TopicItem {
  id: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  topicOrder: number;
  weekLabel?: string;
  title: string;
  description: string;
}

export default function StudentVideoPortal() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("STUDENT");
  const [classLevels, setClassLevels] = useState<ClassLevelItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [videos, setVideos] = useState<VideoLessonItem[]>([]);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [enrolment, setEnrolment] = useState<any>(null);

  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);

  // Stage 4 Study Companion & Notebook Drawer state
  const [companionTab, setCompanionTab] = useState<"playlist" | "nova" | "materials">(
    "playlist"
  );
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [draftingNote, setDraftingNote] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("learnova_watched_videos");
      if (saved) setWatchedIds(JSON.parse(saved));
    } catch {
      // ignore storage read error
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/videos", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();

      setRole(json.role || "STUDENT");
      const lvls: ClassLevelItem[] = json.classLevels || [];
      setClassLevels(lvls);
      setSubjects(json.subjects || []);
      setTerms(json.terms || []);
      setTopics(json.topics || []);
      setVideos(json.videos || []);
      setEntitlement(json.entitlement || null);
      setEnrolment(json.enrolment || null);
      setNowMs(Date.now());

      const defaultLvl =
        json.entitlement?.classLevelId ||
        json.enrolment?.classLevelId ||
        lvls.find((c) => c.code === "SS2")?.id ||
        lvls[0]?.id ||
        "";

      setSelectedLevelId((prev) => prev || defaultLvl);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Honor optional URL query parameters (?subjectId=...&termId=...&topicId=...&videoId=...)
  useEffect(() => {
    const qSub = searchParams.get("subjectId");
    const qTerm = searchParams.get("termId");
    const qTopic = searchParams.get("topicId");
    const qVid = searchParams.get("videoId");
    if (qSub) setSelectedSubjectId(qSub);
    if (qTerm) setSelectedTermId(qTerm);
    if (qTopic) setSelectedTopicId(qTopic);
    if (qVid) setActiveVideoId(qVid);
  }, [searchParams]);

  const isPrivilegedViewer =
    role === "ADMIN" || role === "SUPER_ADMIN" || role === "TEACHER";

  const hasActiveSub =
    isPrivilegedViewer ||
    (entitlement &&
      (entitlement.accessStatus === "ACTIVE_PAID" ||
        entitlement.accessStatus === "SCHOLARSHIP_GRANTED") &&
      (!entitlement.expiresAt ||
        !nowMs ||
        new Date(entitlement.expiresAt).getTime() > nowMs));

  const isSubjectUnlocked = useCallback(
    (subjectId: string) => {
      if (isPrivilegedViewer) return true;
      if (!entitlement) return true;
      if (!hasActiveSub) return true;
      if (entitlement?.allSubjects) return true;
      return (entitlement?.subjectIds || []).includes(subjectId);
    },
    [isPrivilegedViewer, hasActiveSub, entitlement]
  );

  const visibleSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return subjects.filter((s) => {
      const matchesLevel =
        !selectedLevelId ||
        (s.classLevelIds || []).length === 0 ||
        (s.classLevelIds || []).includes(selectedLevelId);
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [subjects, selectedLevelId, subjectSearch]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const selectedTerm = useMemo(
    () => terms.find((t) => t.id === selectedTermId) || null,
    [terms, selectedTermId]
  );

  // Topics matching Subject + Term (matching selected class level or all levels for that subject+term if level-filtered empty)
  const termTopics = useMemo(() => {
    if (!selectedSubjectId || !selectedTermId) return [];
    const exactLevel = topics.filter(
      (t) =>
        t.subjectId === selectedSubjectId &&
        t.termId === selectedTermId &&
        (!selectedLevelId || t.classLevelId === selectedLevelId)
    );
    if (exactLevel.length > 0) return exactLevel;
    return topics.filter(
      (t) => t.subjectId === selectedSubjectId && t.termId === selectedTermId
    );
  }, [topics, selectedSubjectId, selectedTermId, selectedLevelId]);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) || null,
    [topics, selectedTopicId]
  );

  const topicVideos = useMemo(() => {
    if (!selectedTopicId) return [];
    return videos.filter((v) => v.topicId === selectedTopicId);
  }, [videos, selectedTopicId]);

  const activeVideo = useMemo(() => {
    if (topicVideos.length === 0) return null;
    return (
      topicVideos.find((v) => v.id === activeVideoId) || topicVideos[0]
    );
  }, [topicVideos, activeVideoId]);

  const selectVideoAndRecordView = useCallback(async (video: VideoLessonItem) => {
    setActiveVideoId(video.id);
    try {
      await fetch("/api/lms/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECORD_VIDEO_VIEW", videoId: video.id }),
      });
    } catch {
      // non-fatal
    }
  }, []);

  const toggleWatched = (videoId: string) => {
    setWatchedIds((prev) => {
      const next = prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId];
      try {
        localStorage.setItem("learnova_watched_videos", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const countTopicsForSubject = (subjectId: string) =>
    topics.filter(
      (t) =>
        t.subjectId === subjectId &&
        (!selectedLevelId || t.classLevelId === selectedLevelId)
    ).length || topics.filter((t) => t.subjectId === subjectId).length;

  const countVideosForSubject = (subjectId: string) =>
    videos.filter(
      (v) =>
        v.subjectId === subjectId &&
        (!selectedLevelId || v.classLevelId === selectedLevelId)
    ).length || videos.filter((v) => v.subjectId === subjectId).length;

  const countTopicsForTerm = (subjectId: string, termId: string) =>
    topics.filter(
      (t) =>
        t.subjectId === subjectId &&
        t.termId === termId &&
        (!selectedLevelId || t.classLevelId === selectedLevelId)
    ).length ||
    topics.filter((t) => t.subjectId === subjectId && t.termId === termId).length;

  const countVideosForTerm = (subjectId: string, termId: string) =>
    videos.filter(
      (v) =>
        v.subjectId === subjectId &&
        v.termId === termId &&
        (!selectedLevelId || v.classLevelId === selectedLevelId)
    ).length ||
    videos.filter((v) => v.subjectId === subjectId && v.termId === termId).length;

  const currentStage: "SUBJECT" | "TERM" | "TOPIC" | "PLAYER" = selectedTopic
    ? "PLAYER"
    : selectedTerm
    ? "TOPIC"
    : selectedSubject
    ? "TERM"
    : "SUBJECT";

  const activeTopicIndex = termTopics.findIndex((t) => t.id === selectedTopicId);

  const selectedLevelCode =
    classLevels.find((c) => c.id === selectedLevelId)?.code || "All Levels";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
            Video Lessons Studio · {selectedLevelCode}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Curriculum Video Library
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Navigate step by step from Subject to Academic Term, Curriculum Topic,
            and recorded teacher walkthroughs or curated YouTube explanations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {classLevels.length > 0 && (
            <select
              aria-label="Class Level"
              value={selectedLevelId}
              onChange={(e) => {
                setSelectedLevelId(e.target.value);
                setSelectedTopicId("");
                setActiveVideoId("");
              }}
              className="rounded-xl bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-semibold px-3.5 py-2.5 outline-none focus:border-[#0D9488]"
            >
              <option value="" className="text-slate-900">
                All Class Levels
              </option>
              {classLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id} className="text-slate-900">
                  {lvl.code} — {lvl.name}
                </option>
              ))}
            </select>
          )}
          {isPrivilegedViewer && (
            <Link
              href={role === "TEACHER" ? "/teacher/videos" : "/admin/videos"}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-600 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
            >
              <UploadCloud size={15} />
              Manage Videos
            </Link>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Video curriculum navigation"
        className="flex flex-wrap items-center gap-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl px-4 py-3"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedSubjectId("");
            setSelectedTermId("");
            setSelectedTopicId("");
            setActiveVideoId("");
          }}
          className={`font-semibold transition whitespace-nowrap ${
            currentStage === "SUBJECT"
              ? "text-[#0D9488]"
              : "text-slate-600 hover:text-[#0B1F3A]"
          }`}
        >
          1. Subjects
        </button>

        {selectedSubject && (
          <>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setSelectedTermId("");
                setSelectedTopicId("");
                setActiveVideoId("");
              }}
              className={`font-semibold transition whitespace-nowrap ${
                currentStage === "TERM"
                  ? "text-[#0D9488]"
                  : "text-slate-600 hover:text-[#0B1F3A]"
              }`}
            >
              2. {selectedSubject.name}
            </button>
          </>
        )}

        {selectedTerm && (
          <>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setSelectedTopicId("");
                setActiveVideoId("");
              }}
              className={`font-semibold transition whitespace-nowrap ${
                currentStage === "TOPIC"
                  ? "text-[#0D9488]"
                  : "text-slate-600 hover:text-[#0B1F3A]"
              }`}
            >
              3. {selectedTerm.name}
            </button>
          </>
        )}

        {selectedTopic && (
          <>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="font-bold text-[#0B1F3A] truncate max-w-xs sm:max-w-md">
              4. {selectedTopic.title}
            </span>
          </>
        )}
      </nav>

      {/* Non-blocking Subscription Notice when no paid plan is active yet */}
      {!loading && !hasActiveSub && !isPrivilegedViewer && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-900">
              Open Curriculum Video Access · Live Classrooms Require an Active Plan
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {enrolment?.classLevelId
                ? "Browse recorded topic lessons freely. Activate a plan under Subscriptions for live classrooms and CBT modules."
                : "Browse subject and term video lessons freely, or choose a subscription plan anytime."}
            </p>
          </div>
          <Link
            href="/subscriptions"
            className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold shrink-0 whitespace-nowrap"
          >
            View Plans (₦)
          </Link>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500">
          Loading curriculum video library...
        </div>
      ) : currentStage === "SUBJECT" ? (
        /* STAGE 1: SUBJECT DIRECTORY */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                Step 1 · Select a Subject ({visibleSubjects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Choose a subject to view its First, Second, and Third Term curriculum topics.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2 w-full sm:w-72">
              <Search size={15} className="text-slate-400" />
              <input
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects..."
                className="bg-transparent outline-none text-sm text-[#0F1F38] w-full"
              />
            </div>
          </div>

          {visibleSubjects.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-sm text-slate-500">
              No active subjects match this class level or filter.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleSubjects.map((sub) => {
                const unlocked = isSubjectUnlocked(sub.id);
                const topicCount = countTopicsForSubject(sub.id);
                const videoCount = countVideosForSubject(sub.id);

                return (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4 hover:border-[#0D9488] transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-[#0D9488]">
                          {sub.code} · {sub.department}
                        </span>
                        <span className="tabular-nums">
                          {topicCount} topics · {videoCount} videos
                        </span>
                      </div>

                      <h3 className="mt-2.5 text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                        <BookOpen size={18} className="text-[#0B1F3A] shrink-0" />
                        <span>{sub.name}</span>
                      </h3>

                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {sub.description}
                      </p>
                    </div>

                    {unlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubjectId(sub.id);
                          setSelectedTermId("");
                          setSelectedTopicId("");
                          setActiveVideoId("");
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                      >
                        Browse Terms &amp; Topics
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <Link
                        href="/subscriptions"
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-amber-100 transition"
                      >
                        <Lock size={13} />
                        Subscribe to Unlock Videos
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : currentStage === "TERM" && selectedSubject ? (
        /* STAGE 2: TERM SELECTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                Step 2 · Choose Term for {selectedSubject.name}
              </h2>
              <p className="text-xs text-slate-500">
                Select an academic term to inspect scheduled curriculum topics and video lessons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSubjectId("")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> All Subjects
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {terms.map((term) => {
              const tCount = countTopicsForTerm(selectedSubject.id, term.id);
              const vCount = countVideosForTerm(selectedSubject.id, term.id);
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => {
                    setSelectedTermId(term.id);
                    setSelectedTopicId("");
                    setActiveVideoId("");
                  }}
                  className="text-left rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#0D9488] transition flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0D9488] inline-flex items-center gap-1">
                        <CalendarRange size={13} />
                        {term.isCurrent ? "Current Term" : "Academic Term"}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {term.startsAt} – {term.endsAt}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-[#0B1F3A]">
                      {term.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 tabular-nums">
                      {tCount} curriculum {tCount === 1 ? "topic" : "topics"} ·{" "}
                      {vCount} video {vCount === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                    Open Term Topics <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : currentStage === "TOPIC" && selectedSubject && selectedTerm ? (
        /* STAGE 3: TOPIC LIST */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">
                Step 3 · {selectedSubject.name} — {selectedTerm.name} Topics
              </h2>
              <p className="text-xs text-slate-500">
                Select any topic to watch teacher-recorded walkthroughs and curated YouTube lessons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTermId("")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Back to Terms
            </button>
          </div>

          {termTopics.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-2">
              <PlaySquare size={28} className="mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-[#0B1F3A]">
                No topics published yet for {selectedSubject.name} ({selectedTerm.name})
              </p>
              <p className="text-xs text-slate-500">
                Try another term or ask your subject teacher to add video lessons for this unit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {termTopics.map((topic, index) => {
                const vList = videos.filter((v) => v.topicId === topic.id);
                const teacherCount = vList.filter(
                  (v) => v.sourceType === "UPLOADED_VIDEO"
                ).length;
                const curatedCount = vList.length - teacherCount;
                const allWatched =
                  vList.length > 0 &&
                  vList.every((v) => watchedIds.includes(v.id));

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      if (vList[0]) {
                        selectVideoAndRecordView(vList[0]);
                      } else {
                        setActiveVideoId("");
                      }
                    }}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 hover:border-[#0D9488] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-[#0D9488] tabular-nums">
                          {String(index + 1).padStart(2, "0")}.{" "}
                          {topic.weekLabel || `Topic ${topic.topicOrder}`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {vList.length} video {vList.length === 1 ? "lesson" : "lessons"}
                        </span>
                        {teacherCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{teacherCount} teacher upload</span>
                          </>
                        )}
                        {curatedCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{curatedCount} curated link</span>
                          </>
                        )}
                        {allWatched && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0D9488]">
                              <CheckCircle2 size={13} /> Completed
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A]">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {topic.description}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold shrink-0 whitespace-nowrap">
                      <Play size={14} />
                      {vList.length > 0 ? "Watch Lessons" : "View Topic"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : selectedTopic && selectedSubject && selectedTerm ? (
        /* STAGE 4: TOPIC VIDEO THEATER */
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#0D9488]">
                {selectedSubject.name} · {selectedTerm.name} ·{" "}
                {selectedTopic.weekLabel || `Topic ${selectedTopic.topicOrder}`}
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A]">
                {selectedTopic.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedTopicId("");
                setActiveVideoId("");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Back to Topics
            </button>
          </div>

          {topicVideos.length === 0 || !activeVideo ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <Film size={32} className="mx-auto text-slate-400" />
              <h3 className="text-base font-bold text-[#0B1F3A]">
                No video lessons uploaded for this topic yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {selectedTopic.description}
              </p>
              <div className="pt-2">
                <Link
                  href={`/nova?subject=${encodeURIComponent(
                    `${selectedSubject.name}: ${selectedTopic.title}`
                  )}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold"
                >
                  <Sparkles size={14} /> Ask Nova AI About This Topic
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              {/* Left 2/3 Interactive Video Stage */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <VideoLessonPlayer video={activeVideo} />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#0D9488]">
                        {activeVideo.sourceType === "UPLOADED_VIDEO"
                          ? "Teacher Recorded Video"
                          : activeVideo.sourceType === "YOUTUBE"
                          ? "Curated YouTube Lesson"
                          : "Curated External Video"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>By {activeVideo.uploadedByName}</span>
                      {activeVideo.durationLabel && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {activeVideo.durationLabel}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {activeVideo.viewCount || 0} views
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A]">
                      {activeVideo.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {activeVideo.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWatched(activeVideo.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap ${
                      watchedIds.includes(activeVideo.id)
                        ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                        : "bg-[#0B1F3A] text-white hover:bg-[#143258]"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {watchedIds.includes(activeVideo.id)
                      ? "Marked Watched"
                      : "Mark Watched"}
                  </button>
                </div>

                {/* Study Companion Actions */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCompanionTab("nova")}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                          companionTab === "nova"
                            ? "bg-[#0B1F3A] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-[#0B1F3A]"
                        }`}
                      >
                        <Sparkles
                          size={13}
                          className={
                            companionTab === "nova" ? "text-[#F59E0B]" : "text-[#0D9488]"
                          }
                        />
                        Ask Nova AI
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNoteOpen((v) => !v);
                          setNoteSaved(false);
                          if (!noteTitle) {
                            setNoteTitle(`${selectedTopic.title}: ${activeVideo.title}`);
                          }
                          if (!noteBody) {
                            setNoteBody(
                              `Lesson: ${activeVideo.title}\nTerm: ${selectedTerm.name}\n\nKey Takeaways:\n- ${activeVideo.description}\n- `
                            );
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                          noteOpen || noteSaved
                            ? "bg-teal-50 border border-teal-200 text-[#0D9488]"
                            : "bg-slate-100 hover:bg-slate-200 text-[#0B1F3A]"
                        }`}
                      >
                        {noteSaved ? <Check size={13} /> : <NotebookPen size={13} />}
                        {noteSaved ? "Saved to Notebook" : "Add to Notebook"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompanionTab("materials")}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                          companionTab === "materials"
                            ? "bg-[#0D9488] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-[#0B1F3A]"
                        }`}
                      >
                        <Download size={13} />
                        Download Materials (
                        {(activeVideo.materials?.length || 0) + 1})
                      </button>
                    </div>

                    {activeVideo.sourceType === "EXTERNAL_LINK" && (
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0D9488] hover:underline"
                      >
                        Open Source Link <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Inline Add-to-Notebook Composer */}
                  {noteOpen && (
                    <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#0B1F3A]">
                            Save Lesson Note to {selectedSubject.name} Folder
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Stored directly in your Learnova Study Notebook.
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={draftingNote}
                          onClick={async () => {
                            setDraftingNote(true);
                            try {
                              const res = await fetch("/api/nova", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  message: `Create concise bullet-point study notes (formulas, key definitions, and 2 WAEC exam tips) for the lesson "${activeVideo.title}" under topic "${selectedTopic.title}" in ${selectedSubject.name}. Keep it structured for saving into a student notebook.`,
                                  mode: "fast",
                                  persona: "tutor",
                                  subjectHint: `${selectedSubject.name} · ${selectedTopic.title}`,
                                }),
                              });
                              const json = await res.json();
                              if (json.response) {
                                setNoteBody(json.response);
                              }
                            } finally {
                              setDraftingNote(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0D9488] text-[11px] font-bold text-[#0B1F3A] disabled:opacity-50"
                        >
                          {draftingNote ? (
                            <Loader2 size={12} className="animate-spin text-[#0D9488]" />
                          ) : (
                            <Sparkles size={12} className="text-[#D97706]" />
                          )}
                          {draftingNote ? "Drafting..." : "Auto-Draft Notes with Nova AI"}
                        </button>
                      </div>

                      <input
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0B1F3A]"
                      />
                      <textarea
                        rows={4}
                        value={noteBody}
                        onChange={(e) => setNoteBody(e.target.value)}
                        placeholder="Write your revision summary, formulas, or timestamps..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-[#0F1F38] leading-relaxed"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href="/notebook"
                          className="text-xs font-bold text-[#0D9488] hover:underline"
                        >
                          Open Study Notebook →
                        </Link>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNoteOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            disabled={!noteTitle.trim() || !noteBody.trim()}
                            onClick={() => {
                              saveNoteToNotebook({
                                title: noteTitle,
                                folder: selectedSubject.name,
                                content: noteBody,
                                sourceLabel: `Video Lesson · ${selectedTopic.title}`,
                              });
                              setNoteSaved(true);
                              setNoteOpen(false);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Save to Notebook
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1/3 Integrated Playlist, Nova AI & Downloadable Materials */}
              <VideoLessonStudyCompanion
                subjectName={selectedSubject.name}
                termName={selectedTerm.name}
                topic={selectedTopic}
                topicVideos={topicVideos}
                activeVideo={activeVideo}
                watchedIds={watchedIds}
                activeTab={companionTab}
                onChangeTab={setCompanionTab}
                onSelectVideo={(vid) => {
                  selectVideoAndRecordView(vid);
                  setNoteTitle(`${selectedTopic.title}: ${vid.title}`);
                  setNoteBody(
                    `Lesson: ${vid.title}\nTerm: ${selectedTerm.name}\n\nKey Takeaways:\n- ${vid.description}\n- `
                  );
                  setNoteSaved(false);
                }}
                canSwitchTopic={termTopics.length > 1}
                canPrevTopic={activeTopicIndex > 0}
                canNextTopic={
                  activeTopicIndex >= 0 && activeTopicIndex < termTopics.length - 1
                }
                onPrevTopic={() => {
                  const prev = termTopics[activeTopicIndex - 1];
                  if (prev) {
                    setSelectedTopicId(prev.id);
                    setActiveVideoId("");
                  }
                }}
                onNextTopic={() => {
                  const next = termTopics[activeTopicIndex + 1];
                  if (next) {
                    setSelectedTopicId(next.id);
                    setActiveVideoId("");
                  }
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

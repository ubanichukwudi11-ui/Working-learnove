import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { requireApiAuth } from "@/lib/serverAuth";
import { ai, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import { fetchDirectoryUsers, loadLmsState } from "@/lib/lmsDb";
import {
  getEligibleStudentsForLesson,
  validateTimetableEntry,
} from "@/lib/allocationEngine";
import type { LmsStateData, TimetableEntryRecord } from "@/lib/lmsTypes";

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function buildLiveSchoolSnapshot(
  state: LmsStateData,
  users: Awaited<ReturnType<typeof fetchDirectoryUsers>>
) {
  const activeLevels = state.classLevels.filter((c) => c.isActive);
  const activeSubjects = state.subjects.filter((s) => s.isActive);
  const approvedApprovals = state.teacherApprovals.filter(
    (a) => a.status === "APPROVED"
  );

  const pendingApps = state.teacherApplications.filter(
    (a) =>
      a.status === "PENDING_REVIEW" || a.status === "RESUBMISSION_REQUIRED"
  );
  const pendingPayments = state.paymentRecords.filter(
    (p) => p.status === "AWAITING_CONFIRMATION"
  );
  const activeEntitlements = state.studentEntitlements.filter(
    (e) =>
      e.accessStatus === "ACTIVE_PAID" ||
      e.accessStatus === "SCHOLARSHIP_GRANTED"
  );

  // Summarize approved teacher availability and entitled student demand per (level, subject)
  const readinessMatrix: Array<{
    classLevelId: string;
    classLevelCode: string;
    subjectId: string;
    subjectName: string;
    entitledStudents: number;
    approvedTeachers: Array<{ teacherUserId: string; teacherName: string }>;
    alreadyScheduledCount: number;
  }> = [];

  for (const lvl of activeLevels) {
    for (const sub of activeSubjects) {
      if (!(sub.classLevelIds || []).includes(lvl.id)) continue;
      const teachers = approvedApprovals
        .filter((a) => a.classLevelId === lvl.id && a.subjectId === sub.id)
        .map((a) => ({
          teacherUserId: a.teacherUserId,
          teacherName: a.teacherName,
        }));
      const eligible = getEligibleStudentsForLesson(
        state,
        users,
        lvl.id,
        sub.id
      );
      const scheduled = state.timetableEntries.filter(
        (t) =>
          t.classLevelId === lvl.id &&
          t.subjectId === sub.id &&
          t.publicationStatus !== "CANCELLED"
      ).length;

      if (teachers.length > 0 || eligible.length > 0 || scheduled > 0) {
        readinessMatrix.push({
          classLevelId: lvl.id,
          classLevelCode: lvl.code,
          subjectId: sub.id,
          subjectName: sub.name,
          entitledStudents: eligible.length,
          approvedTeachers: teachers,
          alreadyScheduledCount: scheduled,
        });
      }
    }
  }

  const existingSchedule = state.timetableEntries
    .filter((t) => t.publicationStatus !== "CANCELLED")
    .map((t) => ({
      id: t.id,
      classLevelId: t.classLevelId,
      classLevelCode:
        state.classLevels.find((c) => c.id === t.classLevelId)?.code ||
        t.classLevelId,
      subjectId: t.subjectId,
      subjectName:
        state.subjects.find((s) => s.id === t.subjectId)?.name || t.subjectId,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      assignedTeacherIds: t.assignedTeacherIds,
      publicationStatus: t.publicationStatus,
      allocationStatus: t.allocationStatus,
      eligibleStudentCount: t.eligibleStudentCount,
      shortfallCount: t.shortfallCount,
      maxCapacityPerRoom: t.maxCapacityPerRoom,
    }));

  return {
    schoolName: state.schools[0]?.name || "Learnova Digital Academy",
    currentSession: state.sessions.find((s) => s.isCurrent)?.name || "2025/2026",
    currentTerm: state.terms.find((t) => t.isCurrent)?.name || "Second Term",
    timezone: state.platformSettings.defaultTimezone || "Africa/Lagos",
    defaultRoomCapacity: state.platformSettings.defaultRoomCapacity || 50,
    counts: {
      totalStudents: users.filter((u) => u.role === "STUDENT").length,
      activeEntitledStudents: activeEntitlements.length,
      totalTeachers: users.filter((u) => u.role === "TEACHER").length,
      approvedTeacherPairs: approvedApprovals.length,
      pendingTeacherApplications: pendingApps.length,
      pendingBankTransfers: pendingPayments.length,
      publishedLessons: existingSchedule.filter(
        (e) => e.publicationStatus === "PUBLISHED"
      ).length,
      shortfallLessons: existingSchedule.filter(
        (e) => e.allocationStatus === "SHORTFALL"
      ).length,
      liveClassrooms: state.classrooms.filter((c) => c.status === "LIVE")
        .length,
      totalClassrooms: state.classrooms.length,
    },
    pendingTeacherApplicationsList: pendingApps.slice(0, 12).map((a) => ({
      teacherName: a.teacherName,
      subjectName: a.subjectName,
      status: a.status,
      requestedLevels: a.classLevelIds.map(
        (id) => state.classLevels.find((c) => c.id === id)?.code || id
      ),
    })),
    pendingPaymentsList: pendingPayments.slice(0, 12).map((p) => ({
      studentName: p.studentName,
      amountNgn: p.amountNgn,
      reference: p.reference,
      planName: p.planName,
    })),
    activeClassLevels: activeLevels.map((c) => ({ id: c.id, code: c.code, name: c.name })),
    activeSubjects: activeSubjects.map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department,
      classLevelIds: s.classLevelIds,
    })),
    readinessMatrix,
    existingSchedule,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const [state, users] = await Promise.all([
    loadLmsState(),
    fetchDirectoryUsers(),
  ]);
  const snapshot = buildLiveSchoolSnapshot(state, users);

  return NextResponse.json({
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    snapshot: {
      schoolName: snapshot.schoolName,
      currentSession: snapshot.currentSession,
      currentTerm: snapshot.currentTerm,
      defaultRoomCapacity: snapshot.defaultRoomCapacity,
      counts: snapshot.counts,
      activeClassLevels: snapshot.activeClassLevels,
      readinessMatrix: snapshot.readinessMatrix,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Gemini API key is not configured in the server environment. Add GEMINI_API_KEY to enable the Admin AI Copilot.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const action = String(body.action || "ASK_COPILOT");
    const [state, users] = await Promise.all([
      loadLmsState(),
      fetchDirectoryUsers(),
    ]);
    const snapshot = buildLiveSchoolSnapshot(state, users);

    if (action === "SUGGEST_TIMETABLE") {
      const goal = String(
        body.goal ||
          "Generate conflict-free Nigerian secondary school timetable slots prioritizing subjects with approved teachers and entitled students."
      ).trim();
      const targetClassLevelId = String(body.targetClassLevelId || "").trim();
      const requestedCapacity = Number(
        body.maxCapacityPerRoom || snapshot.defaultRoomCapacity || 50
      );

      const prompt = `
You are Learnova's Academic Timetable Scheduling AI for Nigerian secondary schools (JSS1–SS3, Africa/Lagos WAT).

ADMIN SCHEDULING GOAL:
"${goal}"
${targetClassLevelId ? `FOCUS CLASS LEVEL ID: ${targetClassLevelId}` : "FOCUS: Any class levels that have approved teachers."}
DEFAULT ROOM CAPACITY: ${requestedCapacity}

STRICT SCHEDULING RULES:
1. You MUST ONLY use real classLevelId, subjectId, and teacherUserId values from "readinessMatrix" below where "approvedTeachers" is NON-EMPTY. Never invent IDs or assign unapproved teachers!
2. Never overlap a teacher's time window (same dayOfWeek + overlapping startTime..endTime) with any slot in "existingSchedule" OR with another slot you propose in this same response.
3. Never overlap a classLevelId's time window (same dayOfWeek + overlapping startTime..endTime) with any slot in "existingSchedule" OR with another slot you propose in this same response.
4. Use realistic WAT school hours between 08:00 and 16:00 (24-hour HH:MM format, e.g. "09:00" to "10:00", Monday–Friday unless requested otherwise).
5. If a subject has more entitledStudents than maxCapacityPerRoom, assign enough approved teachers from that row's approvedTeachers list so ceil(entitledStudents / maxCapacityPerRoom) <= assignedTeacherIds.length, or note the shortfall clearly in rationale.
6. If readinessMatrix has NO rows with approvedTeachers, return an empty suggestions array and explain in "summary" which subjects/levels need teacher approvals in /admin/teachers first.
7. Propose up to 6 high-value, conflict-free timetable slots.

LIVE SCHOOL DATA SNAPSHOT (JSON):
${JSON.stringify(
  {
    currentSession: snapshot.currentSession,
    currentTerm: snapshot.currentTerm,
    defaultRoomCapacity: requestedCapacity,
    readinessMatrix: snapshot.readinessMatrix,
    existingSchedule: snapshot.existingSchedule,
  },
  null,
  2
)}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            "Return valid JSON strictly matching the schema. Only select IDs present in readinessMatrix. Keep rationale crisp and practical for Nigerian school administrators.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description:
                  "Brief executive overview of the generated schedule or blockers (e.g. missing teacher approvals).",
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    classLevelId: { type: Type.STRING },
                    subjectId: { type: Type.STRING },
                    assignedTeacherIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    dayOfWeek: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    mode: { type: Type.STRING },
                    maxCapacityPerRoom: { type: Type.INTEGER },
                    rationale: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text || "{}").trim();
      let parsed: { summary?: string; suggestions?: any[] } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {
          summary: "AI returned an unexpected format. Please try again.",
          suggestions: [],
        };
      }

      // Clone state cleanly so we validate each proposed slot sequentially against real rules AND earlier proposals
      const workingState: LmsStateData = JSON.parse(JSON.stringify(state));
      const validatedSuggestions = (parsed.suggestions || []).map((item, idx) => {
        const day = VALID_DAYS.includes(item.dayOfWeek)
          ? (item.dayOfWeek as TimetableEntryRecord["dayOfWeek"])
          : "Monday";
        const mode = (["ONLINE", "HYBRID", "PHYSICAL"].includes(item.mode)
          ? item.mode
          : "ONLINE") as TimetableEntryRecord["mode"];
        const cap = Math.max(
          1,
          Number(item.maxCapacityPerRoom || requestedCapacity || 50)
        );
        const teacherIds: string[] = Array.isArray(item.assignedTeacherIds)
          ? item.assignedTeacherIds.map(String)
          : [];

        const validation = validateTimetableEntry(workingState, users, {
          classLevelId: String(item.classLevelId || ""),
          subjectId: String(item.subjectId || ""),
          assignedTeacherIds: teacherIds,
          dayOfWeek: day,
          startTime: String(item.startTime || "09:00"),
          endTime: String(item.endTime || "10:00"),
          maxCapacityPerRoom: cap,
          publicationStatus: "PUBLISHED",
        });

        // Reserve valid proposal in workingState so later slots in the batch check against it
        if (validation.valid) {
          workingState.timetableEntries.push({
            id: `ai-preview-${idx}`,
            sessionId: "",
            termId: "",
            classLevelId: String(item.classLevelId || ""),
            subjectId: String(item.subjectId || ""),
            assignedTeacherIds: teacherIds,
            dayOfWeek: day,
            startTime: String(item.startTime || "09:00"),
            endTime: String(item.endTime || "10:00"),
            durationMinutes: 60,
            mode,
            maxCapacityPerRoom: cap,
            publicationStatus: "PUBLISHED",
            allocationStatus: "UNALLOCATED",
            eligibleStudentCount: 0,
            shortfallCount: 0,
            createdBy: auth.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        const level = state.classLevels.find((c) => c.id === item.classLevelId);
        const subject = state.subjects.find((s) => s.id === item.subjectId);
        const eligibleCount = getEligibleStudentsForLesson(
          state,
          users,
          String(item.classLevelId || ""),
          String(item.subjectId || "")
        ).length;

        const teacherNames = teacherIds.map(
          (tid) =>
            users.find((u) => u.id === tid)?.fullName ||
            state.teacherApprovals.find((a) => a.teacherUserId === tid)
              ?.teacherName ||
            tid
        );

        return {
          tempId: `ai-slot-${Date.now()}-${idx}`,
          classLevelId: String(item.classLevelId || ""),
          classLevelCode: level?.code || String(item.classLevelId || ""),
          subjectId: String(item.subjectId || ""),
          subjectName: subject?.name || String(item.subjectId || ""),
          assignedTeacherIds: teacherIds,
          teacherNames,
          dayOfWeek: day,
          startTime: String(item.startTime || "09:00"),
          endTime: String(item.endTime || "10:00"),
          mode,
          maxCapacityPerRoom: cap,
          eligibleStudentCount: eligibleCount,
          rationale: String(item.rationale || ""),
          validation,
        };
      });

      return NextResponse.json({
        success: true,
        summary: parsed.summary || "Generated AI timetable recommendations.",
        suggestions: validatedSuggestions,
      });
    }

    // Default: ASK_COPILOT (general school admin operations assistant)
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Please enter a question or administrative task." },
        { status: 400 }
      );
    }

    const history: Array<{ role: string; text: string }> = Array.isArray(
      body.history
    )
      ? body.history.slice(-8)
      : [];

    const historyBlock = history.length
      ? history
          .map(
            (m) =>
              `${m.role === "assistant" ? "Copilot" : "Admin"}: ${String(
                m.text || ""
              )}`
          )
          .join("\n")
      : "";

    const prompt = `
${historyBlock ? `RECENT CONVERSATION:\n${historyBlock}\n\n` : ""}ADMIN REQUEST (${auth.user.fullName}, Role: ${auth.user.role}):
${message}

LIVE LEARNOVA OPERATIONS SNAPSHOT (JSON):
${JSON.stringify(snapshot, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are Learnova Admin Copilot — a senior Nigerian school operations & academic scheduling AI assistant.
You help School Admins and Super Admins with:
1. Timetable planning, conflict resolution, and teacher capacity allocation (WAT Africa/Lagos, JSS1–SS3, WAEC/NECO/JAMB alignment).
2. Triaging pending teacher subject applications and recommending which approvals unlock blocked timetable subjects.
3. Payment & subscription backlog actions (bank transfers awaiting confirmation in Naira ₦, Paystack verification, student access gaps).
4. Drafting concise, polished notices/circulars for teachers, students, or parents in Nigerian academic English.
5. Auditing operational metrics directly from the LIVE LEARNOVA OPERATIONS SNAPSHOT.

Guidelines:
- Always cite real numbers, subjects, class levels, and names from the snapshot — NEVER invent fake students, fake revenue, or fake teachers.
- Reference exact Learnova admin pages when helpful: /admin/teachers, /admin/academics, /admin/payments, /admin/students, /admin/timetable, /admin/classrooms.
- Format responses cleanly with scannable headings or bullet points.`,
      },
    });

    return NextResponse.json({
      success: true,
      reply:
        response.text ||
        "I could not generate a response right now. Please try again.",
    });
  } catch (err: any) {
    console.error("Admin AI Copilot error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to run Admin AI Copilot. Please check your configuration and try again.",
      },
      { status: 500 }
    );
  }
}

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

type LiveSnapshot = ReturnType<typeof buildLiveSchoolSnapshot>;

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

function buildSmartTimetableProposals(
  state: LmsStateData,
  users: Awaited<ReturnType<typeof fetchDirectoryUsers>>,
  snapshot: LiveSnapshot,
  opts: {
    goal: string;
    targetClassLevelId?: string;
    requestedCapacity: number;
    actorId: string;
  }
) {
  const goalLower = opts.goal.toLowerCase();
  let candidates = snapshot.readinessMatrix.filter(
    (r) =>
      r.approvedTeachers.length > 0 &&
      (!opts.targetClassLevelId || r.classLevelId === opts.targetClassLevelId)
  );

  // Respect WAEC/SS or JSS hints in goal if not explicitly filtered by dropdown
  if (!opts.targetClassLevelId) {
    if (/\b(waec|sss|ss1|ss2|ss3)\b/i.test(goalLower)) {
      const sss = candidates.filter((c) => c.classLevelCode.startsWith("SS"));
      if (sss.length > 0) candidates = sss;
    } else if (/\b(jss|jss1|jss2|jss3|junior)\b/i.test(goalLower)) {
      const jss = candidates.filter((c) => c.classLevelCode.startsWith("JSS"));
      if (jss.length > 0) candidates = jss;
    }
  }

  // Prioritize unscheduled pairs first, then higher student demand
  candidates = [...candidates].sort((a, b) => {
    if (a.alreadyScheduledCount !== b.alreadyScheduledCount) {
      return a.alreadyScheduledCount - b.alreadyScheduledCount;
    }
    return b.entitledStudents - a.entitledStudents;
  });

  if (candidates.length === 0) {
    return {
      summary:
        "No approved teacher-subject pairs were found for the selected scope. Approve at least one teacher under /admin/teachers before generating timetable slots.",
      proposals: [] as any[],
    };
  }

  const timeWindows = /\bafternoon\b/i.test(goalLower)
    ? [
        ["12:00", "13:00"],
        ["13:00", "14:00"],
        ["14:00", "15:00"],
        ["15:00", "16:00"],
      ]
    : [
        ["08:00", "09:00"],
        ["09:00", "10:00"],
        ["10:00", "11:00"],
        ["11:30", "12:30"],
        ["13:00", "14:00"],
        ["14:00", "15:00"],
      ];

  const days: Array<TimetableEntryRecord["dayOfWeek"]> = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];

  const workingState: LmsStateData = JSON.parse(JSON.stringify(state));
  const proposals: any[] = [];

  for (const row of candidates) {
    if (proposals.length >= 6) break;

    const neededTeachers = Math.max(
      1,
      Math.ceil(Math.max(1, row.entitledStudents) / opts.requestedCapacity)
    );
    const assignedTeacherIds = row.approvedTeachers
      .slice(0, neededTeachers)
      .map((t) => t.teacherUserId);

    let chosenSlot: {
      dayOfWeek: TimetableEntryRecord["dayOfWeek"];
      startTime: string;
      endTime: string;
      validation: ReturnType<typeof validateTimetableEntry>;
    } | null = null;

    // Distribute across days cleanly using current proposal index offset
    const dayStartOffset = proposals.length % days.length;
    for (let dIdx = 0; dIdx < days.length && !chosenSlot; dIdx++) {
      const dayOfWeek = days[(dayStartOffset + dIdx) % days.length];
      for (const [startTime, endTime] of timeWindows) {
        const validation = validateTimetableEntry(workingState, users, {
          classLevelId: row.classLevelId,
          subjectId: row.subjectId,
          assignedTeacherIds,
          dayOfWeek,
          startTime,
          endTime,
          maxCapacityPerRoom: opts.requestedCapacity,
          publicationStatus: "PUBLISHED",
        });
        if (validation.valid) {
          chosenSlot = { dayOfWeek, startTime, endTime, validation };
          break;
        }
      }
    }

    if (chosenSlot) {
      workingState.timetableEntries.push({
        id: `smart-preview-${proposals.length}`,
        sessionId: "",
        termId: "",
        classLevelId: row.classLevelId,
        subjectId: row.subjectId,
        assignedTeacherIds,
        dayOfWeek: chosenSlot.dayOfWeek,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        durationMinutes: 60,
        mode: "ONLINE",
        maxCapacityPerRoom: opts.requestedCapacity,
        publicationStatus: "PUBLISHED",
        allocationStatus: "UNALLOCATED",
        eligibleStudentCount: row.entitledStudents,
        shortfallCount: 0,
        createdBy: opts.actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      proposals.push({
        classLevelId: row.classLevelId,
        subjectId: row.subjectId,
        assignedTeacherIds,
        dayOfWeek: chosenSlot.dayOfWeek,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        mode: "ONLINE",
        maxCapacityPerRoom: opts.requestedCapacity,
        rationale: `Assigns ${assignedTeacherIds.length} approved teacher(s) with zero cohort or teacher overlap in Africa/Lagos (WAT) (${row.entitledStudents} entitled student(s)).`,
      });
    }
  }

  return {
    summary:
      proposals.length > 0
        ? `Prepared ${proposals.length} conflict-free WAT timetable slot(s) from your ${snapshot.counts.approvedTeacherPairs} approved teacher assignment(s). Review below and click Publish & Allocate or Load into Form.`
        : "Could not find an open conflict-free slot for the selected criteria. Try widening the class level scope or approving additional teachers.",
    proposals,
  };
}

function buildSmartCopilotReply(message: string, snapshot: LiveSnapshot): string {
  const q = message.toLowerCase();
  const c = snapshot.counts;

  if (/\b(notice|circular|parent|fee|resumption|announcement|letter)\b/.test(q)) {
    return [
      `### Draft Official Parent & Student Notice (${snapshot.currentTerm}, ${snapshot.currentSession})`,
      "",
      `**Subject:** ${snapshot.currentTerm} Live Classes & Fee Confirmation Update — ${snapshot.schoolName}`,
      "",
      `Dear Parents, Guardians, and Students,`,
      "",
      `Welcome to the ${snapshot.currentTerm} of the ${snapshot.currentSession} Academic Session. Official timetables operate in **West Africa Time (WAT / Africa/Lagos)** across JSS1–SS3.`,
      "",
      `- **Timetable & Group Allocation:** ${c.publishedLessons} official lesson slot(s) are currently published across ${snapshot.activeClassLevels.length} class levels.`,
      `- **Subscription & Classroom Access:** Students with active paid subscriptions or scholarship grants are automatically placed into capacity-bounded live classrooms. Any pending bank transfer confirmations (${c.pendingBankTransfers} currently queued) are reviewed promptly by School Administration.`,
      `- **Action Required:** Please ensure your ward's class level enrolment and term subscription are active under **Subscriptions** so they do not miss live interactive lessons.`,
      "",
      `Warm regards,`,
      `**School Administration — ${snapshot.schoolName}**`,
    ].join("\n");
  }

  const readyRows = snapshot.readinessMatrix.filter((r) => r.approvedTeachers.length > 0);
  const unscheduledReady = readyRows.filter((r) => r.alreadyScheduledCount === 0);
  const shortfalls = snapshot.existingSchedule.filter((e) => e.allocationStatus === "SHORTFALL");

  const lines: string[] = [
    `### ${snapshot.schoolName} — Live Operations Summary (${snapshot.currentTerm}, ${snapshot.currentSession})`,
    "",
    `- **Students:** ${c.totalStudents} registered · **${c.activeEntitledStudents}** with active subscription/scholarship access`,
    `- **Educators:** ${c.totalTeachers} teachers · **${c.approvedTeacherPairs}** approved subject-level slots · **${c.pendingTeacherApplications}** pending application(s)`,
    `- **Payments:** **${c.pendingBankTransfers}** bank transfer(s) awaiting confirmation`,
    `- **Timetable & Classrooms:** **${c.publishedLessons}** published lesson(s) · **${c.shortfallLessons}** capacity shortfall(s) · **${c.liveClassrooms}** live right now (${c.totalClassrooms} total classrooms)`,
  ];

  if (snapshot.pendingTeacherApplicationsList.length > 0) {
    lines.push("", "#### Pending Teacher Approvals (`/admin/teachers`)");
    for (const app of snapshot.pendingTeacherApplicationsList.slice(0, 5)) {
      lines.push(
        `- **${app.teacherName}** — ${app.subjectName} (${app.requestedLevels.join(", ")}) [${app.status}]`
      );
    }
  }

  if (snapshot.pendingPaymentsList.length > 0) {
    lines.push("", "#### Bank Transfers Awaiting Verification (`/admin/payments`)");
    for (const pay of snapshot.pendingPaymentsList.slice(0, 5)) {
      lines.push(
        `- **${pay.studentName}** — ₦${Number(pay.amountNgn).toLocaleString()} (${pay.planName}, Ref: \`${pay.reference}\`)`
      );
    }
  }

  if (shortfalls.length > 0) {
    lines.push("", "#### Capacity Shortfalls Requiring Attention (`/admin/timetable`)");
    for (const s of shortfalls) {
      lines.push(
        `- **${s.classLevelCode} ${s.subjectName}** (${s.dayOfWeek} ${s.startTime} WAT): ${s.shortfallCount} unplaced student(s). Assign an extra approved teacher to spin up another parallel group.`
      );
    }
  }

  if (unscheduledReady.length > 0) {
    lines.push("", "#### Approved Subjects Ready to Schedule (`/admin/timetable`)");
    for (const r of unscheduledReady.slice(0, 6)) {
      lines.push(
        `- **${r.classLevelCode} ${r.subjectName}** — ${r.approvedTeachers.map((t) => t.teacherName).join(", ")} (${r.entitledStudents} entitled student(s))`
      );
    }
    lines.push(
      "",
      `Tip: Switch to the **Timetable Planner** tab above and click **Generate AI Timetable Draft** to auto-build conflict-free slots for these ${unscheduledReady.length} approved pair(s).`
    );
  } else if (readyRows.length === 0) {
    lines.push(
      "",
      "#### Recommended Next Step",
      "No teacher subject-level slots are approved yet. Visit `/admin/teachers` to approve teachers for their target subjects and class levels first."
    );
  }

  return lines.join("\n");
}

function validateProposalBatch(
  state: LmsStateData,
  users: Awaited<ReturnType<typeof fetchDirectoryUsers>>,
  rawProposals: any[],
  requestedCapacity: number,
  actorId: string
) {
  const workingState: LmsStateData = JSON.parse(JSON.stringify(state));

  return rawProposals.map((item, idx) => {
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
        createdBy: actorId,
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
      (tid: string) =>
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

  try {
    const body = await req.json();
    const action = String(body.action || "ASK_COPILOT");
    const [state, users] = await Promise.all([
      loadLmsState(),
      fetchDirectoryUsers(),
    ]);
    const snapshot = buildLiveSchoolSnapshot(state, users);
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

    if (action === "SUGGEST_TIMETABLE") {
      const goal = String(
        body.goal ||
          "Generate conflict-free Nigerian secondary school timetable slots prioritizing subjects with approved teachers and entitled students."
      ).trim();
      const targetClassLevelId = String(body.targetClassLevelId || "").trim();
      const requestedCapacity = Number(
        body.maxCapacityPerRoom || snapshot.defaultRoomCapacity || 50
      );

      let summary = "";
      let rawProposals: any[] = [];

      if (hasGeminiKey) {
        try {
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

          const parsed = JSON.parse((response.text || "{}").trim());
          summary = parsed.summary || "Generated AI timetable recommendations.";
          rawProposals = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
        } catch (geminiErr) {
          console.warn("Gemini timetable generation fallback activated:", geminiErr);
        }
      }

      if (rawProposals.length === 0 && !summary) {
        const smart = buildSmartTimetableProposals(state, users, snapshot, {
          goal,
          targetClassLevelId: targetClassLevelId || undefined,
          requestedCapacity,
          actorId: auth.user.id,
        });
        summary = smart.summary;
        rawProposals = smart.proposals;
      }

      const validatedSuggestions = validateProposalBatch(
        state,
        users,
        rawProposals,
        requestedCapacity,
        auth.user.id
      );

      return NextResponse.json({
        success: true,
        summary,
        suggestions: validatedSuggestions,
      });
    }

    // Default: ASK_COPILOT
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

    if (hasGeminiKey) {
      try {
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

        if (response.text) {
          return NextResponse.json({
            success: true,
            reply: response.text,
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini copilot chat fallback activated:", geminiErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply: buildSmartCopilotReply(message, snapshot),
    });
  } catch (err: any) {
    console.error("Admin AI Copilot error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to run Admin AI Copilot. Please try again.",
      },
      { status: 500 }
    );
  }
}

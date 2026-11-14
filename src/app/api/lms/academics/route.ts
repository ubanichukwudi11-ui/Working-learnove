import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import { appendAuditLog, loadLmsState, mutateLmsState } from "@/lib/lmsDb";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const state = await loadLmsState();
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  return NextResponse.json({
    classLevels: isAdmin ? state.classLevels : state.classLevels.filter((c) => c.isActive),
    subjects: isAdmin ? state.subjects : state.subjects.filter((s) => s.isActive),
    sessions: state.sessions,
    terms: state.terms,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const action = String(body.action || "");

    const result = await mutateLmsState((state) => {
      switch (action) {
        case "CREATE_CLASS_LEVEL": {
          const code = String(body.code || "").trim().toUpperCase();
          const name = String(body.name || "").trim();
          const category = (body.category || "OTHER") as "JSS" | "SSS" | "PRIMARY" | "OTHER";
          if (!code || !name) throw new Error("Class level code and name are required.");
          if (state.classLevels.some((c) => c.code.toUpperCase() === code)) {
            throw new Error(`Class level ${code} already exists.`);
          }
          const created = {
            id: `lvl-${code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`,
            schoolId: state.schools[0]?.id || "school-learnova-ng",
            code,
            name,
            category,
            sortOrder: state.classLevels.length + 1,
            isActive: true,
          };
          state.classLevels.push(created);
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "CREATE_CLASS_LEVEL",
            entityType: "class_level",
            entityId: created.id,
            metadata: { code, name },
          });
          return { classLevel: created };
        }

        case "TOGGLE_CLASS_LEVEL": {
          const id = String(body.id || "");
          const lvl = state.classLevels.find((c) => c.id === id);
          if (!lvl) throw new Error("Class level not found.");
          lvl.isActive = !lvl.isActive;
          return { classLevel: lvl };
        }

        case "CREATE_SUBJECT": {
          const name = String(body.name || "").trim();
          const code = String(body.code || "").trim().toUpperCase();
          const department = (body.department || "Core") as "Science" | "Arts" | "Commercial" | "Core";
          const description = String(body.description || "").trim();
          const classLevelIds: string[] = Array.isArray(body.classLevelIds)
            ? body.classLevelIds
            : [];
          if (!name || !code || classLevelIds.length === 0) {
            throw new Error("Subject name, code, and at least one class level are required.");
          }
          const created = {
            id: `sub-${code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`,
            schoolId: state.schools[0]?.id || "school-learnova-ng",
            code,
            name,
            department,
            description,
            classLevelIds,
            isActive: true,
          };
          state.subjects.push(created);
          appendAuditLog(state, {
            actorUserId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            action: "CREATE_SUBJECT",
            entityType: "subject",
            entityId: created.id,
            metadata: { code, name, classLevelIds },
          });
          return { subject: created };
        }

        case "UPDATE_SUBJECT": {
          const id = String(body.id || "");
          const sub = state.subjects.find((s) => s.id === id);
          if (!sub) throw new Error("Subject not found.");
          if (typeof body.name === "string" && body.name.trim()) sub.name = body.name.trim();
          if (typeof body.code === "string" && body.code.trim()) sub.code = body.code.trim().toUpperCase();
          if (typeof body.description === "string") sub.description = body.description.trim();
          if (body.department) sub.department = body.department;
          if (Array.isArray(body.classLevelIds)) sub.classLevelIds = body.classLevelIds;
          return { subject: sub };
        }

        case "TOGGLE_SUBJECT": {
          const id = String(body.id || "");
          const sub = state.subjects.find((s) => s.id === id);
          if (!sub) throw new Error("Subject not found.");
          sub.isActive = !sub.isActive;
          return { subject: sub };
        }

        case "CREATE_TERM": {
          const sessionId = String(body.sessionId || state.sessions[0]?.id || "");
          const name = String(body.name || "").trim();
          const startsAt = String(body.startsAt || "");
          const endsAt = String(body.endsAt || "");
          if (!name || !startsAt || !endsAt) throw new Error("Term name and dates required.");
          const created = {
            id: `term-${Date.now()}`,
            sessionId,
            name,
            startsAt,
            endsAt,
            isCurrent: false,
          };
          state.terms.push(created);
          return { term: created };
        }

        case "SET_CURRENT_TERM": {
          const termId = String(body.termId || "");
          const target = state.terms.find((t) => t.id === termId);
          if (!target) throw new Error("Term not found.");
          state.terms.forEach((t) => {
            t.isCurrent = t.id === termId;
          });
          state.sessions.forEach((s) => {
            s.isCurrent = s.id === target.sessionId;
          });
          return { term: target };
        }

        default:
          throw new Error("Unsupported academic configuration action.");
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update academics." },
      { status: 400 }
    );
  }
}

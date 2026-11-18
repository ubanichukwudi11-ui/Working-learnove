import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireApiAuth } from "@backend/services/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";
import { mutateLmsState } from "@backend/services/lmsDb";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to load session.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const body = await req.json();
    const sb = getSupabaseServerClient();

    const profileUpdates: Record<string, unknown> = {};
    if (typeof body.fullName === "string" && body.fullName.trim()) {
      profileUpdates.full_name = body.fullName.trim().slice(0, 120);
    }
    if (typeof body.avatarUrl === "string") {
      profileUpdates.avatar_url = body.avatarUrl.trim() || null;
    }
    if (typeof body.phone === "string") {
      profileUpdates.phone = body.phone.trim() || null;
    }
    if (typeof body.gender === "string") {
      profileUpdates.gender = body.gender.trim() || null;
    }
    if (typeof body.country === "string") {
      profileUpdates.country = body.country.trim() || null;
    }
    if (typeof body.state === "string") {
      profileUpdates.state = body.state.trim() || null;
    }
    if (typeof body.address === "string") {
      profileUpdates.address = body.address.trim() || null;
    }
    if (typeof body.dob === "string") {
      profileUpdates.dob = body.dob.trim() || null;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await sb
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
    }

    if (user.role === "STUDENT") {
      const hasStudentField =
        typeof body.classLevel === "string" ||
        typeof body.examPreparation === "string" ||
        typeof body.schoolName === "string" ||
        body.age !== undefined ||
        typeof body.studyHours === "string" ||
        typeof body.studyTime === "string" ||
        typeof body.learningGoal === "string" ||
        typeof body.reminders === "string" ||
        typeof body.profileCompleted === "boolean";

      if (body.profileCompleted === true) {
        const finalClassLevel = String(body.classLevel || user.classLevel || "").trim();
        const finalSchoolName = String(body.schoolName || user.schoolName || "").trim();
        const finalAge =
          body.age !== undefined && body.age !== null && String(body.age).trim() !== ""
            ? Number(body.age)
            : user.age;
        const finalDob =
          typeof body.dob === "string" ? body.dob.trim() : user.dob || "";

        if (!finalSchoolName || !finalClassLevel || (!finalAge && !finalDob)) {
          return NextResponse.json(
            {
              success: false,
              error: "School name, class level, and age or date of birth are required to complete your student profile.",
            },
            { status: 400 }
          );
        }
      }

      if (hasStudentField) {
        const studentUpdates: Record<string, unknown> = {};
        if (typeof body.classLevel === "string" && body.classLevel.trim()) {
          studentUpdates.class_level = body.classLevel.trim();
        }
        if (typeof body.examPreparation === "string") {
          studentUpdates.exam_preparation = body.examPreparation.trim() || null;
        }
        if (typeof body.schoolName === "string") {
          studentUpdates.school_name = body.schoolName.trim() || null;
        }
        if (body.age !== undefined && body.age !== null && String(body.age).trim() !== "") {
          const parsedAge = Number(body.age);
          if (!Number.isNaN(parsedAge) && parsedAge >= 5 && parsedAge <= 100) {
            studentUpdates.age = parsedAge;
          }
        }
        if (typeof body.studyHours === "string") {
          studentUpdates.study_hours = body.studyHours.trim() || null;
        }
        if (typeof body.studyTime === "string") {
          studentUpdates.study_time = body.studyTime.trim() || null;
        }
        if (typeof body.learningGoal === "string") {
          studentUpdates.learning_goal = body.learningGoal.trim() || null;
        }
        if (typeof body.reminders === "string") {
          studentUpdates.reminders = body.reminders.trim() || null;
        }
        if (typeof body.profileCompleted === "boolean") {
          studentUpdates.profile_completed = body.profileCompleted;
        }

        const { error: upsertErr } = await sb.from("student_profiles").upsert(
          {
            user_id: user.id,
            ...studentUpdates,
          },
          { onConflict: "user_id" }
        );

        if (upsertErr) {
          // Fallback if optional migration columns are not yet present
          const fallbackUpdates = { ...studentUpdates };
          delete fallbackUpdates.school_name;
          delete fallbackUpdates.profile_completed;
          await sb.from("student_profiles").upsert(
            {
              user_id: user.id,
              ...fallbackUpdates,
            },
            { onConflict: "user_id" }
          );
        }

        // Sync metadata fallback so completion persists regardless of DB migration timing
        try {
          await sb.auth.admin.updateUserById(user.id, {
            user_metadata: {
              school_name:
                typeof body.schoolName === "string"
                  ? body.schoolName.trim()
                  : user.schoolName,
              class_level:
                typeof body.classLevel === "string"
                  ? body.classLevel.trim()
                  : user.classLevel,
              age:
                studentUpdates.age !== undefined ? studentUpdates.age : user.age,
              dob:
                typeof body.dob === "string" ? body.dob.trim() : user.dob,
              profile_completed:
                typeof body.profileCompleted === "boolean"
                  ? body.profileCompleted
                  : user.profileCompleted,
            },
          });
        } catch {
          // Non-fatal if admin metadata update is skipped in limited envs
        }

        // Keep LMS student enrolment class level in sync without touching paid entitlement status
        if (typeof body.classLevel === "string" && body.classLevel.trim()) {
          const cleanCode = body.classLevel.trim().replace(/\s+/g, "").toLowerCase();
          try {
            await mutateLmsState((lms) => {
              const matchedLevel =
                lms.classLevels.find(
                  (l) =>
                    l.code.toLowerCase() === cleanCode ||
                    l.name.toLowerCase() === body.classLevel.trim().toLowerCase()
                ) || lms.classLevels.find((l) => l.code === "SS1");
              if (!matchedLevel) return;

              const enr = lms.studentEnrolments.find(
                (e) => e.studentUserId === user.id
              );
              if (enr) {
                enr.classLevelId = matchedLevel.id;
                enr.updatedAt = new Date().toISOString();
              } else {
                lms.studentEnrolments.push({
                  id: `enr-${user.id}`,
                  studentUserId: user.id,
                  studentName: user.fullName,
                  studentEmail: user.email,
                  classLevelId: matchedLevel.id,
                  subjectIds: [],
                  status: "REGISTERED",
                  updatedAt: new Date().toISOString(),
                });
              }

              const ent = lms.studentEntitlements.find(
                (e) => e.studentUserId === user.id
              );
              if (ent && ent.accessStatus === "REGISTERED") {
                ent.classLevelId = matchedLevel.id;
                ent.updatedAt = new Date().toISOString();
              }
            });
          } catch {
            // Ignore transient LMS sync warning
          }
        }
      }
    }

    const refreshed = await getAuthenticatedUser(req);
    const response = NextResponse.json({ success: true, user: refreshed });
    if (refreshed) {
      response.cookies.set("learnova_user", JSON.stringify(refreshed), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }
    return response;
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to update profile.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

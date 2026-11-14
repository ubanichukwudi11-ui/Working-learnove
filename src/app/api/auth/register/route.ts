import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabaseServer";
import { mutateLmsState, appendNotification, appendAuditLog } from "@/lib/lmsDb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      role = "STUDENT",
      fullName,
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      country,
      state,
      address,
      dob,
      profilePhoto,
      classLevel,
      age,
      aiPurpose,
      examPreparation,
      favouriteSubjects,
      learningStyle,
      studyHours,
      studyTime,
      learningGoal,
      reminders,
      subject,
      subjectApplications,
      qualification,
      institution,
      experience,
      licenseNumber,
      bio,
      certificate,
      degreeCertificate,
      governmentId,
      cv,
      studentName,
      childIdNumber,
      relationship,
    } = body;

    const resolvedFullName = (
      fullName ||
      (firstName && lastName ? `${firstName} ${lastName}` : firstName || "")
    ).trim();

    if (!email || !password || !resolvedFullName) {
      return NextResponse.json(
        { success: false, error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    // Prevent self-registration as ADMIN or SUPER_ADMIN
    const safeRole =
      role === "TEACHER" || role === "PARENT" ? role : "STUDENT";

    if (!isSupabaseServerConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase Auth is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: resolvedFullName,
          role: safeRole,
          avatar_url: profilePhoto || null,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: error?.message || "Failed to register account." },
        { status: 400 }
      );
    }

    const authUser = data.user;
    const userStatus = safeRole === "TEACHER" ? "PENDING" : "ACTIVE";

    try {
      await supabase.from("profiles").upsert({
        id: authUser.id,
        email: authUser.email || email.trim().toLowerCase(),
        full_name: resolvedFullName,
        role: safeRole,
        status: userStatus,
        avatar_url: profilePhoto || null,
        phone: phone || null,
        gender: gender || null,
        country: country || null,
        state: state || null,
        address: address || null,
        dob: dob || null,
      });
    } catch (profileErr) {
      console.warn("Profiles table upsert warning:", profileErr);
    }

    try {
      if (safeRole === "STUDENT") {
        await supabase.from("student_profiles").upsert({
          user_id: authUser.id,
          class_level: classLevel || "SS1",
          age: age ? Number(age) : null,
          profile_photo: profilePhoto || null,
          ai_purpose: aiPurpose || [],
          exam_preparation: examPreparation || null,
          favourite_subjects: favouriteSubjects || [],
          learning_style: learningStyle || [],
          study_hours: studyHours || null,
          study_time: studyTime || null,
          learning_goal: learningGoal || null,
          reminders: reminders || null,
        });

        await mutateLmsState((lms) => {
          const matchedLevel =
            lms.classLevels.find(
              (l) =>
                l.code.toLowerCase() === String(classLevel || "SS1").replace(/\s+/g, "").toLowerCase() ||
                l.name.toLowerCase() === String(classLevel || "").toLowerCase()
            ) || lms.classLevels.find((l) => l.code === "SS1")!;

          lms.studentEnrolments.push({
            id: `enr-${authUser.id}`,
            studentUserId: authUser.id,
            studentName: resolvedFullName,
            studentEmail: authUser.email || email.trim().toLowerCase(),
            classLevelId: matchedLevel.id,
            subjectIds: [],
            status: "REGISTERED",
            updatedAt: new Date().toISOString(),
          });

          lms.studentEntitlements.push({
            id: `ent-${authUser.id}`,
            studentUserId: authUser.id,
            studentName: resolvedFullName,
            studentEmail: authUser.email || email.trim().toLowerCase(),
            classLevelId: matchedLevel.id,
            subjectIds: [],
            allSubjects: false,
            accessStatus: "REGISTERED",
            startsAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      } else if (safeRole === "TEACHER") {
        await supabase.from("teacher_profiles").upsert({
          user_id: authUser.id,
          subject: subject || "General",
          qualification: qualification || null,
          institution: institution || null,
          experience: experience || null,
          license_number: licenseNumber || null,
          profile_photo: profilePhoto || null,
          teaching_certificate: certificate || null,
          degree_certificate: degreeCertificate || null,
          government_id: governmentId || null,
          cv: cv || null,
          verification_score: 0,
        });

        await mutateLmsState((lms) => {
          const appsInput = Array.isArray(subjectApplications) && subjectApplications.length > 0
            ? subjectApplications
            : [
                {
                  subjectId:
                    lms.subjects.find(
                      (s) => s.name.toLowerCase() === String(subject || "").trim().toLowerCase()
                    )?.id || lms.subjects[0].id,
                  classLevelIds: ["lvl-jss1", "lvl-jss2", "lvl-jss3"],
                },
              ];

          for (const item of appsInput) {
            const subObj = lms.subjects.find((s) => s.id === item.subjectId) || lms.subjects[0];
            lms.teacherApplications.unshift({
              id: `tapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              teacherUserId: authUser.id,
              teacherName: resolvedFullName,
              teacherEmail: authUser.email || email.trim().toLowerCase(),
              subjectId: subObj.id,
              subjectName: subObj.name,
              classLevelIds: Array.isArray(item.classLevelIds) && item.classLevelIds.length > 0
                ? item.classLevelIds
                : subObj.classLevelIds,
              qualification: qualification || "Pending specification",
              institution: institution || "Not provided",
              experience: experience || "Not provided",
              licenseNumber: licenseNumber || "",
              bio: bio || "",
              documentUrls: {
                profilePhoto: profilePhoto || undefined,
                teachingCertificate: certificate || undefined,
                degreeCertificate: degreeCertificate || undefined,
                governmentId: governmentId || undefined,
                cv: cv || undefined,
              },
              status: "PENDING_REVIEW",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          appendNotification(lms, {
            recipientUserId: authUser.id,
            recipientRole: "TEACHER",
            category: "TEACHER_APPLICATION",
            title: "Teacher Application Received",
            message: "Your subject qualification application has been received and queued for School Admin review.",
            href: "/teacher/applications",
          });

          appendNotification(lms, {
            recipientUserId: "ALL_ADMINS",
            recipientRole: "ALL_ADMINS",
            category: "TEACHER_APPLICATION",
            title: `New Teacher Application: ${resolvedFullName}`,
            message: `${resolvedFullName} applied to teach and requires approval in the Teacher Approval Centre.`,
            href: `/admin/teachers/${authUser.id}`,
          });

          appendAuditLog(lms, {
            actorUserId: authUser.id,
            actorEmail: authUser.email || email,
            actorRole: "TEACHER",
            action: "TEACHER_APPLICATION_SUBMITTED",
            entityType: "teacher_application",
            entityId: authUser.id,
          });
        });
      } else if (safeRole === "PARENT") {
        await supabase.from("parent_profiles").upsert({
          user_id: authUser.id,
          student_name: studentName || null,
          child_id_number: childIdNumber || null,
          relationship: relationship || "Parent",
        });
      }
    } catch (roleErr) {
      console.warn("Role table upsert warning:", roleErr);
    }

    const user = {
      id: authUser.id,
      email: authUser.email || email,
      fullName: resolvedFullName,
      role: safeRole,
      status: userStatus,
      avatarUrl: profilePhoto,
      phone,
      gender,
      country,
      state,
      address,
      dob,
      subject,
      classLevel,
      studentName,
    };

    const response = NextResponse.json({
      success: true,
      session: data.session,
      user,
      requiresEmailConfirmation: !data.session,
    });

    if (data.session?.access_token) {
      response.cookies.set("learnova_access_token", data.session.access_token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      response.cookies.set("learnova_user", JSON.stringify(user), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

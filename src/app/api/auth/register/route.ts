import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabaseServer";

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
      // Shared
      phone,
      gender,
      country,
      state,
      address,
      dob,
      profilePhoto,
      // Student specific
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
      // Teacher specific
      subject,
      qualification,
      institution,
      experience,
      licenseNumber,
      certificate,
      degreeCertificate,
      governmentId,
      cv,
      // Parent specific
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

    if (!isSupabaseServerConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase Auth is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // 1. Create User in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: resolvedFullName,
          role,
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
    const userStatus = role === "TEACHER" ? "PENDING" : "ACTIVE";

    // 2. Insert into profiles table
    try {
      await supabase.from("profiles").upsert({
        id: authUser.id,
        email: authUser.email || email.trim().toLowerCase(),
        full_name: resolvedFullName,
        role,
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

    // 3. Insert into specific role profile table
    try {
      if (role === "STUDENT") {
        await supabase.from("student_profiles").upsert({
          user_id: authUser.id,
          class_level: classLevel || "SS1 Science",
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
      } else if (role === "TEACHER") {
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
      } else if (role === "PARENT") {
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
      role,
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

    return NextResponse.json({
      success: true,
      session: data.session,
      user,
      requiresEmailConfirmation: !data.session,
    });
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

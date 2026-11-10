import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isSupabaseServerConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase Auth is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Supabase project settings.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: error?.message || "Invalid login credentials." },
        { status: 401 }
      );
    }

    const authUser = data.user;

    // Fetch user profile from database
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    let teacherData: any = null;
    let studentData: any = null;
    let parentData: any = null;

    const role = profile?.role || authUser.user_metadata?.role || "STUDENT";

    if (role === "TEACHER") {
      const { data: t } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();
      teacherData = t;
    } else if (role === "STUDENT") {
      const { data: s } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();
      studentData = s;
    } else if (role === "PARENT") {
      const { data: p } = await supabase
        .from("parent_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();
      parentData = p;
    }

    const user = {
      id: authUser.id,
      email: authUser.email || email,
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        email.split("@")[0],
      role,
      status: profile?.status || (role === "TEACHER" ? "PENDING" : "ACTIVE"),
      avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
      phone: profile?.phone,
      gender: profile?.gender,
      country: profile?.country,
      state: profile?.state,
      address: profile?.address,
      dob: profile?.dob,
      subject: teacherData?.subject,
      qualification: teacherData?.qualification,
      institution: teacherData?.institution,
      experience: teacherData?.experience,
      licenseNumber: teacherData?.license_number,
      classLevel: studentData?.class_level,
      age: studentData?.age,
      studentName: parentData?.student_name,
      childIdNumber: parentData?.child_id_number,
      relationship: parentData?.relationship,
    };

    return NextResponse.json({
      success: true,
      session: data.session,
      user,
    });
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    if (!isSupabaseServerConfigured) {
      return NextResponse.json({ success: false, user: null });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const supabase = getSupabaseServerClient();

    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    const role = profile?.role || authUser.user_metadata?.role || "STUDENT";

    const user = {
      id: authUser.id,
      email: authUser.email || "",
      fullName: profile?.full_name || authUser.user_metadata?.full_name || "User",
      role,
      status: profile?.status || "ACTIVE",
      avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    };

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

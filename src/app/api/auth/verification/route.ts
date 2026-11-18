import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, resolvePublicAppOrigin } from "@backend/services/serverAuth";
import { getSupabaseServerClient } from "@backend/services/supabaseServer";
import { sendVerificationLinkEmail } from "@backend/services/emailService";

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  try {
    const sb = getSupabaseServerClient();
    const appUrl = resolvePublicAppOrigin(req);

    const { data, error } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error || !data?.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message || "Could not generate verification link." },
        { status: 400 }
      );
    }

    const emailResult = await sendVerificationLinkEmail({
      to: user.email,
      fullName: user.fullName,
      actionLink: data.properties.action_link,
    });

    return NextResponse.json({
      success: true,
      sent: emailResult.sent,
      message: emailResult.sent
        ? "Verification link sent to your email."
        : emailResult.skippedReason || "Verification link generated.",
    });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to send verification link.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

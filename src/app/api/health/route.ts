import { NextRequest, NextResponse } from "next/server";
import {
  checkSupabaseServerConfigured,
  getSupabaseServerClient,
} from "@backend/services/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const strict = req.nextUrl.searchParams.get("strict") === "true";
  const supabaseConfigured = checkSupabaseServerConfigured();

  let dbHealthy = false;
  let dbError: string | undefined;

  if (supabaseConfigured) {
    try {
      const sb = getSupabaseServerClient({ timeoutMs: 2500 });
      const { error } = await sb.from("schools").select("id").limit(1);
      if (error) {
        dbError = error.message;
      } else {
        dbHealthy = true;
      }
    } catch (err: unknown) {
      dbError = err instanceof Error ? err.message : "Database ping failed";
    }
  }

  const healthy = supabaseConfigured ? dbHealthy : true;
  const statusCode = strict && !healthy ? 503 : 200;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        supabaseConfigured,
        databaseConnected: dbHealthy,
        livekitConfigured: Boolean(
          process.env.LIVEKIT_API_KEY &&
            process.env.LIVEKIT_API_SECRET &&
            process.env.NEXT_PUBLIC_LIVEKIT_URL
        ),
        paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      },
      ...(dbError ? { dbError } : {}),
    },
    { status: statusCode }
  );
}

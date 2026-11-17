import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "@backend/services/supabaseServer";

export async function GET() {
  let dbHealthy = false;
  let dbError: string | undefined;

  if (isSupabaseServerConfigured) {
    try {
      const sb = getSupabaseServerClient();
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

  const healthy = isSupabaseServerConfigured ? dbHealthy : true;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        supabaseConfigured: isSupabaseServerConfigured,
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
    { status: healthy ? 200 : 503 }
  );
}

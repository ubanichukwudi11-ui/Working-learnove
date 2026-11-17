import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  enforceAndConsumeNovaQuota,
  getNovaQuotaStatus,
} from "@backend/services/rateLimitService";
import { signLiveVoiceTicket } from "@backend/services/wsTicket";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const quota = await getNovaQuotaStatus(user);
  return NextResponse.json({ quota });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireApiAuth(req);
  if (errorResponse || !user) return errorResponse;

  const quota = await enforceAndConsumeNovaQuota(user, "live_voice");
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason || "Daily live voice quota exceeded.", quota },
      {
        status: 429,
        headers: quota.retryAfterSeconds
          ? { "Retry-After": String(quota.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const ticket = signLiveVoiceTicket(user.id, 120);
  return NextResponse.json({ ticket, quota });
}

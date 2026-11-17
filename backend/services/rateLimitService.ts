import type { AuthenticatedSessionUser } from "./serverAuth";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "./supabaseServer";

export type NovaUsageKind = "chat" | "flashcards" | "transcribe" | "qa_draft" | "live_voice";

export interface QuotaStatusResult {
  allowed: boolean;
  tierLabel: "FREE_STARTER" | "ACTIVE_SCHOLAR" | "EDUCATOR_STAFF";
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  voiceMinutesLimit: number;
  voiceSecondsUsed: number;
  retryAfterSeconds?: number;
  reason?: string;
}

interface BurstWindow {
  timestamps: number[];
}

const g = globalThis as unknown as {
  __learnovaRateBuckets?: Map<string, BurstWindow>;
  __learnovaFallbackDailyUsage?: Map<string, { chat: number; flashcard: number; transcribe: number; voiceSeconds: number }>;
};

function getRateBuckets() {
  if (!g.__learnovaRateBuckets) {
    g.__learnovaRateBuckets = new Map();
  }
  return g.__learnovaRateBuckets;
}

function getFallbackDailyMap() {
  if (!g.__learnovaFallbackDailyUsage) {
    g.__learnovaFallbackDailyUsage = new Map();
  }
  return g.__learnovaFallbackDailyUsage;
}

const BURST_LIMITS: Record<NovaUsageKind, { maxRequests: number; windowMs: number }> = {
  chat: { maxRequests: 18, windowMs: 60_000 },
  flashcards: { maxRequests: 8, windowMs: 60_000 },
  transcribe: { maxRequests: 10, windowMs: 60_000 },
  qa_draft: { maxRequests: 12, windowMs: 60_000 },
  live_voice: { maxRequests: 6, windowMs: 300_000 },
};

export function checkSlidingWindowBurst(userId: string, kind: NovaUsageKind): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const cfg = BURST_LIMITS[kind];
  const key = `${userId}:${kind}`;
  const now = Date.now();
  const buckets = getRateBuckets();
  const entry = buckets.get(key) || { timestamps: [] };
  const valid = entry.timestamps.filter((ts) => now - ts < cfg.windowMs);

  if (valid.length >= cfg.maxRequests) {
    const oldest = valid[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((cfg.windowMs - (now - oldest)) / 1000));
    buckets.set(key, { timestamps: valid });
    return { allowed: false, retryAfterSeconds };
  }

  valid.push(now);
  buckets.set(key, { timestamps: valid });
  return { allowed: true, retryAfterSeconds: 0 };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function resolveUserTier(user: AuthenticatedSessionUser): Promise<{
  tierLabel: QuotaStatusResult["tierLabel"];
  dailyLimit: number;
  voiceMinutesLimit: number;
}> {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "TEACHER") {
    return {
      tierLabel: "EDUCATOR_STAFF",
      dailyLimit: 150,
      voiceMinutesLimit: 60,
    };
  }

  if (isSupabaseServerConfigured) {
    try {
      const sb = getSupabaseServerClient();
      const { data: ent } = await sb
        .from("subscription_entitlements")
        .select("access_status, expires_at")
        .eq("student_user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const active =
        ent &&
        (ent.access_status === "ACTIVE_PAID" || ent.access_status === "SCHOLARSHIP_GRANTED") &&
        (!ent.expires_at || new Date(ent.expires_at).getTime() > Date.now());

      if (active) {
        return {
          tierLabel: "ACTIVE_SCHOLAR",
          dailyLimit: 75,
          voiceMinutesLimit: 30,
        };
      }
    } catch {
      // ignore fallback check below
    }
  }

  return {
    tierLabel: "FREE_STARTER",
    dailyLimit: 5,
    voiceMinutesLimit: 5,
  };
}

async function readDailyUsageRow(userId: string) {
  const usageDate = todayIsoDate();
  if (isSupabaseServerConfigured) {
    try {
      const sb = getSupabaseServerClient();
      const { data, error } = await sb
        .from("ai_usage_quotas")
        .select("*")
        .eq("user_id", userId)
        .eq("usage_date", usageDate)
        .maybeSingle();

      if (!error) {
        return {
          fromDb: true,
          chatCount: Number(data?.chat_count || 0),
          flashcardCount: Number(data?.flashcard_count || 0),
          transcribeCount: Number(data?.transcribe_count || 0),
          voiceSeconds: Number(data?.voice_seconds || 0),
        };
      }
    } catch {
      // fall through to process map only if DB table unavailable
    }
  }

  const key = `${userId}:${usageDate}`;
  const rec = getFallbackDailyMap().get(key) || {
    chat: 0,
    flashcard: 0,
    transcribe: 0,
    voiceSeconds: 0,
  };
  return {
    fromDb: false,
    chatCount: rec.chat,
    flashcardCount: rec.flashcard,
    transcribeCount: rec.transcribe,
    voiceSeconds: rec.voiceSeconds,
  };
}

async function persistDailyUsageDelta(
  userId: string,
  delta: { chat?: number; flashcard?: number; transcribe?: number; voiceSeconds?: number }
) {
  const usageDate = todayIsoDate();
  const current = await readDailyUsageRow(userId);
  const next = {
    chat_count: current.chatCount + (delta.chat || 0),
    flashcard_count: current.flashcardCount + (delta.flashcard || 0),
    transcribe_count: current.transcribeCount + (delta.transcribe || 0),
    voice_seconds: current.voiceSeconds + (delta.voiceSeconds || 0),
  };

  if (isSupabaseServerConfigured) {
    try {
      const sb = getSupabaseServerClient();
      await sb.from("ai_usage_quotas").upsert(
        {
          user_id: userId,
          usage_date: usageDate,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,usage_date" }
      );
      return;
    } catch {
      // fall through
    }
  }

  getFallbackDailyMap().set(`${userId}:${usageDate}`, {
    chat: next.chat_count,
    flashcard: next.flashcard_count,
    transcribe: next.transcribe_count,
    voiceSeconds: next.voice_seconds,
  });
}

export async function getNovaQuotaStatus(user: AuthenticatedSessionUser): Promise<QuotaStatusResult> {
  const [tier, usage] = await Promise.all([
    resolveUserTier(user),
    readDailyUsageRow(user.id),
  ]);
  const usedToday = usage.chatCount + usage.flashcardCount + usage.transcribeCount;
  const remainingToday = Math.max(0, tier.dailyLimit - usedToday);

  return {
    allowed: remainingToday > 0,
    tierLabel: tier.tierLabel,
    dailyLimit: tier.dailyLimit,
    usedToday,
    remainingToday,
    voiceMinutesLimit: tier.voiceMinutesLimit,
    voiceSecondsUsed: usage.voiceSeconds,
  };
}

export async function enforceAndConsumeNovaQuota(
  user: AuthenticatedSessionUser,
  kind: NovaUsageKind
): Promise<QuotaStatusResult> {
  const burst = checkSlidingWindowBurst(user.id, kind);
  const status = await getNovaQuotaStatus(user);

  if (!burst.allowed) {
    return {
      ...status,
      allowed: false,
      retryAfterSeconds: burst.retryAfterSeconds,
      reason: `Too many Nova AI requests in a short time. Please wait ${burst.retryAfterSeconds}s and try again.`,
    };
  }

  if (kind === "live_voice") {
    const maxVoiceSec = status.voiceMinutesLimit * 60;
    if (status.voiceSecondsUsed >= maxVoiceSec) {
      return {
        ...status,
        allowed: false,
        reason:
          status.tierLabel === "FREE_STARTER"
            ? `Daily free Nova Live Voice limit (${status.voiceMinutesLimit} mins) reached. Upgrade to a Scholar Plan for 30 mins/day.`
            : `Daily Nova Live Voice limit (${status.voiceMinutesLimit} mins) reached. Resets at midnight UTC.`,
      };
    }
    return { ...status, allowed: true };
  }

  if (status.usedToday >= status.dailyLimit) {
    return {
      ...status,
      allowed: false,
      reason:
        status.tierLabel === "FREE_STARTER"
          ? `You've used all ${status.dailyLimit} free daily Nova AI study interactions. Activate a Scholar Plan in Subscriptions to unlock 75+ daily queries.`
          : `Daily Nova AI quota (${status.dailyLimit} interactions) reached. Quota resets tomorrow.`,
    };
  }

  await persistDailyUsageDelta(user.id, {
    chat: kind === "chat" || kind === "qa_draft" ? 1 : 0,
    flashcard: kind === "flashcards" ? 1 : 0,
    transcribe: kind === "transcribe" ? 1 : 0,
  });

  return {
    ...status,
    allowed: true,
    usedToday: status.usedToday + 1,
    remainingToday: Math.max(0, status.remainingToday - 1),
  };
}

export async function recordLiveVoiceSeconds(userId: string, seconds: number) {
  const clean = Math.max(0, Math.round(seconds));
  if (clean <= 0) return;
  await persistDailyUsageDelta(userId, { voiceSeconds: clean });
}

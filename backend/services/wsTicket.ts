import crypto from "crypto";

function getTicketSecret(): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.LIVEKIT_API_SECRET?.trim() ||
    "";
  if (!secret) {
    throw new Error("Server signing secret is not configured.");
  }
  return crypto.createHash("sha256").update(`learnova-ws:${secret}`).digest("hex");
}

export function signLiveVoiceTicket(userId: string, ttlSeconds = 120): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getTicketSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyLiveVoiceTicket(ticket: string): { userId: string } | null {
  try {
    const parts = ticket.split(".");
    if (parts.length !== 2) return null;
    const [payload, providedSig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", getTicketSecret())
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      uid?: string;
      exp?: number;
    };
    if (!decoded.uid || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { userId: decoded.uid };
  } catch {
    return null;
  }
}

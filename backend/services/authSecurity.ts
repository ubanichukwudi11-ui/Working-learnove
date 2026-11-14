import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "crypto";
import { z } from "zod";
import { getSupabaseServerClient } from "./supabaseServer";
import type { LmsUserRole } from "./lmsTypes";

function scryptDerive(
  password: string,
  salt: string,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

const CREDENTIALS_BUCKET = "learnova-lms-state";
const CREDENTIALS_OBJECT_PATH = "auth_credentials_v1.json";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LEN = 64;

export interface StoredCredentialRecord {
  userId: string;
  email: string;
  passwordHash: string;
  updatedAt: string;
}

export interface SignedSessionPayload {
  sub: string;
  email: string;
  role: LmsUserRole;
  iat: number;
  exp: number;
  jti: string;
}

/* =====================================================
   INPUT VALIDATION SCHEMAS (ZOD)
   ===================================================== */

const optionalTrimmedString = (max = 500) =>
  z
    .string()
    .nullish()
    .transform((val) => {
      if (typeof val !== "string") return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
    });

const optionalStringArray = (maxItems = 30) =>
  z
    .array(z.string())
    .nullish()
    .transform((arr) =>
      Array.isArray(arr)
        ? arr
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, maxItems)
        : undefined
    );

export const loginInputSchema = z.object({
  email: z
    .string({ message: "Email address is required." })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(254, "Email address is too long."),
  password: z
    .string({ message: "Password is required." })
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password must be at most 128 characters."),
});

export const registerInputSchema = z
  .object({
    role: z.enum(["STUDENT", "TEACHER", "PARENT"]).default("STUDENT"),
    fullName: optionalTrimmedString(150),
    firstName: optionalTrimmedString(80),
    lastName: optionalTrimmedString(80),
    email: z
      .string({ message: "Email address is required." })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address.")
      .max(254, "Email address is too long."),
    password: z
      .string({ message: "Password is required." })
      .min(8, "Password must be at least 8 characters long.")
      .max(128, "Password must be at most 128 characters.")
      .refine((pw) => /[A-Za-z]/.test(pw) && /[0-9]/.test(pw), {
        message: "Password must include at least one letter and one number.",
      }),
    phone: optionalTrimmedString(40),
    gender: optionalTrimmedString(30),
    country: optionalTrimmedString(80),
    state: optionalTrimmedString(80),
    address: optionalTrimmedString(250),
    dob: optionalTrimmedString(40),
    profilePhoto: optionalTrimmedString(1000),
    classLevel: optionalTrimmedString(80),
    age: z
      .union([z.number(), z.string()])
      .nullish()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = Number(val);
        if (!Number.isFinite(num) || num < 3 || num > 100) return undefined;
        return Math.floor(num);
      }),
    aiPurpose: optionalStringArray(20),
    examPreparation: optionalTrimmedString(120),
    favouriteSubjects: optionalStringArray(20),
    learningStyle: optionalStringArray(20),
    studyHours: optionalTrimmedString(80),
    studyTime: optionalTrimmedString(80),
    learningGoal: optionalTrimmedString(500),
    reminders: optionalTrimmedString(120),
    subject: optionalTrimmedString(120),
    subjectApplications: z
      .array(
        z.object({
          subjectId: z.string().trim().min(1),
          classLevelIds: z.array(z.string().trim().min(1)).optional(),
        })
      )
      .optional(),
    qualification: optionalTrimmedString(160),
    institution: optionalTrimmedString(160),
    experience: optionalTrimmedString(80),
    licenseNumber: optionalTrimmedString(80),
    bio: optionalTrimmedString(1000),
    certificate: optionalTrimmedString(1000),
    degreeCertificate: optionalTrimmedString(1000),
    governmentId: optionalTrimmedString(1000),
    cv: optionalTrimmedString(1000),
    studentName: optionalTrimmedString(150),
    childIdNumber: optionalTrimmedString(80),
    relationship: optionalTrimmedString(60),
  })
  .superRefine((data, ctx) => {
    const resolvedName = (
      data.fullName ||
      (data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : data.firstName || "")
    ).trim();
    if (resolvedName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "Full name must be at least 2 characters.",
      });
    }
  });

export const sessionExchangeSchema = z.object({
  accessToken: z
    .string({ message: "Access token is required." })
    .trim()
    .min(20, "Invalid session access token."),
});

/* =====================================================
   PASSWORD HASHING (CRYPTOGRAPHIC SCRYPT + TIMING SAFE)
   ===================================================== */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptDerive(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expectedHex = parts[5];

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !expectedHex) {
    return false;
  }

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const derived = await scryptDerive(password, salt, expectedBuf.length, {
    N,
    r,
    p,
  });

  if (derived.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(derived, expectedBuf);
}

/* =====================================================
   HMAC-SHA256 SIGNED SERVER SESSION TOKENS
   ===================================================== */

function getSessionSecret(): string {
  const configured =
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  return "learnova-server-session-signing-key-v1";
}

export function createSignedSessionToken(
  user: { id: string; email: string; role: LmsUserRole },
  ttlSeconds = 60 * 60 * 24 * 7
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedSessionPayload = {
    sub: user.id,
    email: user.email.toLowerCase(),
    role: user.role,
    iat: now,
    exp: now + ttlSeconds,
    jti: randomBytes(12).toString("hex"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifySignedSessionToken(
  token: string
): SignedSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as SignedSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!parsed.sub || !parsed.email || !parsed.exp || parsed.exp <= now) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* =====================================================
   IN-MEMORY RATE LIMITER (BRUTE-FORCE PROTECTION)
   ===================================================== */

interface RateBucket {
  count: number;
  resetAt: number;
}

const gAuth = globalThis as unknown as {
  __learnovaAuthRateMap?: Map<string, RateBucket>;
  __learnovaCredCache?: Map<string, StoredCredentialRecord>;
  __learnovaCredWriteChain?: Promise<unknown>;
};

function getRateMap(): Map<string, RateBucket> {
  if (!gAuth.__learnovaAuthRateMap) {
    gAuth.__learnovaAuthRateMap = new Map();
  }
  return gAuth.__learnovaAuthRateMap;
}

export function checkAuthRateLimit(
  key: string,
  maxAttempts = 15,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const map = getRateMap();
  const now = Date.now();
  const existing = map.get(key);
  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAuthRateLimit(key: string) {
  getRateMap().delete(key);
}

/* =====================================================
   PERSISTENT CREDENTIAL HASH STORE (SUPABASE STORAGE)
   ===================================================== */

async function loadCredentialMap(): Promise<Map<string, StoredCredentialRecord>> {
  if (gAuth.__learnovaCredCache) {
    return gAuth.__learnovaCredCache;
  }
  const map = new Map<string, StoredCredentialRecord>();
  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb.storage
      .from(CREDENTIALS_BUCKET)
      .download(CREDENTIALS_OBJECT_PATH);
    if (!error && data) {
      const parsed = JSON.parse(await data.text()) as StoredCredentialRecord[];
      if (Array.isArray(parsed)) {
        for (const rec of parsed) {
          if (rec?.email && rec?.passwordHash) {
            map.set(rec.email.toLowerCase(), rec);
          }
        }
      }
    }
  } catch {
    // non-fatal on first initialization
  }
  gAuth.__learnovaCredCache = map;
  return map;
}

export async function getStoredCredentialHash(
  email: string
): Promise<StoredCredentialRecord | null> {
  const map = await loadCredentialMap();
  return map.get(email.trim().toLowerCase()) || null;
}

export async function saveCredentialHash(
  userId: string,
  email: string,
  passwordHash: string
): Promise<void> {
  const prev = gAuth.__learnovaCredWriteChain || Promise.resolve();
  const next = prev.then(async () => {
    const map = await loadCredentialMap();
    const cleanEmail = email.trim().toLowerCase();
    map.set(cleanEmail, {
      userId,
      email: cleanEmail,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    try {
      const sb = getSupabaseServerClient();
      const { data: buckets } = await sb.storage.listBuckets();
      if (!buckets?.some((b) => b.id === CREDENTIALS_BUCKET)) {
        await sb.storage.createBucket(CREDENTIALS_BUCKET, { public: false });
      }
      const payload = Buffer.from(
        JSON.stringify(Array.from(map.values())),
        "utf-8"
      );
      await sb.storage
        .from(CREDENTIALS_BUCKET)
        .upload(CREDENTIALS_OBJECT_PATH, payload, {
          contentType: "application/json",
          upsert: true,
        });
    } catch (err) {
      console.warn("Credential hash persistence warning:", err);
    }
  });
  gAuth.__learnovaCredWriteChain = next.catch(() => {});
  await next;
}

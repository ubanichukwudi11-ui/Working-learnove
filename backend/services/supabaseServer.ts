import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_AUTH_TIMEOUT_MS = 6500;
export const DEFAULT_SUPABASE_QUERY_TIMEOUT_MS = 4000;
export const DEFAULT_SUPABASE_STORAGE_TIMEOUT_MS = 5000;

export const SUPABASE_SERVER_CONFIG_ERROR =
  "Supabase server is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment variables.";

export interface SupabaseServerConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  const isConfigured = Boolean(
    url &&
      !url.includes("placeholder") &&
      isValidHttpUrl(url) &&
      key &&
      !key.includes("placeholder")
  );

  return { url, key, isConfigured };
}

export function checkSupabaseServerConfigured(): boolean {
  return getSupabaseServerConfig().isConfigured;
}

// Preserved for existing callers; dynamic callers should use checkSupabaseServerConfigured()
export const isSupabaseServerConfigured = checkSupabaseServerConfigured();

export class SupabaseTimeoutError extends Error {
  status = 504;
  constructor(operation = "Supabase request", timeoutMs = DEFAULT_SUPABASE_AUTH_TIMEOUT_MS) {
    super(`${operation} timed out after ${timeoutMs}ms.`);
    this.name = "SupabaseTimeoutError";
  }
}

function createTimedFetch(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const externalSignal = init?.signal;

    const onExternalAbort = () => {
      controller.abort(externalSignal?.reason);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    const timer = setTimeout(() => {
      controller.abort(new SupabaseTimeoutError("Supabase request", timeoutMs));
    }, timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (controller.signal.aborted && !externalSignal?.aborted) {
        throw new SupabaseTimeoutError("Supabase request", timeoutMs);
      }
      throw err;
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    }
  };
}

export function getSupabaseServerClient(options?: {
  timeoutMs?: number;
}): SupabaseClient {
  const { url, key, isConfigured } = getSupabaseServerConfig();
  if (!isConfigured) {
    throw new Error(SUPABASE_SERVER_CONFIG_ERROR);
  }

  const timeoutMs =
    typeof options?.timeoutMs === "number" && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_SUPABASE_AUTH_TIMEOUT_MS;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: createTimedFetch(timeoutMs),
    },
  });
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new SupabaseTimeoutError(operation, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function isSupabaseTimeoutError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof SupabaseTimeoutError) return true;
  const anyErr = err as { name?: string; message?: string; code?: string };
  const name = String(anyErr.name || "").toLowerCase();
  const msg = String(anyErr.message || "").toLowerCase();
  const code = String(anyErr.code || "").toLowerCase();
  return (
    name === "supabasetimeouterror" ||
    name === "aborterror" ||
    name === "timeouterror" ||
    code === "etimedout" ||
    code === "und_err_headers_timeout" ||
    code === "und_err_connect_timeout" ||
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("aborted")
  );
}

export function isSupabaseConnectivityError(err: unknown): boolean {
  if (!err) return false;
  if (isSupabaseTimeoutError(err)) return true;
  const anyErr = err as {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
  };
  const name = String(anyErr.name || "").toLowerCase();
  const msg = String(anyErr.message || "").toLowerCase();
  const code = String(anyErr.code || "").toLowerCase();
  const status = typeof anyErr.status === "number" ? anyErr.status : undefined;

  return (
    name === "authretryablefetcherror" ||
    status === 0 ||
    (status !== undefined && status >= 502 && status <= 599) ||
    code === "econnrefused" ||
    code === "enotfound" ||
    code === "eai_again" ||
    code === "econnreset" ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("eai_again") ||
    msg.includes("socket hang up")
  );
}


const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname.trim().toLowerCase());
}

/**
 * Resolves the canonical application origin on the client.
 * Uses NEXT_PUBLIC_APP_URL in production when valid and non-local,
 * falls back to window.location.origin (never leaking localhost in production),
 * and preserves localhost:3000 only during local development.
 */
export function getClientAppOrigin(): string {
  const configuredRaw = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "") || "";

  let configuredOrigin: string | null = null;
  let configuredIsLocal = false;

  if (configuredRaw) {
    try {
      const parsed = new URL(configuredRaw);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        configuredIsLocal = isLocalHostname(parsed.hostname);
        configuredOrigin = parsed.origin;
      }
    } catch {
      configuredOrigin = null;
    }
  }

  if (typeof window !== "undefined") {
    const browserOrigin = window.location.origin.replace(/\/+$/, "");
    const browserIsLocal = isLocalHostname(window.location.hostname);

    if (browserIsLocal) {
      return browserOrigin;
    }

    if (configuredOrigin && !configuredIsLocal) {
      if (window.location.protocol === "https:" && configuredOrigin.startsWith("http://")) {
        return `https://${configuredOrigin.slice("http://".length)}`;
      }
      return configuredOrigin;
    }

    return browserOrigin;
  }

  if (configuredOrigin && !configuredIsLocal) {
    return configuredOrigin;
  }

  const railwayDomain = process.env.NEXT_PUBLIC_RAILWAY_PUBLIC_DOMAIN?.trim()?.replace(/\/+$/, "");
  if (railwayDomain && !isLocalHostname(railwayDomain.split(":")[0])) {
    return `https://${railwayDomain}`;
  }

  return configuredOrigin || "http://localhost:3000";
}

export function getAuthCallbackUrl(): string {
  return `${getClientAppOrigin()}/auth/callback`;
}

export function getPasswordResetRedirectUrl(): string {
  return `${getClientAppOrigin()}/forgot-password`;
}

export function sanitizePostAuthRedirect(rawPath?: string | null, fallback = "/dashboard"): string {
  if (!rawPath || typeof rawPath !== "string") return fallback;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower === "/login" ||
    lower.startsWith("/login?") ||
    lower.startsWith("/auth/") ||
    lower.startsWith("/register") ||
    lower.startsWith("/forgot-password")
  ) {
    return fallback;
  }
  return trimmed;
}

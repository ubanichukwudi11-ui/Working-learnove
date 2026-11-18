import fs from "fs";
import path from "path";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleNovaLiveConnection } from "./ai/novaLiveBridge";
import { isGeminiConfigured } from "./ai/geminiClient";
import { checkSupabaseServerConfigured } from "./services/supabaseServer";

const dev = process.env.NODE_ENV !== "production";

function applyBuildOutputConfigFromManifest() {
  if (dev) return;
  try {
    const manifestPath = path.join(process.cwd(), ".next", "required-server-files.json");
    if (!fs.existsSync(manifestPath)) return;
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as { config?: { output?: string } };
    if (parsed?.config?.output === "standalone") {
      if (!process.env.__NEXT_PRIVATE_STANDALONE_CONFIG) {
        process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(parsed.config);
      }
    } else if (!process.env.LEARNOVA_NEXT_OUTPUT) {
      process.env.LEARNOVA_NEXT_OUTPUT = "standard";
    }
  } catch {
    // Ignore unreadable manifest and let Next load config normally
  }
}

function logStartupConfiguration() {
  const requiredChecks = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) },
    { name: "SUPABASE_SERVICE_ROLE_KEY", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) },
    { name: "GEMINI_API_KEY", ok: isGeminiConfigured() },
  ];

  const integrationChecks = [
    {
      name: "LIVEKIT (URL/KEY/SECRET)",
      ok: Boolean(
        process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim() &&
          process.env.LIVEKIT_API_KEY?.trim() &&
          process.env.LIVEKIT_API_SECRET?.trim()
      ),
    },
    { name: "PAYSTACK_SECRET_KEY", ok: Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()) },
    { name: "RESEND_API_KEY", ok: Boolean(process.env.RESEND_API_KEY?.trim()) },
    { name: "NEXT_PUBLIC_APP_URL", ok: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()) },
  ];

  const missingRequired = requiredChecks.filter((c) => !c.ok).map((c) => c.name);
  const missingIntegrations = integrationChecks.filter((c) => !c.ok).map((c) => c.name);

  console.log(
    `> Learnova config check: supabase=${checkSupabaseServerConfigured() ? "configured" : "MISSING"}, gemini=${isGeminiConfigured() ? "configured" : "MISSING"}`
  );

  if (missingRequired.length > 0) {
    console.warn(
      `> Learnova startup warning — missing required environment variable(s): ${missingRequired.join(", ")}`
    );
  }
  if (missingIntegrations.length > 0) {
    console.warn(
      `> Learnova startup notice — unconfigured optional integration variable(s): ${missingIntegrations.join(", ")}`
    );
  }
}

applyBuildOutputConfigFromManifest();

const rawHost = (process.env.HOST || "").trim();
const hostname =
  rawHost === "localhost" ||
  rawHost === "127.0.0.1" ||
  rawHost === "0.0.0.0" ||
  rawHost === "::" ||
  /^\d{1,3}(\.\d{1,3}){3}$/.test(rawHost)
    ? rawHost
    : "0.0.0.0";

const parsedPort = Number.parseInt(process.env.PORT || "", 10);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const app = next({
  dev,
  dir: process.cwd(),
  hostname,
  port,
});
const handle = app.getRequestHandler();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection in Learnova server:", reason);
});

async function startServer() {
  logStartupConfiguration();
  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl).catch((err) => {
      console.error("Unhandled Next.js request error:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  });

  // Keep connections open slightly longer than common reverse-proxy (Railway/Envoy) 60s idle timeouts
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req) => {
    handleNovaLiveConnection(ws, req);
  });

  wss.on("error", (err) => {
    console.error("Nova Live WebSocketServer error:", err);
  });

  function isAllowedWebSocketOrigin(req: import("http").IncomingMessage): boolean {
    const originHeader = req.headers.origin;
    if (!originHeader) return true;
    try {
      const originUrl = new URL(originHeader);
      const originHost = originUrl.host.toLowerCase();
      const allowedHosts = new Set<string>();

      const addHost = (raw?: string) => {
        const cleaned = (raw || "").split(",")[0].trim().toLowerCase();
        if (cleaned) allowedHosts.add(cleaned);
      };

      addHost(
        typeof req.headers["x-forwarded-host"] === "string"
          ? req.headers["x-forwarded-host"]
          : undefined
      );
      addHost(req.headers.host);
      addHost(process.env.RAILWAY_PUBLIC_DOMAIN);

      const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL?.trim();
      if (appUrlRaw) {
        try {
          allowedHosts.add(new URL(appUrlRaw).host.toLowerCase());
        } catch {
          // ignore invalid NEXT_PUBLIC_APP_URL
        }
      }

      if (dev && (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")) {
        return true;
      }

      return allowedHosts.has(originHost);
    } catch {
      return false;
    }
  }

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url || "/", true);
    if (pathname === "/ws/nova-live") {
      if (!isAllowedWebSocketOrigin(req)) {
        socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  server.on("error", (err) => {
    console.error("HTTP server error:", err);
    process.exit(1);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`> Received ${signal}, shutting down Learnova server gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error("Forced shutdown after graceful timeout.");
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    for (const client of wss.clients) {
      try {
        client.close(1001, "Server shutting down");
      } catch {
        // ignore client close errors
      }
    }

    wss.close(() => {
      server.close(() => {
        app
          .close()
          .catch(() => {})
          .finally(() => {
            clearTimeout(forceExitTimer);
            process.exit(0);
          });
      });
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  server.listen(port, hostname, () => {
    console.log(
      `> Learnova full-stack server ready on http://${hostname}:${port} (${dev ? "dev" : "production"})`
    );
  });
}

startServer().catch((err) => {
  console.error("Failed to start Learnova backend server:", err);
  process.exit(1);
});

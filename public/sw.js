const CACHE_NAME = "learnova-offline-v1";
const PRECACHE_URLS = [
  "/",
  "/login",
  "/notebook",
  "/videos",
  "/assignments",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache auth or mutable API state except downloadable study sheets
  const isMaterialDownload = url.pathname.startsWith(
    "/api/lms/videos/materials/download"
  );
  if (url.pathname.startsWith("/api/") && !isMaterialDownload) {
    return;
  }

  // Cache-first for Next.js immutable static bundles & downloaded study handouts
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    isMaterialDownload
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Network-first for HTML page routes with cached fallback for offline study (Notebook, Videos, CBT)
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallbackNotebook = await caches.match("/notebook");
          return (
            fallbackNotebook ||
            new Response(
              `<!doctype html><html><body style="font-family:sans-serif;padding:40px;background:#F7F8FA;color:#0B1F3A;"><h2>You are offline</h2><p>Reconnect to the internet to sync live classes and quizzes, or return to your cached <a href="/notebook">Study Notebook</a>.</p></body></html>`,
              { headers: { "Content-Type": "text/html" } }
            )
          );
        })
    );
  }
});

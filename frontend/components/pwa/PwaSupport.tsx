"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Share, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // non-fatal registration failure in restricted environments
      });
  }, []);

  return null;
}

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg text-xs text-amber-950 flex items-start gap-2.5"
    >
      <WifiOff size={16} className="text-[#D97706] shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-bold">Low-Data / Offline Mode Active</p>
        <p className="text-amber-900 leading-relaxed">
          Your saved{" "}
          <Link href="/notebook" className="underline font-bold">
            Study Notebook
          </Link>{" "}
          notes and downloaded PDF study sheets remain available offline.
        </p>
      </div>
    </div>
  );
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent || "";
    const iosDevice = /iPad|iPhone|iPod/.test(ua);
    setIsIos(iosDevice);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-2 text-xs font-bold text-[#0D9488] transition whitespace-nowrap shrink-0"
        title="Install Learnova for faster low-data & offline revision"
      >
        <Download size={14} />
        <span className="hidden md:inline">Install App</span>
      </button>

      {showIosGuide && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0B1F3A]">Install on iPhone / iPad</span>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-slate-600 leading-relaxed flex items-start gap-1.5">
            <Share size={14} className="text-[#0D9488] shrink-0 mt-0.5" />
            Tap the Safari <strong>Share</strong> button and choose{" "}
            <strong>&ldquo;Add to Home Screen&rdquo;</strong> for offline Study Notebook &amp; PDF access.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import RoleSidebar from "./RoleSidebar";
import AppNavbar, { type HeaderMode } from "./AppNavbar";
import MobileBottomNav from "./MobileBottomNav";
import {
  OfflineIndicator,
  ServiceWorkerRegistrar,
} from "@frontend/components/pwa/PwaSupport";

const DASHBOARD_HOME_PATHS = new Set([
  "/dashboard",
  "/teacher",
  "/parent",
  "/admin",
  "/super-admin",
]);

const IMMERSIVE_PREFIXES = ["/videos", "/nova", "/notebook"];

function resolveHeaderMode(pathname: string, override?: HeaderMode): HeaderMode {
  if (override) return override;
  if (DASHBOARD_HOME_PATHS.has(pathname)) return "dashboard";
  if (
    IMMERSIVE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return "immersive";
  }
  return "compact";
}

function AppLayoutInner({
  children,
  headerMode,
}: {
  children: React.ReactNode;
  headerMode?: HeaderMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const resolvedMode = useMemo(
    () => resolveHeaderMode(pathname, headerMode),
    [pathname, headerMode]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Apply persisted accessibility preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const reducedMotion = localStorage.getItem("learnova_reduced_motion") === "true";
      const highContrast = localStorage.getItem("learnova_high_contrast") === "true";
      document.documentElement.classList.toggle("reduce-motion", reducedMotion);
      document.documentElement.classList.toggle("high-contrast", highContrast);
    } catch {
      // ignore storage unavailability
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)]">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[var(--foreground-muted)]">
            Loading Learnova workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const mainTopPadding =
    resolvedMode === "dashboard"
      ? "pt-22"
      : resolvedMode === "immersive"
      ? "pt-14"
      : "pt-16";

  return (
    <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)] overflow-x-clip">
      <ServiceWorkerRegistrar />
      <RoleSidebar role={user.role} status={user.status} />

      <div className="md:pl-[76px] min-h-screen flex flex-col min-w-0">
        <AppNavbar user={user} onLogout={handleLogout} mode={resolvedMode} />

        <main
          className={`flex-1 ${mainTopPadding} pb-24 md:pb-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto min-w-0`}
        >
          {children}
        </main>
      </div>

      <OfflineIndicator />
      <MobileBottomNav role={user.role} status={user.status} />
    </div>
  );
}

export default function AppLayout({
  children,
  headerMode,
}: {
  children: React.ReactNode;
  headerMode?: HeaderMode;
}) {
  return (
    <SidebarProvider>
      <AppLayoutInner headerMode={headerMode}>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
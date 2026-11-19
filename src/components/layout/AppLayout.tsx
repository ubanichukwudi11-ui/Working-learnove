"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import RoleSidebar from "./RoleSidebar";
import AppNavbar, { type LayoutChromeMode } from "./AppNavbar";
import MobileBottomNav from "./MobileBottomNav";
import {
  OfflineIndicator,
  ServiceWorkerRegistrar,
} from "@frontend/components/pwa/PwaSupport";

const DASHBOARD_EXACT_ROUTES = new Set([
  "/dashboard",
  "/teacher",
  "/parent",
  "/admin",
  "/super-admin",
]);

const IMMERSIVE_PREFIXES = [
  "/nova",
  "/videos",
  "/live-classes",
  "/teacher/videos",
  "/admin/videos",
];

function resolveChromeMode(pathname: string): LayoutChromeMode {
  if (DASHBOARD_EXACT_ROUTES.has(pathname)) {
    return "dashboard";
  }
  if (
    IMMERSIVE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
  ) {
    return "immersive";
  }
  return "compact";
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { collapsed } = useSidebar();

  const chromeMode = useMemo(() => resolveChromeMode(pathname), [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

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
    chromeMode === "dashboard"
      ? "pt-22"
      : chromeMode === "compact"
      ? "pt-16"
      : "pt-14";

  return (
    <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender text-[var(--foreground)]">
      <ServiceWorkerRegistrar />
      <RoleSidebar role={user.role} userStatus={user.status} />

      <div
        className={`transition-[padding] duration-200 ease-out min-h-screen flex flex-col min-w-0 ${
          collapsed ? "md:pl-[76px]" : "md:pl-64"
        }`}
      >
        <AppNavbar user={user} mode={chromeMode} onLogout={handleLogout} />

        <main
          className={`flex-1 ${mainTopPadding} pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto min-w-0`}
        >
          {children}
        </main>
      </div>

      <OfflineIndicator />
      <MobileBottomNav role={user.role} userStatus={user.status} />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}